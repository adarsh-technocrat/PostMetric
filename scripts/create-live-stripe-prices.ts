#!/usr/bin/env npx tsx
/**
 * Creates live Stripe products and prices using STRIPE_SECRET_KEY from .env.production.
 * Run: npx tsx scripts/create-live-stripe-prices.ts
 * Requires: .env.production with STRIPE_SECRET_KEY=sk_live_...
 *
 * Outputs env vars to paste into .env.production (replaces the Stripe price section).
 */

import { readFileSync } from "fs";
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

// Tier definitions from create-stripe-products.sh (cents)
const TIERS = [
  { vol: "10K", starter: 500, growth: 1200 },
  { vol: "25K", starter: 1500, growth: 4000 },
  { vol: "50K", starter: 2500, growth: 6500 },
  { vol: "75K", starter: 3500, growth: 8500 },
  { vol: "100K", starter: 4500, growth: 9900 },
  { vol: "250K", starter: 6500, growth: 12500 },
  { vol: "500K", starter: 7900, growth: 15900 },
  { vol: "750K", starter: 8900, growth: 18900 },
  { vol: "1M", starter: 9900, growth: 19900 },
  { vol: "2M", starter: 11900, growth: 21900 },
  { vol: "5M", starter: 14900, growth: 22900 },
  { vol: "10M+", starter: 19900, growth: 24900 },
];

async function main() {
  const starterProduct = await stripe.products.create({
    name: "Postmetric Starter",
  });
  const growthProduct = await stripe.products.create({
    name: "Postmetric Growth",
  });

  const out: string[] = [];

  for (const { vol, starter, growth } of TIERS) {
    const starterYearly = starter * 10;
    const growthYearly = growth * 10;

    console.log(`→ ${vol} tier`);

    const [sidM, sidY, gidM, gidY] = await Promise.all([
      stripe.prices.create({
        product: starterProduct.id,
        currency: "usd",
        unit_amount: starter,
        recurring: { interval: "month" },
      }),
      stripe.prices.create({
        product: starterProduct.id,
        currency: "usd",
        unit_amount: starterYearly,
        recurring: { interval: "year" },
      }),
      stripe.prices.create({
        product: growthProduct.id,
        currency: "usd",
        unit_amount: growth,
        recurring: { interval: "month" },
      }),
      stripe.prices.create({
        product: growthProduct.id,
        currency: "usd",
        unit_amount: growthYearly,
        recurring: { interval: "year" },
      }),
    ]);

    const envKey = vol.replace("+", "PLUS");
    out.push(`STRIPE_STARTER_${envKey}_MONTHLY=${sidM.id}`);
    out.push(`STRIPE_STARTER_${envKey}_YEARLY=${sidY.id}`);
    out.push(`STRIPE_PRO_${envKey}_MONTHLY=${gidM.id}`);
    out.push(`STRIPE_PRO_${envKey}_YEARLY=${gidY.id}`);

    if (vol === "10K") {
      out.push(`STRIPE_STARTER_PRICE_ID_MONTHLY=${sidM.id}`);
      out.push(`STRIPE_STARTER_PRICE_ID_YEARLY=${sidY.id}`);
      out.push(`STRIPE_PRO_PRICE_ID_MONTHLY=${gidM.id}`);
      out.push(`STRIPE_PRO_PRICE_ID_YEARLY=${gidY.id}`);
    }
  }

  console.log("\nAdd these to .env.production (replace existing STRIPE_* price vars):\n");
  console.log(out.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
