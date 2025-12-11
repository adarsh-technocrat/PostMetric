import { enqueueSyncJob } from "./queue";
import { getWebsiteById } from "@/utils/database/website";
import type { SyncJobProvider, SyncRange } from "@/db/models/SyncJob";

/**
 * Register periodic sync jobs when a payment provider is added
 */
export async function registerPaymentProviderSync(
  websiteId: string,
  provider: SyncJobProvider
): Promise<void> {
  const website = await getWebsiteById(websiteId);
  if (!website) {
    throw new Error("Website not found");
  }

  // Get provider config
  const providerConfig = website.paymentProviders?.[provider];
  if (!providerConfig) {
    throw new Error(`Provider ${provider} not configured`);
  }

  // For Stripe, check if API key exists
  if (provider === "stripe" && !providerConfig.apiKey) {
    throw new Error("Stripe API key not configured");
  }

  // Determine sync frequency (default: hourly)
  const frequency = providerConfig.syncConfig?.frequency || "hourly";
  const enabled = providerConfig.syncConfig?.enabled !== false;

  if (!enabled) {
    return; // Don't register if sync is disabled
  }

  // Calculate date range based on frequency
  const { startDate, endDate, syncRange } = getSyncDateRange(frequency);

  // Enqueue initial sync job
  await enqueueSyncJob({
    websiteId,
    provider,
    type: "periodic",
    priority: 60, // Medium-high priority for periodic syncs
    startDate,
    endDate,
    syncRange,
  });

  console.log(
    `Registered ${frequency} sync job for website ${websiteId}, provider ${provider}`
  );
}

/**
 * Get sync date range based on frequency
 */
function getSyncDateRange(frequency: "hourly" | "every-6-hours" | "daily"): {
  startDate: Date;
  endDate: Date;
  syncRange: SyncRange;
} {
  const endDate = new Date();
  let startDate: Date;
  let syncRange: SyncRange;

  switch (frequency) {
    case "hourly":
      // Sync last 2 hours to catch any missed webhooks
      startDate = new Date(endDate.getTime() - 2 * 60 * 60 * 1000);
      syncRange = "last24h";
      break;
    case "every-6-hours":
      // Sync last 24 hours
      startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      syncRange = "last24h";
      break;
    case "daily":
      // Sync last 7 days as backup
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      syncRange = "last7d";
      break;
    default:
      startDate = new Date(endDate.getTime() - 2 * 60 * 60 * 1000);
      syncRange = "last24h";
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
  const { cancelPendingJobs } = await import("./queue");
  await cancelPendingJobs(websiteId, provider);
  console.log(
    `Unregistered sync jobs for website ${websiteId}, provider ${provider}`
  );
}
