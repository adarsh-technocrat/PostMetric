import { enqueueSyncJob, cancelPendingJobs } from "./queue";
import { getWebsiteById } from "@/utils/database/website";
import type { SyncJobProvider, SyncRange } from "@/db/models/SyncJob";
import connectDB from "@/db";
import SyncJob from "@/db/models/SyncJob";
import { Types } from "mongoose";

export async function registerPaymentProviderSync(
  websiteId: string,
  provider: SyncJobProvider,
  overrideConfig?: {
    stripe?: {
      apiKey?: string;
      webhookSecret?: string;
      syncConfig?: {
        enabled?: boolean;
        frequency?: "realtime" | "hourly" | "every-6-hours" | "daily";
        lastSyncAt?: Date;
        nextSyncAt?: Date;
      };
    };
  }
): Promise<void> {
  const website = await getWebsiteById(websiteId);
  if (!website) {
    throw new Error("Website not found");
  }

  // Map provider name to Website model property name
  const providerKeyMap: Record<
    SyncJobProvider,
    keyof NonNullable<typeof website.paymentProviders>
  > = {
    stripe: "stripe",
    lemonsqueezy: "lemonSqueezy",
    polar: "polar",
    paddle: "paddle",
  };

  const providerKey = providerKeyMap[provider];

  // For Stripe, check if API key exists and get sync config
  if (provider === "stripe") {
    // Use override config if provided, otherwise fetch from database
    const stripeConfig =
      overrideConfig?.stripe || website.paymentProviders?.stripe;
    if (!stripeConfig) {
      throw new Error(`Provider ${provider} not configured`);
    }
    if (!stripeConfig.apiKey) {
      throw new Error("Stripe API key not configured");
    }
    // Determine sync frequency (default: realtime for 5-minute cron)
    const frequency = stripeConfig.syncConfig?.frequency || "realtime";
    const enabled = stripeConfig.syncConfig?.enabled !== false;

    if (!enabled) {
      return; // Don't register if sync is disabled
    }

    // Check if this is the first sync (no completed sync jobs exist)
    await connectDB();
    const existingSync = await SyncJob.findOne({
      websiteId: new Types.ObjectId(websiteId),
      provider: "stripe",
      status: "completed",
    });

    let startDate: Date;
    let endDate: Date;
    let syncRange: SyncRange;
    let priority: number;

    if (!existingSync) {
      // First sync: Sync 2 years of historical data
      // This ensures users get their complete payment history when they first add Stripe
      endDate = new Date();
      // Sync 2 years of historical data
      startDate = new Date(endDate.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      syncRange = "custom";
      priority = 90; // High priority for initial historical sync
      console.log(
        `First sync detected for website ${websiteId}, syncing 2 years of historical data`
      );
    } else {
      // Regular periodic sync: Use frequency-based date range
      const dateRange = getSyncDateRange(frequency);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
      syncRange = dateRange.syncRange;
      priority = 60; // Medium-high priority for periodic syncs
    }

    // Enqueue sync job
    await enqueueSyncJob({
      websiteId,
      provider,
      type: "periodic",
      priority,
      startDate,
      endDate,
      syncRange,
    });

    console.log(
      `Registered ${frequency} sync job for website ${websiteId}, provider ${provider}`
    );
    return;
  }

  // For other providers, sync is not yet implemented
  throw new Error(`Sync for provider ${provider} is not yet implemented`);
}

/**
 * Get sync date range based on frequency
 */
function getSyncDateRange(
  frequency: "realtime" | "hourly" | "every-6-hours" | "daily"
): {
  startDate: Date;
  endDate: Date;
  syncRange: SyncRange;
} {
  const endDate = new Date();
  let startDate: Date;
  let syncRange: SyncRange;

  switch (frequency) {
    case "realtime":
      // For 5-minute cron: Sync last 15 minutes with buffer
      // This ensures we catch all payments while being efficient
      startDate = new Date(endDate.getTime() - 15 * 60 * 1000); // 15 minutes
      syncRange = "custom";
      break;
    case "hourly":
      // Sync last 24 hours with 2 hour buffer to catch any missed payments
      // This ensures we don't miss payments due to timezone differences or delays
      startDate = new Date(endDate.getTime() - 26 * 60 * 60 * 1000);
      syncRange = "last24h";
      break;
    case "every-6-hours":
      // Sync last 48 hours to ensure comprehensive coverage
      startDate = new Date(endDate.getTime() - 48 * 60 * 60 * 1000);
      syncRange = "last24h";
      break;
    case "daily":
      // Sync last 7 days + 1 day buffer for timezone differences
      startDate = new Date(endDate.getTime() - 8 * 24 * 60 * 60 * 1000);
      syncRange = "last7d";
      break;
    default:
      // Default to realtime (15 minutes) for frequent cron jobs
      startDate = new Date(endDate.getTime() - 15 * 60 * 1000);
      syncRange = "custom";
  }

  return { startDate, endDate, syncRange };
}

/**
 * Unregister sync jobs when a payment provider is removed
 */
export async function unregisterPaymentProviderSync(
  websiteId: string,
  provider: SyncJobProvider
): Promise<void> {
  await cancelPendingJobs(websiteId, provider);
  console.log(
    `Unregistered sync jobs for website ${websiteId}, provider ${provider}`
  );
}
