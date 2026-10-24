import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import {
  runStripeSync,
  startStripeBackfill,
  type StripeSiteSyncResult,
} from "@/utils/integrations/stripe";
import { dropLegacyPaymentIndex } from "@/utils/database/payment";

export const maxDuration = 60;

/** Stop starting work this long into the run, leaving headroom under maxDuration. */
const RUN_BUDGET_MS = 45_000;
/** No single website may use more than this of a run. */
const PER_WEBSITE_BUDGET_MS = 20_000;
/** Websites synced at the same time. */
const CONCURRENCY = 3;

function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

async function runSync() {
  const runDeadline = Date.now() + RUN_BUDGET_MS;
  await connectDB();

  // Payments the legacy global index rejected were counted as errors and
  // skipped, so once it is gone every connected site re-imports its history.
  if (await dropLegacyPaymentIndex()) {
    const connected = await Website.find({
      "paymentProviders.stripe.apiKey": { $exists: true, $nin: [null, ""] },
    }).select("_id");
    for (const site of connected) {
      await startStripeBackfill(site._id.toString());
    }
  }

  // Least recently synced first, so sites a short run didn't reach go first
  // next time. Sites whose key Stripe rejected wait until the key changes.
  const websites = await Website.find({
    "paymentProviders.stripe.apiKey": { $exists: true, $nin: [null, ""] },
    "paymentProviders.stripe.syncConfig.enabled": { $ne: false },
    "paymentProviders.stripe.syncConfig.frequency": "realtime",
    "paymentProviders.stripe.syncConfig.authFailedAt": null,
  })
    .select("paymentProviders")
    .sort({ "paymentProviders.stripe.syncConfig.lastSyncAt": 1 });

  const results: StripeSiteSyncResult[] = [];
  let next = 0;
  const worker = async () => {
    while (next < websites.length && Date.now() < runDeadline) {
      const website = websites[next++];
      const deadline = Math.min(
        runDeadline,
        Date.now() + PER_WEBSITE_BUDGET_MS,
      );
      try {
        results.push(await runStripeSync(website, { deadline }));
      } catch (error: any) {
        results.push({
          websiteId: website._id.toString(),
          synced: 0,
          skipped: 0,
          errors: 1,
          mode: "skipped",
          error: error?.message,
        });
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return {
    success: true as const,
    websitesProcessed: results.length,
    websitesPending: websites.length - results.length,
    totalSynced: results.reduce((sum, r) => sum + r.synced, 0),
    totalSkipped: results.reduce((sum, r) => sum + r.skipped, 0),
    totalErrors: results.reduce((sum, r) => sum + r.errors, 0),
    results,
  };
}

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await runSync();
    return NextResponse.json(body);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to sync realtime payments",
        message: error?.message,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({
      status: "ok",
      message:
        "Realtime payment sync cron endpoint is active. Use POST (or GET with Authorization) to run sync.",
    });
  }
  try {
    const body = await runSync();
    return NextResponse.json(body);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to sync realtime payments",
        message: error?.message,
      },
      { status: 500 },
    );
  }
}
