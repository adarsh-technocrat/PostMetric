import { Types } from "mongoose";
import Payment from "@/db/models/Payment";
import type { IWebsite } from "@/db/models/Website";
import { recordStripeCheckoutSession } from "@/utils/integrations/stripe";
import { recordPaymentHint, type Attribution } from "./linkPayment";

// How far back an email reported from a success page may claim a payment
// that synced before the browser got there.
const EMAIL_CLAIM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A `payment` event from the tracking script: either the provider id the
 * success page was opened with (`?session_id=cs_…`, `?checkout_id=…`,
 * `?order_id=…`) or the email passed to `postmetric("payment", { email })`.
 * Each is kept as a hint for the provider sync, and a Stripe checkout is
 * recorded straight away when Stripe is connected.
 */
export async function handlePaymentEvent(
  website: IWebsite,
  extraData: Record<string, unknown>,
  attribution: Attribution,
): Promise<void> {
  const websiteId = website._id.toString();

  const stripeSessionId = str(extraData.stripe_session_id);
  if (stripeSessionId?.startsWith("cs_")) {
    await recordPaymentHint(
      websiteId,
      "stripe_checkout_session",
      stripeSessionId,
      attribution,
    );
    const apiKey = website.paymentProviders?.stripe?.apiKey;
    if (apiKey) {
      await recordStripeCheckoutSession(websiteId, apiKey, stripeSessionId);
    }
  }

  const polarCheckoutId = str(extraData.polar_checkout_id);
  if (polarCheckoutId) {
    await recordPaymentHint(
      websiteId,
      "polar_checkout",
      polarCheckoutId,
      attribution,
    );
  }

  const lemonSqueezyOrderId = str(extraData.lemonsqueezy_order_id);
  if (lemonSqueezyOrderId) {
    await recordPaymentHint(
      websiteId,
      "lemonsqueezy_order",
      lemonSqueezyOrderId,
      attribution,
    );
  }

  const email = str(extraData.email)?.toLowerCase();
  if (email) {
    await recordPaymentHint(websiteId, "email", email, attribution);
    await claimPaymentsByEmail(websiteId, email, attribution);
  }
}

/** Attribute this customer's recent, still-unattributed payments. */
async function claimPaymentsByEmail(
  websiteId: string,
  email: string,
  attribution: Attribution,
): Promise<void> {
  await Payment.updateMany(
    {
      websiteId: new Types.ObjectId(websiteId),
      customerEmail: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
      visitorId: { $in: [null, ""] },
      timestamp: { $gte: new Date(Date.now() - EMAIL_CLAIM_WINDOW_MS) },
    },
    {
      $set: {
        visitorId: attribution.visitorId,
        ...(attribution.sessionId && { sessionId: attribution.sessionId }),
      },
    },
  );
}
