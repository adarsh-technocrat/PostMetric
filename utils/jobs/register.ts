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
  const providerConfig = website.paymentProviders?.[providerKey];
  if (!providerConfig) {
    throw new Error(`Provider ${provider} not configured`);
  }

  // For Stripe, check if API key exists and get sync config
  if (provider === "stripe") {
    const stripeConfig = providerConfig as NonNullable<
      typeof website.paymentProviders
    >["stripe"];
    if (!stripeConfig?.apiKey) {
      throw new Error("Stripe API key not configured");
    }
    // Determine sync frequency (default: hourly)
    const frequency = stripeConfig.syncConfig?.frequency || "hourly";
    const enabled = stripeConfig.syncConfig?.enabled !== false;

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
    return;
  }

  // For other providers, sync is not yet implemented
  throw new Error(`Sync for provider ${provider} is not yet implemented`);
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
      // Default to 24 hours with buffer
      startDate = new Date(endDate.getTime() - 26 * 60 * 60 * 1000);
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
