#!/usr/bin/env node
/**
 * Script to register a fake payment for testing the Realtime Map
 *
 * Usage:
 *   pnpm tsx scripts/test-fake-payment.ts --website-id <websiteId>
 *   pnpm tsx scripts/test-fake-payment.ts --website-id <websiteId> --amount 5000
 *   pnpm tsx scripts/test-fake-payment.ts --website-id <websiteId> --amount 50 --currency usd
 *
 * If no website-id is provided, it will use the first website found in the database.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = join(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip comments and empty lines
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      // Parse KEY=VALUE format
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // Only set if not already in process.env (env vars take precedence)
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } else {
    console.warn(
      "⚠️  .env.local file not found. Make sure MONGODB_URI is set in environment variables."
    );
  }
}

// Load env vars before importing modules that need them
loadEnvFile();

interface Options {
  websiteId?: string;
  amount?: number; // Amount in dollars (will be converted to cents)
  currency?: string;
  customerEmail?: string;
  visitorId?: string;
  sessionId?: string;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--website-id" && args[i + 1]) {
      options.websiteId = args[++i];
    } else if (arg === "--amount" && args[i + 1]) {
      options.amount = parseFloat(args[++i]);
    } else if (arg === "--currency" && args[i + 1]) {
      options.currency = args[++i].toLowerCase();
    } else if (arg === "--customer-email" && args[i + 1]) {
      options.customerEmail = args[++i];
    } else if (arg === "--visitor-id" && args[i + 1]) {
      options.visitorId = args[++i];
    } else if (arg === "--session-id" && args[i + 1]) {
      options.sessionId = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: pnpm tsx scripts/test-fake-payment.ts [options]

Options:
  --website-id <id>        Website ID to create payment for (required if no websites exist)
  --amount <number>        Payment amount in dollars (default: 50.00)
  --currency <code>        Currency code (default: usd)
  --customer-email <email> Customer email address
  --visitor-id <id>        Visitor ID to link payment to
  --session-id <id>        Session ID to link payment to
  --help, -h               Show this help message

Example:
  pnpm tsx scripts/test-fake-payment.ts --website-id 507f1f77bcf86cd799439011 --amount 99.99
      `);
      process.exit(0);
    }
  }

  return options;
}

async function main() {
  // Dynamically import modules after env vars are loaded
  const { default: connectDB } = await import("@/db");
  const { default: Website } = await import("@/db/models/Website");
  const { createPayment } = await import("@/utils/database/payment");

  const options = parseArgs();

  try {
    await connectDB();

    // Get website ID
    let websiteId: string | undefined = options.websiteId;
    if (!websiteId) {
      console.log("⚠️  No website ID provided, looking for first website...");
      const website = await Website.findOne().lean();
      const foundWebsiteId = website ? website._id.toString() : null;
      if (!foundWebsiteId) {
        console.error(
          "❌ No websites found in database. Please provide --website-id"
        );
        process.exit(1);
      }
      websiteId = foundWebsiteId;
      console.log(`✅ Using website ID: ${websiteId}`);
    }

    // Verify website exists
    const website = await Website.findById(websiteId);
    if (!website) {
      console.error(`❌ Website not found: ${websiteId}`);
      process.exit(1);
    }

    // Prepare payment data
    const amountInDollars = options.amount || 50.0;
    const amountInCents = Math.round(amountInDollars * 100);
    const currency = options.currency || "usd";
    const timestamp = new Date(); // Current time (will show up in realtime map)

    // Generate unique provider payment ID
    const providerPaymentId = `fake_payment_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    console.log("\n📝 Creating fake payment...");
    console.log(`   Website ID: ${websiteId}`);
    console.log(
      `   Amount: $${amountInDollars.toFixed(2)} (${amountInCents} cents)`
    );
    console.log(`   Currency: ${currency.toUpperCase()}`);
    console.log(`   Provider Payment ID: ${providerPaymentId}`);
    console.log(`   Timestamp: ${timestamp.toISOString()}`);

    if (options.customerEmail) {
      console.log(`   Customer Email: ${options.customerEmail}`);
    }
    if (options.visitorId) {
      console.log(`   Visitor ID: ${options.visitorId}`);
    }
    if (options.sessionId) {
      console.log(`   Session ID: ${options.sessionId}`);
    }

    // Create the payment
    const payment = await createPayment({
      websiteId,
      provider: "other",
      providerPaymentId,
      amount: amountInCents,
      currency,
      renewal: false,
      refunded: false,
      customerEmail: options.customerEmail,
      metadata: {
        test: true,
        script: "test-fake-payment",
        visitorId: options.visitorId,
        sessionId: options.sessionId,
      },
      timestamp,
    });

    console.log("\n✅ Payment created successfully!");
    console.log(`   Payment ID: ${payment._id.toString()}`);
    console.log(`   Linked Visitor ID: ${payment.visitorId || "None"}`);
    console.log(`   Linked Session ID: ${payment.sessionId || "None"}`);

    console.log(
      "\n🎉 The payment should appear in the Realtime Map within 5 seconds!"
    );
    console.log(
      "   Open the Realtime Map and listen for the cash register sound. 💰"
    );
    console.log("\n💡 Note: The payment will only appear if:");
    console.log("   - It was created within the last 5 minutes");
    console.log("   - The Realtime Map is open and polling");
    console.log("   - The payment is not refunded");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating fake payment:", error);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

main();
