/**
 * Postmetric billing plans and Stripe price configuration
 * Price IDs are volume-specific; see getPriceId(planId, billingPeriod, volume)
 */

import type { VolumeKey } from "./pricing-tiers";

export type PlanId = "starter" | "pro";

export interface BillingPlan {
  id: PlanId;
  name: string;
}

export const BILLING_PLANS: Record<PlanId, BillingPlan> = {
  starter: { id: "starter", name: "Starter" },
  pro: { id: "pro", name: "Growth" },
};

function envKey(
  plan: "starter" | "pro",
  volume: VolumeKey,
  interval: "monthly" | "yearly",
): string {
  const planKey = plan === "starter" ? "STARTER" : "PRO";
  const volKey = volume.replace("+", "PLUS");
  return `STRIPE_${planKey}_${volKey}_${interval.toUpperCase()}`;
}

/**
 * Get Stripe Price ID for the given plan, billing period, and volume tier.
 * Env vars: STRIPE_STARTER_10K_MONTHLY, STRIPE_PRO_25K_YEARLY, etc.
 * Falls back to base 10K IDs (STRIPE_STARTER_PRICE_ID_MONTHLY) when volume-specific not set.
 */
export function getPriceId(
  planId: PlanId,
  billingPeriod: "monthly" | "yearly",
  volume: VolumeKey = "10K",
): string {
  // 1K and 5K use 10K pricing (minimum tier)
  const effectiveVolume = volume === "1K" || volume === "5K" ? "10K" : volume;
  const plan = planId === "starter" ? "starter" : "pro";
  const key = envKey(plan, effectiveVolume, billingPeriod);
  const value = process.env[key];
  if (value) return value;
  if (effectiveVolume === "10K") {
    const baseKey =
      plan === "starter"
        ? billingPeriod === "monthly"
          ? "STRIPE_STARTER_PRICE_ID_MONTHLY"
          : "STRIPE_STARTER_PRICE_ID_YEARLY"
        : billingPeriod === "monthly"
          ? "STRIPE_PRO_PRICE_ID_MONTHLY"
          : "STRIPE_PRO_PRICE_ID_YEARLY";
    return process.env[baseKey] || "";
  }
  return getPriceId(planId, billingPeriod, "10K");
}
