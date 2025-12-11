/**
 * Development script to sync and process jobs locally
 *
 * Usage:
 *   pnpm dev:sync                              # Sync and process all pending jobs (hourly - last 2h)
 *   pnpm dev:sync --frequency every-6-hours    # Sync last 24 hours for all websites
 *   pnpm dev:sync --frequency daily            # Sync last 7 days for all websites
 *   pnpm dev:sync --process-only               # Only process existing jobs
 *   pnpm dev:sync --create-only                 # Only create sync jobs
 *   pnpm dev:sync --website-id <id>             # Sync specific website (last 24h)
 *   pnpm dev:sync --website-id <id> --hours-back 48  # Sync specific website (last 48h)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "";

interface Options {
  processOnly?: boolean;
  createOnly?: boolean;
  websiteId?: string;
  frequency?: "hourly" | "every-6-hours" | "daily";
  hoursBack?: number;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--process-only") {
      options.processOnly = true;
    } else if (arg === "--create-only") {
      options.createOnly = true;
    } else if (arg === "--website-id" && args[i + 1]) {
      options.websiteId = args[++i];
    } else if (arg === "--frequency" && args[i + 1]) {
      options.frequency = args[++i] as Options["frequency"];
    } else if (arg === "--hours-back" && args[i + 1]) {
      options.hoursBack = parseInt(args[++i], 10);
    }
  }

  return options;
}

async function makeRequest(
  url: string,
  method: "GET" | "POST" = "GET",
  body?: any
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (CRON_SECRET) {
    headers["Authorization"] = `Bearer ${CRON_SECRET}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Request failed: ${response.status} ${error}`);
  }

  return response.json();
}

async function createSyncJobs(frequency: Options["frequency"] = "hourly") {
  console.log(`\n📥 Creating sync jobs (frequency: ${frequency})...`);

  try {
    const url = `${BASE_URL}/api/cron/sync-payments?frequency=${frequency}`;
    const result = await makeRequest(url, "POST");

    console.log(
      `✅ Created ${result.jobsCreated} sync job(s) for ${result.websitesProcessed} website(s)`
    );
    if (result.jobs && result.jobs.length > 0) {
      console.log("   Jobs created:");
      result.jobs.forEach((job: any) => {
        console.log(
          `   - ${job.provider} for website ${job.websiteId} (job: ${job.jobId})`
        );
      });
    }

    return result;
  } catch (error: any) {
    console.error(`❌ Failed to create sync jobs: ${error.message}`);
    throw error;
  }
}

async function processJobs(batchSize: number = 10) {
  console.log(`\n⚙️  Processing pending jobs (batch size: ${batchSize})...`);

  let totalProcessed = 0;
  let attempts = 0;
  const maxAttempts = 10; // Prevent infinite loops

  while (attempts < maxAttempts) {
    try {
      const url = `${BASE_URL}/api/jobs/process`;
      const result = await makeRequest(url, "POST", {
        batchSize,
        maxConcurrent: 3,
      });

      if (result.processed === 0) {
        break; // No more jobs to process
      }

      totalProcessed += result.processed;
      console.log(`   Processed ${result.processed} job(s)...`);

      if (result.jobs) {
        result.jobs.forEach((job: any) => {
          const status = job.status === "completed" ? "✅" : "❌";
          console.log(`   ${status} Job ${job.jobId}: ${job.status}`);
          if (job.result) {
            console.log(
              `      Synced: ${job.result.synced}, Skipped: ${job.result.skipped}, Errors: ${job.result.errors}`
            );
          }
          if (job.error) {
            console.log(`      Error: ${job.error}`);
          }
        });
      }

      attempts++;

      // If we processed less than batchSize, we're done
      if (result.processed < batchSize) {
        break;
      }
    } catch (error: any) {
      console.error(`❌ Failed to process jobs: ${error.message}`);
      throw error;
    }
  }

  if (totalProcessed > 0) {
    console.log(`\n✅ Successfully processed ${totalProcessed} job(s) total`);
  } else {
    console.log(`\nℹ️  No pending jobs to process`);
  }

  return totalProcessed;
}

async function syncWebsite(websiteId: string, hoursBack: number = 24) {
  console.log(
    `\n📥 Creating manual sync for website ${websiteId} (last ${hoursBack} hours)...`
  );

  try {
    const url = `${BASE_URL}/api/websites/${websiteId}/sync`;
    const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const endDate = new Date();

    const result = await makeRequest(url, "POST", {
      provider: "stripe",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    console.log(`✅ Created sync job: ${result.jobId}`);
    console.log(
      `   Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );
    return result;
  } catch (error: any) {
    console.error(`❌ Failed to create sync job: ${error.message}`);
    throw error;
  }
}

async function main() {
  const options = parseArgs();

  console.log("🚀 PostMetric Dev Sync Tool");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(
    `   Cron Secret: ${
      CRON_SECRET ? "✅ Set" : "⚠️  Not set (may fail if required)"
    }`
  );

  try {
    if (options.websiteId) {
      // Sync specific website
      await syncWebsite(options.websiteId, options.hoursBack || 24);
      if (!options.createOnly) {
        await processJobs();
      }
    } else if (options.processOnly) {
      // Only process existing jobs
      await processJobs();
    } else if (options.createOnly) {
      // Only create sync jobs
      await createSyncJobs(options.frequency);
    } else {
      // Default: create and process
      await createSyncJobs(options.frequency);
      await processJobs();
    }

    console.log("\n✨ Done!");
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === "undefined") {
  console.error(
    "❌ This script requires Node.js 18+ with native fetch support"
  );
  console.error("   Or install node-fetch: pnpm add -D node-fetch");
  process.exit(1);
}

main();
