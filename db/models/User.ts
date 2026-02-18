import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  avatarUrl?: string;
  subscription?: {
    plan: "free" | "starter" | "pro" | "enterprise";
    status: "trial" | "active" | "cancelled";
    trialEndsAt?: Date;
    currentPeriodEnd?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    volume?: string; // VolumeKey from pricing-tiers
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "starter", "pro", "enterprise"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["trial", "active", "cancelled"],
        default: "trial",
      },
      trialEndsAt: {
        type: Date,
      },
      currentPeriodEnd: {
        type: Date,
      },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
      volume: { type: String },
    },
  },
  {
    timestamps: true,
  },
);

// Prevent model re-compilation during hot reload in development
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
