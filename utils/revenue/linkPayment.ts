import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import PaymentHint, { type PaymentHintKind } from "@/db/models/PaymentHint";
import { Types } from "mongoose";

// Metadata keys a checkout can carry the visitor on. The datafast_* names are
// accepted so a site moving from DataFast keeps its checkout code unchanged.
const VISITOR_KEYS = [
  "visitorId",
  "postmetric_visitor_id",
  "datafast_visitor_id",
] as const;
const SESSION_KEYS = [
  "sessionId",
  "postmetric_session_id",
  "datafast_session_id",
] as const;

type Metadata = Record<string, unknown> | null | undefined;

export type Attribution = { visitorId: string; sessionId?: string };

function firstString(source: Metadata, keys: readonly string[]) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/**
 * First source that names a visitor wins, together with its own session id,
 * so a visitor and a session are never mixed from two different objects.
 */
export function attributionFromMetadata(
  ...sources: Metadata[]
): Attribution | null {
  for (const source of sources) {
    const visitorId = firstString(source, VISITOR_KEYS);
    if (visitorId) {
      return { visitorId, sessionId: firstString(source, SESSION_KEYS) };
    }
  }
  return null;
}

export async function recordPaymentHint(
  websiteId: string | Types.ObjectId,
  kind: PaymentHintKind,
  value: string,
  attribution: Attribution,
): Promise<void> {
  const key = kind === "email" ? value.trim().toLowerCase() : value.trim();
  if (!key) return;
  await PaymentHint.updateOne(
    { websiteId: new Types.ObjectId(websiteId), kind, value: key },
    {
      $set: {
        visitorId: attribution.visitorId,
        sessionId: attribution.sessionId,
      },
    },
    { upsert: true },
  );
}

async function hintFor(
  websiteId: Types.ObjectId,
  kind: PaymentHintKind,
  value: string | undefined,
): Promise<Attribution | null> {
  if (!value) return null;
  const key = kind === "email" ? value.trim().toLowerCase() : value.trim();
  const hint = await PaymentHint.findOne({ websiteId, kind, value: key });
  return hint ? { visitorId: hint.visitorId, sessionId: hint.sessionId } : null;
}

/**
 * Revenue reports join payments to sessions, so a payment that only names a
 * visitor is given the visitor's latest session up to the moment they paid.
 */
async function withSession(
  websiteId: Types.ObjectId,
  attribution: Attribution,
  at: Date,
): Promise<Attribution> {
  if (attribution.sessionId) {
    const known = await Session.exists({
      websiteId,
      sessionId: attribution.sessionId,
    });
    if (known) return attribution;
  }

  const session =
    (await Session.findOne({
      websiteId,
      visitorId: attribution.visitorId,
      firstVisitAt: { $lte: at },
    }).sort({ firstVisitAt: -1 })) ??
    (await Session.findOne({
      websiteId,
      visitorId: attribution.visitorId,
    }).sort({ firstVisitAt: -1 }));

  return session
    ? { visitorId: attribution.visitorId, sessionId: session.sessionId }
    : attribution;
}

/**
 * Link a payment to the visitor who made it, in the order DataFast does:
 *   1. visitor ids carried in the payment's own metadata
 *   2. the checkout id the browser reported from the success page
 *   3. an earlier attributed payment by the same customer (renewals, upsells)
 *   4. an email the browser reported via payment/identify
 * A payment matching none of these stays unattributed — guessing a visitor
 * from timing credits revenue to whoever happened to be on the site.
 */
export async function linkPaymentToVisitor(
  payment: {
    metadata?: Metadata;
    customerEmail?: string;
    customerId?: string;
    checkoutSessionId?: string;
    timestamp: Date;
  },
  websiteId: string,
): Promise<{ sessionId?: string; visitorId?: string } | null> {
  const site = new Types.ObjectId(websiteId);

  let attribution =
    attributionFromMetadata(payment.metadata) ??
    (await hintFor(site, "stripe_checkout_session", payment.checkoutSessionId));

  if (!attribution && payment.customerId) {
    const earlier = await Payment.findOne({
      websiteId: site,
      customerId: payment.customerId,
      visitorId: { $exists: true, $ne: null },
    }).sort({ timestamp: 1 });
    if (earlier?.visitorId) {
      attribution = {
        visitorId: earlier.visitorId,
        sessionId: earlier.sessionId,
      };
    }
  }

  if (!attribution) {
    attribution = await hintFor(site, "email", payment.customerEmail);
  }

  if (!attribution) return null;
  return withSession(site, attribution, payment.timestamp);
}
