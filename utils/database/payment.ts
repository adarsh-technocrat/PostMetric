import connectDB from "@/db";
import Payment, { type IPayment } from "@/db/models/Payment";
import { linkPaymentToVisitor } from "@/utils/revenue/linkPayment";

export type NewPayment = {
  websiteId: string;
  provider: "stripe" | "lemonsqueezy" | "polar" | "paddle" | "other";
  providerPaymentId: string;
  amount: number;
  currency: string;
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
 * Bring an already-stored payment up to date: renewal/refund flags can change
 * on a later sync, and a payment synced before its browser clue arrived can
 * be attributed once it does.
 */
async function refreshExisting(
  existing: IPayment,
  data: NewPayment,
): Promise<IPayment> {
  let changed = false;
  if (existing.renewal !== data.renewal || existing.refunded !== data.refunded) {
    existing.renewal = data.renewal;
    existing.refunded = data.refunded;
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

export async function createPayment(data: NewPayment) {
  await connectDB();

  const existingPayment = await Payment.findOne({
    provider: data.provider,
    providerPaymentId: data.providerPaymentId,
  });
  if (existingPayment) return refreshExisting(existingPayment, data);

  const link = await attribute(data);

  try {
    const payment = new Payment({
      websiteId: data.websiteId,
      provider: data.provider,
      providerPaymentId: data.providerPaymentId,
      amount: data.amount,
      currency: data.currency,
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
      const raced = await Payment.findOne({
        provider: data.provider,
        providerPaymentId: data.providerPaymentId,
      });
      if (raced) return refreshExisting(raced, data);
    }
    throw error;
  }
}

/**
 * Update payment refunded status
 */
export async function updatePaymentRefunded(
  provider: string,
  providerPaymentId: string,
  refunded: boolean,
) {
  await connectDB();

  try {
    const payment = await Payment.findOneAndUpdate(
      { provider, providerPaymentId },
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
