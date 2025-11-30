import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVerificationToken extends Document {
  identifier: string;
  token: string;
  expires: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>({
  identifier: {
    type: String,
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expires: {
    type: Date,
    required: true,
    index: true,
    expires: 0, // TTL index - automatically delete expired tokens
  },
});

// Compound index for identifier + token lookups
VerificationTokenSchema.index({ identifier: 1, token: 1 });

// Prevent model re-compilation during hot reload in development
const VerificationToken: Model<IVerificationToken> =
  mongoose.models.VerificationToken ||
  mongoose.model<IVerificationToken>(
    "VerificationToken",
    VerificationTokenSchema
  );

export default VerificationToken;
