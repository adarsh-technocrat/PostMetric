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

export function getPriceId(
  planId: PlanId,
  billingPeriod: "monthly" | "yearly",
  volume: VolumeKey = "10K",
): string {
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
    const baseValue = process.env[baseKey];
    if (baseValue) return baseValue;
  }
  throw new Error(
    `Missing Stripe price for ${plan} ${effectiveVolume} ${billingPeriod}. ` +
      `Add ${key} to .env.local. Run: ./scripts/create-stripe-products.sh --write`,
  );
}
