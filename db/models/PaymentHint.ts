import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * A browser-side clue that ties a future (or already synced) payment to a
 * visitor: the checkout id the provider put on the success URL, or the email
 * passed to `postmetric("payment", { email })` / identify. The provider sync
 * reads these when the payment itself carries no visitor metadata.
 */
export type PaymentHintKind =
  | "stripe_checkout_session"
  | "polar_checkout"
  | "lemonsqueezy_order"
  | "email";

export interface IPaymentHint extends Document {
  websiteId: mongoose.Types.ObjectId;
  kind: PaymentHintKind;
  value: string;
  visitorId: string;
  sessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentHintSchema = new Schema<IPaymentHint>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
    },
    kind: {
      type: String,
      enum: [
        "stripe_checkout_session",
        "polar_checkout",
        "lemonsqueezy_order",
        "email",
      ],
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    visitorId: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// One hint per clue; a later browser event for the same clue overwrites it.
PaymentHintSchema.index({ websiteId: 1, kind: 1, value: 1 }, { unique: true });

const PaymentHint: Model<IPaymentHint> =
  mongoose.models.PaymentHint ||
  mongoose.model<IPaymentHint>("PaymentHint", PaymentHintSchema);

export default PaymentHint;
