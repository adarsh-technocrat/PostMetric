import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  websiteId: mongoose.Types.ObjectId;
  provider: "stripe" | "lemonsqueezy" | "polar" | "paddle" | "other";
  providerPaymentId: string;
  /**
   * Amount ×100 in MAJOR units of `currency` ("cents" for every currency):
   * 12.34 USD → 1234, ¥500 JPY → 50000. Stripe reports zero-decimal
   * currencies (JPY, KRW, …) without minor units, so the sync multiplies those
   * by 100; the payments API receives major units and stores
   * Math.round(amount * 100). For refunds (refunded: true) this is the refund
   * amount, and it is subtracted from revenue.
   */
  amount: number;
  currency: string;
  /** Stripe only: what the payment settled to on the balance (same ×100 scale). */
  settlementAmount?: number;
  settlementCurrency?: string;
  renewal: boolean;
  refunded: boolean;

  customerEmail?: string;
  customerId?: string;
  sessionId?: string;
  visitorId?: string;

  // Metadata
  metadata?: Record<string, any>;

  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    visitorId: {
      type: String,
      index: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "lemonsqueezy", "polar", "paddle", "other"],
      required: true,
      index: true,
    },
    providerPaymentId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "usd",
    },
    settlementAmount: {
      type: Number,
    },
    settlementCurrency: {
      type: String,
    },
    renewal: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    refunded: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    customerEmail: {
      type: String,
      index: true,
    },
    customerId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
PaymentSchema.index({ websiteId: 1, timestamp: -1 });
PaymentSchema.index({ websiteId: 1, renewal: 1, timestamp: -1 });
PaymentSchema.index({ websiteId: 1, refunded: 1, timestamp: -1 });
// A provider id is unique per website, not globally: two sites can share a
// Stripe account (or report the same id through the API).
PaymentSchema.index(
  { websiteId: 1, provider: 1, providerPaymentId: 1 },
  { unique: true },
);

// Prevent model re-compilation during hot reload in development
const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
