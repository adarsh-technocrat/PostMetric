import connectDB from "@/db";
import Payment, { type IPayment } from "@/db/models/Payment";
import { Types } from "mongoose";
import { linkPaymentToVisitor } from "@/utils/revenue/linkPayment";

export type NewPayment = {
  websiteId: string;
  provider: "stripe" | "lemonsqueezy" | "polar" | "paddle" | "other";
  providerPaymentId: string;
  /** Amount ×100 in major units — see the comment on Payment.amount. */
  amount: number;
  currency: string;
  settlementAmount?: number;
  settlementCurrency?: string;
  /**
   * The caller read the amount from the provider itself (Stripe sync), so it
   * may correct a stored amount/settlement. API reports never overwrite.
   */
  authoritativeAmount?: boolean;
  renewal: boolean;
  refunded: boolean;
  customerEmail?: string;
  customerId?: string;
  checkoutSessionId?: string;
  metadata?: Record<string, any>;
  // Set when the caller already knows the visitor (payments API).
  visitorId?: string;
  sessionId?: string;
  timestamp?: Date;
};

/**
 * Bring an already-stored payment up to date: the renewal flag (and, from the
 * Stripe sync, the amount/settlement) can change on a later sync, and a payment synced before its browser clue arrived can
 * be attributed once it does.
 */
async function refreshExisting(
  existing: IPayment,
  data: NewPayment,
): Promise<IPayment> {
  let changed = false;
  if (data.authoritativeAmount) {
    if (
      existing.amount !== data.amount ||
      existing.currency !== data.currency
    ) {
      existing.amount = data.amount;
      existing.currency = data.currency;
      changed = true;
    }
    if (
      data.settlementAmount !== undefined &&
      (existing.settlementAmount !== data.settlementAmount ||
        existing.settlementCurrency !== data.settlementCurrency)
    ) {
      existing.settlementAmount = data.settlementAmount;
      existing.settlementCurrency = data.settlementCurrency;
      changed = true;
    }
  }
  // `refunded` is fixed at creation: a refund is its own document whose
  // amount is subtracted, so flipping a sale to refunded would subtract it
  // instead of netting it to zero.
  if (existing.renewal !== data.renewal) {
    existing.renewal = data.renewal;
    changed = true;
  }
  if (!existing.visitorId) {
    const link = await attribute(data);
    if (link?.visitorId) {
      existing.visitorId = link.visitorId;
      existing.sessionId = link.sessionId;
      changed = true;
    }
  }
  if (changed) await existing.save();
  return existing;
}

async function attribute(data: NewPayment) {
  return linkPaymentToVisitor(
    {
      metadata: data.visitorId
        ? { visitorId: data.visitorId, sessionId: data.sessionId }
        : data.metadata,
      customerEmail: data.customerEmail,
      customerId: data.customerId,
      checkoutSessionId: data.checkoutSessionId,
      timestamp: data.timestamp || new Date(),
    },
    data.websiteId,
  );
}

/** Provider ids are unique per website, never globally. */
export function paymentKey(
  websiteId: string | Types.ObjectId,
  provider: string,
  providerPaymentId: string,
) {
  return {
    websiteId: new Types.ObjectId(websiteId),
    provider,
    providerPaymentId,
  };
}

export async function createPayment(data: NewPayment) {
  await connectDB();

  const key = paymentKey(data.websiteId, data.provider, data.providerPaymentId);
  const existingPayment = await Payment.findOne(key);
  if (existingPayment) return refreshExisting(existingPayment, data);

  const link = await attribute(data);

  try {
    const payment = new Payment({
      websiteId: data.websiteId,
      provider: data.provider,
      providerPaymentId: data.providerPaymentId,
      amount: data.amount,
      currency: data.currency,
      settlementAmount: data.settlementAmount,
      settlementCurrency: data.settlementCurrency,
      renewal: data.renewal,
      refunded: data.refunded,
      customerEmail: data.customerEmail,
      customerId: data.customerId,
      metadata: data.metadata,
      sessionId: link?.sessionId,
      visitorId: link?.visitorId,
      timestamp: data.timestamp || new Date(),
    });

    await payment.save();
    return payment;
  } catch (error: any) {
    // Another sync or the browser created it first.
    if (error.code === 11000) {
      const raced = await Payment.findOne(key);
      if (raced) return refreshExisting(raced, data);
    }
    throw error;
  }
}

/**
 * Update payment refunded status
 */
export async function updatePaymentRefunded(
  websiteId: string,
  provider: string,
  providerPaymentId: string,
  refunded: boolean,
) {
  await connectDB();

  try {
    const payment = await Payment.findOneAndUpdate(
      paymentKey(websiteId, provider, providerPaymentId),
      { $set: { refunded } },
      { new: true },
    );

    return payment;
  } catch (error) {
    throw error;
  }
}

/**
 * Get payments for a website
 */
export async function getPaymentsByWebsiteId(
  websiteId: string,
  startDate?: Date,
  endDate?: Date,
) {
  await connectDB();

  try {
    const query: any = { websiteId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const payments = await Payment.find(query).sort({ timestamp: -1 });
    return payments;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete all payments for a website/provider combination
 * Used when a payment provider is disconnected
 */
export async function deletePaymentsByProvider(
  websiteId: string,
  provider: "stripe" | "lemonsqueezy" | "polar" | "paddle" | "other",
) {
  await connectDB();

  try {
    const result = await Payment.deleteMany({
      websiteId,
      provider,
    });

    const deletedCount = result.deletedCount || 0;
    return deletedCount;
  } catch (error) {
    throw error;
  }
}
