#!/usr/bin/env node

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import Stripe from "stripe";

function loadEnvFile() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    throw new Error(".env.local not found");
  }
  const envContent = readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function getPriceIdsFromEnv(): string[] {
  const priceIds: string[] = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (
      value &&
      /^STRIPE_(STARTER|PRO)_/.test(key) &&
      value.startsWith("price_")
    ) {
      priceIds.push(value);
    }
  }
  return [...new Set(priceIds)];
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  loadEnvFile();

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY not set in .env.local");
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2025-11-17.clover",
  });

  const priceIds = getPriceIdsFromEnv();
  console.log(`Found ${priceIds.length} price IDs in .env.local\n`);

  if (priceIds.length === 0) {
    console.log("No price IDs found. Nothing to do.");
    return;
  }

  const usedProductIds = new Set<string>();
  for (const priceId of priceIds) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (price.product) {
        usedProductIds.add(
          typeof price.product === "string" ? price.product : price.product.id,
        );
      }
    } catch (e) {
      console.warn(`Warning: could not fetch price ${priceId}:`, e);
    }
  }

  console.log(
    `Products in use (${usedProductIds.size}):`,
    [...usedProductIds].join(", "),
  );

  const allProducts: Stripe.Product[] = [];
  for await (const product of stripe.products.list({ limit: 100 })) {
    allProducts.push(product);
  }

  const toArchive = allProducts.filter((p) => !usedProductIds.has(p.id));

  if (toArchive.length === 0) {
    console.log("\n✓ No unused products to archive.");
    return;
  }

  console.log(`\nProducts to archive (${toArchive.length}):`);
  for (const p of toArchive) {
    console.log(`  - ${p.id} (${p.name})`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] Run without --dry-run to archive these products.");
    return;
  }

  console.log("");
  for (const p of toArchive) {
    await stripe.products.update(p.id, { active: false });
    console.log(`  ✓ Archived ${p.id} (${p.name})`);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
