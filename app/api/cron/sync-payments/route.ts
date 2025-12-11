import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { enqueueSyncJob } from "@/utils/jobs/queue";
import type { SyncJobProvider } from "@/db/models/SyncJob";

/**
 * POST /api/cron/sync-payments
 * Cron job endpoint to create sync jobs for all websites with payment providers
 *
 * Schedule this to run:
 * - Hourly: For recent payment syncs
 * - Every 6 hours: For comprehensive catch-up
 * - Daily: For full backup sync
 *
 * Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await connectDB();

    // Get all websites with payment providers configured
    const websites = await Website.find({
      $or: [
        { "paymentProviders.stripe.apiKey": { $exists: true, $ne: null } },
        { "paymentProviders.lemonsqueezy.webhookSecret": { $exists: true } },
        { "paymentProviders.polar.webhookSecret": { $exists: true } },
        { "paymentProviders.paddle.webhookSecret": { $exists: true } },
      ],
    });

    const jobsCreated: Array<{
      websiteId: string;
      provider: string;
      jobId: string;
    }> = [];

    // Determine sync frequency from query params or default
    const searchParams = request.nextUrl.searchParams;
    const frequency = searchParams.get("frequency") || "hourly"; // hourly, every-6-hours, daily

    // Calculate date range based on frequency
    const endDate = new Date();
    let startDate: Date;
    let syncRange: "today" | "last24h" | "last7d" | "custom";

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

    // Create sync jobs for each website/provider combination
    for (const website of websites) {
      const websiteId = website._id.toString();

      // Stripe
      if (website.paymentProviders?.stripe?.apiKey) {
        const syncConfig = website.paymentProviders.stripe.syncConfig;
        if (syncConfig?.enabled !== false) {
          // Check if sync is due (if nextSyncAt is set and in the past)
          const shouldSync =
            !syncConfig?.nextSyncAt ||
            new Date(syncConfig.nextSyncAt) <= new Date();

          if (shouldSync) {
            const job = await enqueueSyncJob({
              websiteId,
              provider: "stripe",
              type: "cron",
              priority: 50,
              startDate,
              endDate,
              syncRange,
            });

            jobsCreated.push({
              websiteId,
              provider: "stripe",
              jobId: job._id.toString(),
            });

            // Update nextSyncAt if syncConfig exists
            if (syncConfig) {
              const { calculateNextSyncDate } = await import(
                "@/utils/jobs/queue"
              );
              const nextSync = calculateNextSyncDate(
                syncConfig.frequency || "hourly"
              );
              website.paymentProviders.stripe.syncConfig = {
                ...syncConfig,
                lastSyncAt: new Date(),
                nextSyncAt: nextSync,
              };
              await website.save();
            }
          }
        }
      }

      // TODO: Add other providers (LemonSqueezy, Polar, Paddle) when implemented
    }

    return NextResponse.json({
      success: true,
      frequency,
      websitesProcessed: websites.length,
      jobsCreated: jobsCreated.length,
      jobs: jobsCreated,
    });
  } catch (error: any) {
    console.error("Error in cron sync-payments:", error);
    return NextResponse.json(
      {
        error: "Failed to create sync jobs",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/sync-payments
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Cron endpoint is active",
    schedule: "Configure in vercel.json or external cron service",
  });
}
