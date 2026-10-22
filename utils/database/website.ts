import connectDB from "@/db";
import Website from "@/db/models/Website";
import { randomBytes } from "crypto";
import { isValidObjectId } from "@/utils/validation";
import {
  getWebsiteDomains,
  hostMatchesDomain,
  normalizeHost,
} from "@/utils/tracking/referrer";

export function generateTrackingCode(): string {
  return randomBytes(12).toString("hex");
}

export async function getWebsitesByUserId(userId: string) {
  await connectDB();

  try {
    const websites = await Website.find({ userId }).sort({ createdAt: -1 });
    return websites;
  } catch (error) {
    throw error;
  }
}

export async function getWebsiteById(websiteId: string) {
  await connectDB();

  try {
    if (!isValidObjectId(websiteId)) {
      return null;
    }
    const website = await Website.findById(websiteId);
    return website;
  } catch (error) {
    throw error;
  }
}

/**
 * Hostnames always accepted for any tracking code: local development and
 * Vercel preview deployments.
 */
function isAllowedDevHostname(host: string): boolean {
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "::1" ||
    host.endsWith(".vercel.app")
  );
}

/**
 * Look up a website by its tracking code (with or without the "pmid_" prefix).
 * When a real hostname is given, returns null unless it is the website's
 * domain, a subdomain, an additional domain, localhost or a *.vercel.app
 * preview.
 */
export async function getWebsiteByTrackingCode(
  trackingCode: string,
  hostname?: string,
) {
  await connectDB();

  try {
    const codeForLookup = trackingCode.startsWith("pmid_")
      ? trackingCode.substring(5)
      : trackingCode;

    const website = await Website.findOne({ trackingCode: codeForLookup });
    if (!website) return null;

    // Callers that pass no hostname (goals, identify) or a placeholder
    // ("unknown", used when the request carried no body) are not validated.
    const checkHostname = normalizeHost(hostname);
    if (!checkHostname || checkHostname === "unknown") {
      return website;
    }

    if (isAllowedDevHostname(checkHostname)) {
      return website;
    }

    if (
      getWebsiteDomains(website).some((d) => hostMatchesDomain(checkHostname, d))
    ) {
      return website;
    }

    // The tracking code is being used on a hostname this website does not own.
    return null;
  } catch (error) {
    throw error;
  }
}

export async function createWebsite(data: {
  userId: string;
  domain: string;
  name: string;
  iconUrl?: string;
  settings?: any;
}) {
  await connectDB();

  try {
    let trackingCode = generateTrackingCode();
    let exists = await Website.findOne({ trackingCode });

    while (exists) {
      trackingCode = generateTrackingCode();
      exists = await Website.findOne({ trackingCode });
    }

    const defaultSettings = {
      hashPaths: false,
      trackScroll: false,
      trackUserIdentification: false,
    };
    const website = new Website({
      userId: data.userId,
      domain: data.domain,
      name: data.name,
      iconUrl: data.iconUrl,
      trackingCode,
      settings:
        typeof data.settings === "object" && data.settings !== null
          ? { ...defaultSettings, ...data.settings }
          : defaultSettings,
    });

    await website.save();
    return website;
  } catch (error) {
    throw error;
  }
}

export async function updateWebsite(
  websiteId: string,
  updates: {
    name?: string;
    domain?: string;
    iconUrl?: string;
    settings?: any;
    paymentProviders?: any;
  },
) {
  await connectDB();

  try {
    const website = await Website.findByIdAndUpdate(
      websiteId,
      { $set: updates },
      { new: true, runValidators: true },
    );

    return website;
  } catch (error) {
    throw error;
  }
}

export async function deleteWebsite(websiteId: string) {
  await connectDB();

  try {
    await Website.findByIdAndDelete(websiteId);
  } catch (error) {
    throw error;
  }
}
