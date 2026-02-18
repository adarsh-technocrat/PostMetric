import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/db";
import User from "@/db/models/User";
import type { PlanId } from "@/lib/billing/plans";
import { VOLUME_KEYS, type VolumeKey } from "@/lib/billing/pricing-tiers";
import type { IUser } from "@/db/models/User";

const stripe =
  process.env.STRIPE_SECRET_KEY &&
  new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-11-17.clover",
  });

/**
 * Webhook handler for Postmetric's own Stripe account (billing/subscriptions)
 * Configure this endpoint in Stripe Dashboard: Developers > Webhooks
 * URL: https://your-domain.com/api/webhooks/stripe-billing
 *
 * Events to listen for:
 * - checkout.session.completed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded (optional backup)
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 },
    );
  }

  const webhookSecret =
    process.env.STRIPE_BILLING_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid signature";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    await connectDB();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[stripe-billing webhook]", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId as PlanId | undefined;
  const volume = session.metadata?.volume as string | undefined;

  if (!userId || !planId) {
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!customerId) {
    return;
  }

  const user = await User.findById(userId);
  if (!user) return;

  const subscription: NonNullable<IUser["subscription"]> =
    user.subscription || {
      plan: "free",
      status: "trial",
    };
  subscription.stripeCustomerId = customerId;
  subscription.stripeSubscriptionId = subscriptionId || undefined;
  subscription.plan = mapPlanIdToDbPlan(planId);
  subscription.status = "active";
  subscription.trialEndsAt = undefined;
  if (volume && VOLUME_KEYS.includes(volume as VolumeKey)) {
    subscription.volume = volume;
  }

  if (subscriptionId && stripe) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (sub.current_period_end) {
        subscription.currentPeriodEnd = new Date(sub.current_period_end * 1000);
      }
    } catch {
      // ignore
    }
  }

  user.subscription = subscription;
  await user.save();
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId as PlanId | undefined;

  let user = userId ? await User.findById(userId) : null;
  if (!user && subscription.id) {
    user = await User.findOne({
      "subscription.stripeSubscriptionId": subscription.id,
    });
  }
  if (!user) return;

  const sub: NonNullable<IUser["subscription"]> = user.subscription || {
    plan: "free",
    status: "trial",
  };
  sub.stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  sub.stripeSubscriptionId = subscription.id;
  if (subscription.current_period_end) {
    sub.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  }
  const volume = subscription.metadata?.volume as string | undefined;
  if (volume && VOLUME_KEYS.includes(volume as VolumeKey)) {
    sub.volume = volume;
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    sub.status = "active";
    sub.plan = planId ? mapPlanIdToDbPlan(planId) : sub.plan || "free";
  } else if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid" ||
    subscription.status === "past_due"
  ) {
    sub.status = subscription.status === "canceled" ? "cancelled" : "cancelled";
  }

  user.subscription = sub;
  await user.save();
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  let user = subscription.metadata?.userId
    ? await User.findById(subscription.metadata.userId)
    : null;
  if (!user && subscription.id) {
    user = await User.findOne({
      "subscription.stripeSubscriptionId": subscription.id,
    });
  }
  if (!user) return;

  const sub: NonNullable<IUser["subscription"]> = user.subscription || {
    plan: "free",
    status: "trial",
  };
  sub.status = "cancelled";
  sub.plan = "free";
  sub.stripeSubscriptionId = undefined;
  sub.currentPeriodEnd = undefined;
  sub.volume = undefined;

  user.subscription = sub;
  await user.save();
}

async function handleInvoicePaymentFailed(_invoice: Stripe.Invoice) {
  // Optionally send email, show banner, or retry logic
}

function mapPlanIdToDbPlan(
  planId: string,
): "free" | "starter" | "pro" | "enterprise" {
  if (planId === "starter") return "starter";
  if (planId === "pro") return "pro";
  return "free";
}
