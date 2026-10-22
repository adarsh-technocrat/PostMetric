import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExitClick extends Document {
  websiteId: mongoose.Types.ObjectId;
  sessionId: string;
  visitorId: string;
  path: string;
  exitUrl: string;
  exitLinkText?: string;
  timestamp: Date;
}

const ExitClickSchema = new Schema<IExitClick>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
    },
    sessionId: { type: String, required: true },
    visitorId: { type: String, required: true },
    path: { type: String, required: true },
    exitUrl: { type: String, required: true },
    exitLinkText: { type: String },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: false,
    collection: "exitclicks",
  },
);

ExitClickSchema.index({ websiteId: 1, timestamp: -1 });

const ExitClick: Model<IExitClick> =
  mongoose.models.ExitClick ||
  mongoose.model<IExitClick>("ExitClick", ExitClickSchema);

export default ExitClick;
