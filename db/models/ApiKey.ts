import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";

export interface IApiKey extends Document {
  websiteId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // User who created the key
  name: string; // e.g., "Prod Key", "Dev Key"
  key: string; // The hashed API key (stored in DB)
  keyPrefix: string; // First 11 characters for display (e.g., "df_abc12345")
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ApiKeySchema.statics.generate = function (
  websiteId: string,
  userId: string,
  name: string
) {
  const randomBytes = crypto.randomBytes(32);
  const key = `pm_${randomBytes.toString("hex")}`;
  const keyPrefix = key.substring(0, 11); // "pm_" + 8 chars

  const hashedKey = crypto.createHash("sha256").update(key).digest("hex");

  return {
    key,
    keyPrefix,
    hashedKey,
  };
};

ApiKeySchema.statics.verify = async function (apiKey: string) {
  const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");
  return this.findOne({ key: hashedKey });
};
const ApiKey: Model<IApiKey> =
  mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", ApiKeySchema);

export default ApiKey;
