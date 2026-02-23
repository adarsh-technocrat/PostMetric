#!/usr/bin/env npx tsx
/**
 * Fetches existing live Stripe products/prices and updates .env.production.
 * Run: npx tsx scripts/fetch-live-stripe-prices.ts
 * Requires: .env.production with STRIPE_SECRET_KEY=sk_live_...
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import Stripe from "stripe";

// Load .env.production
const envPath = resolve(process.cwd(), ".env.production");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey?.startsWith("sk_live_")) {
  console.error(
    "ERROR: STRIPE_SECRET_KEY in .env.production must be a live key (sk_live_...)."
  );
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: "2025-11-17.clover" });

// Tier: volume_key -> { starter_monthly_cents, growth_monthly_cents }
const TIERS: Record<string, { starter: number; growth: number }> = {
  "10K": { starter: 500, growth: 1200 },
  "25K": { starter: 1500, growth: 4000 },
  "50K": { starter: 2500, growth: 6500 },
  "75K": { starter: 3500, growth: 8500 },
  "100K": { starter: 4500, growth: 9900 },
  "250K": { starter: 6500, growth: 12500 },
  "500K": { starter: 7900, growth: 15900 },
  "750K": { starter: 8900, growth: 18900 },
  "1M": { starter: 9900, growth: 19900 },
  "2M": { starter: 11900, growth: 21900 },
  "5M": { starter: 14900, growth: 22900 },
  "10M+": { starter: 19900, growth: 24900 },
};

async function main() {
  const products = await stripe.products.list({ limit: 100, active: true });
  const starterProduct = products.data.find(
    (p) => p.name === "Postmetric Starter" || p.name?.toLowerCase().includes("starter")
  );
  const growthProduct = products.data.find(
    (p) => p.name === "Postmetric Growth" || p.name?.toLowerCase().includes("growth")
  );

  if (!starterProduct || !growthProduct) {
    console.error(
      "Could not find 'Postmetric Starter' and 'Postmetric Growth' products in Stripe."
    );
    console.error("Found:", products.data.map((p) => p.name).join(", "));
    process.exit(1);
  }

  const allPrices = await stripe.prices.list({
    limit: 100,
    active: true,
    expand: ["data.product"],
  });

  const starterPrices = allPrices.data.filter(
    (p) => p.product && (p.product as Stripe.Product).id === starterProduct.id
  );
  const growthPrices = allPrices.data.filter(
    (p) => p.product && (p.product as Stripe.Product).id === growthProduct.id
  );

  const priceMap = new Map<string, string>();
  for (const p of [...starterPrices, ...growthPrices]) {
    if (!p.recurring || !p.unit_amount) continue;
    const interval = p.recurring.interval as "month" | "year";
    const amount = p.unit_amount;
    const plan = starterPrices.includes(p) ? "starter" : "pro";
    const key = `${plan}-${amount}-${interval}`;
    priceMap.set(key, p.id);
  }

  const out: string[] = [];
  for (const [vol, { starter, growth }] of Object.entries(TIERS)) {
    const starterYearly = starter * 10;
    const growthYearly = growth * 10;

    const sidM = priceMap.get(`starter-${starter}-month`);
    const sidY = priceMap.get(`starter-${starterYearly}-year`);
    const gidM = priceMap.get(`pro-${growth}-month`);
    const gidY = priceMap.get(`pro-${growthYearly}-year`);

    if (!sidM || !sidY || !gidM || !gidY) {
      console.error(`Missing prices for ${vol}: sidM=${sidM} sidY=${sidY} gidM=${gidM} gidY=${gidY}`);
      continue;
    }

    const envKey = vol.replace("+", "PLUS");
    out.push(`STRIPE_STARTER_${envKey}_MONTHLY=${sidM}`);
    out.push(`STRIPE_STARTER_${envKey}_YEARLY=${sidY}`);
    out.push(`STRIPE_PRO_${envKey}_MONTHLY=${gidM}`);
    out.push(`STRIPE_PRO_${envKey}_YEARLY=${gidY}`);

    if (vol === "10K") {
      out.push(`STRIPE_STARTER_PRICE_ID_MONTHLY=${sidM}`);
      out.push(`STRIPE_STARTER_PRICE_ID_YEARLY=${sidY}`);
      out.push(`STRIPE_PRO_PRICE_ID_MONTHLY=${gidM}`);
      out.push(`STRIPE_PRO_PRICE_ID_YEARLY=${gidY}`);
    }
  }

  const lines = readFileSync(envPath, "utf-8").split("\n");
  const before: string[] = [];
  const after: string[] = [];
  let inStripeSection = false;
  let pastStripeSection = false;

  for (const line of lines) {
    if (line.startsWith("STRIPE_STARTER_") || line.startsWith("STRIPE_PRO_")) {
      inStripeSection = true;
      continue;
    }
    if (inStripeSection && !line.startsWith("STRIPE_")) {
      pastStripeSection = true;
      inStripeSection = false;
    }
    if (!pastStripeSection) before.push(line);
    else after.push(line);
  }

  const stripeComment =
    "# Stripe Price IDs (live) - fetched from existing products in Stripe Dashboard";
  const newContent = [
    ...before.filter((l) => l.trim() !== "" || !before[before.length - 1]?.trim()),
    "",
    stripeComment,
    ...out,
    "",
    ...after,
  ].join("\n");

  writeFileSync(envPath, newContent, "utf-8");
  console.log("✓ Updated .env.production with live Stripe price IDs");
  console.log("\nPrice IDs written:");
  out.forEach((l) => console.log(" ", l));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
