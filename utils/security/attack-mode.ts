import { createHash } from "crypto";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import PageView from "@/db/models/PageView";
import type { IWebsite } from "@/db/models/Website";

/** Auto-activated attack mode switches itself off after this long. */
export const ATTACK_MODE_EXPIRY_MS = 24 * 60 * 60 * 1000;
/** Requests per minute allowed from one IP while attack mode is on. */
export const ATTACK_MODE_PER_IP_LIMIT = 10;
/** How often (per website, per server instance) the spike check runs. */
const SPIKE_CHECK_INTERVAL_MS = 60 * 1000;

const lastSpikeCheck = new Map<string, number>();

/**
 * One-way hash of an IP, salted with the website id so it cannot be joined
 * across websites. The raw IP is never stored.
 */
export function hashIp(ip: string, websiteId: string): string {
  return createHash("sha256").update(`${ip}${websiteId}`).digest("hex");
}

async function loadWebsite(
  websiteId: string,
  website?: IWebsite | null,
): Promise<IWebsite | null> {
  if (website) return website;
  await connectDB();
  return Website.findById(websiteId);
}

/**
 * Turn attack mode on when the last hour's page views exceed the threshold,
 * and off again when traffic drops back below it or 24h have passed since
 * it was auto-activated. Only applies when autoActivate is set; manual
 * attack mode is left alone. Returns true when attack mode was activated.
 */
export async function checkTrafficSpike(
  websiteId: string,
  website?: IWebsite | null,
): Promise<boolean> {
  try {
    const now = Date.now();
    const last = lastSpikeCheck.get(websiteId) || 0;
    if (now - last < SPIKE_CHECK_INTERVAL_MS) return false;
    lastSpikeCheck.set(websiteId, now);
    if (lastSpikeCheck.size > 10000) lastSpikeCheck.clear();

    const site = await loadWebsite(websiteId, website);
    const attackMode = site?.settings?.attackMode;
    if (!site || !attackMode?.autoActivate) {
      return false;
    }

    const threshold = attackMode.threshold || 1000;
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    const recentViews = await PageView.countDocuments({
      websiteId,
      timestamp: { $gte: oneHourAgo },
    });

    if (!attackMode.enabled) {
      if (recentViews > threshold) {
        await Website.findByIdAndUpdate(websiteId, {
          "settings.attackMode.enabled": true,
          "settings.attackMode.activatedAt": new Date(now),
        });
        if (site.settings?.attackMode) {
          site.settings.attackMode.enabled = true;
          site.settings.attackMode.activatedAt = new Date(now);
        }
        return true;
      }
      return false;
    }

    // Attack mode is on: switch it off once the spike is over or it expired.
    const activatedAt = attackMode.activatedAt
      ? new Date(attackMode.activatedAt).getTime()
      : null;
    const expired =
      activatedAt !== null && now - activatedAt > ATTACK_MODE_EXPIRY_MS;
    if (recentViews < threshold || expired) {
      await Website.findByIdAndUpdate(websiteId, {
        "settings.attackMode.enabled": false,
        $unset: { "settings.attackMode.activatedAt": "" },
      });
      if (site.settings?.attackMode) {
        site.settings.attackMode.enabled = false;
        site.settings.attackMode.activatedAt = undefined;
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Apply attack mode protections: while attack mode is on, allow at most
 * ATTACK_MODE_PER_IP_LIMIT page views per minute per (hashed) IP.
 * `ipHash` is the value from hashIp(); pass the website to skip a lookup.
 */
export async function applyAttackModeProtections(
  websiteId: string,
  ipHash: string,
  website?: IWebsite | null,
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const site = await loadWebsite(websiteId, website);

    if (!site?.settings?.attackMode?.enabled) {
      return { allowed: true };
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const recentViewsFromIP = await PageView.countDocuments({
      websiteId,
      ipHash,
      timestamp: { $gte: oneMinuteAgo },
    });

    if (recentViewsFromIP >= ATTACK_MODE_PER_IP_LIMIT) {
      return {
        allowed: false,
        reason: "Rate limit exceeded. Attack mode is active.",
      };
    }

    return { allowed: true };
  } catch (error) {
    // Fail open - allow request if check fails
    return { allowed: true };
  }
}
