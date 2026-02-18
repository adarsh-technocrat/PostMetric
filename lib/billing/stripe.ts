import Stripe from "stripe";
import type { PlanId } from "./plans";
import type { VolumeKey } from "./pricing-tiers";
import { getPriceId } from "./plans";

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-11-17.clover",
  });
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function createCheckoutSession(params: {
  userId: string;
  userEmail: string;
  userName: string;
  planId: PlanId;
  billingPeriod: "monthly" | "yearly";
  volume: VolumeKey;
  stripeCustomerId?: string | null;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const baseUrl = getBaseUrl();
  const priceId = getPriceId(params.planId, params.billingPeriod, params.volume);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard/billing?canceled=true`,
    metadata: {
      userId: params.userId,
      planId: params.planId,
      billingPeriod: params.billingPeriod,
      volume: params.volume,
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        planId: params.planId,
        volume: params.volume,
      },
      trial_period_days: undefined,
    },
    allow_promotion_codes: true,
  };

  if (params.stripeCustomerId) {
    sessionParams.customer = params.stripeCustomerId;
  } else {
    sessionParams.customer_email = params.userEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return { url: session.url };
}

export async function createBillingPortalSession(params: {
  userId: string;
  stripeCustomerId: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const baseUrl = getBaseUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: `${baseUrl}/dashboard/billing`,
  });

  if (!session.url) {
    throw new Error("Failed to create billing portal session");
  }

  return { url: session.url };
}
