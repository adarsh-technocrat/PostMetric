import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * A click on an external link (exit link). Stored apart from page views so
 * exit clicks never count as page views or affect session/bounce counters.
 * Collection: "exitclicks".
 */
export interface IExitClick extends Document {
  websiteId: mongoose.Types.ObjectId;
  sessionId: string;
  visitorId: string;
  path: string; // page the link was clicked on
  exitUrl: string; // external URL clicked
  exitLinkText?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExitClickSchema = new Schema<IExitClick>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    visitorId: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    exitUrl: {
      type: String,
      required: true,
    },
    exitLinkText: {
      type: String,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

ExitClickSchema.index({ websiteId: 1, timestamp: -1 });
ExitClickSchema.index({ websiteId: 1, exitUrl: 1, timestamp: -1 });
ExitClickSchema.index({ websiteId: 1, sessionId: 1 });

// Prevent model re-compilation during hot reload in development
const ExitClick: Model<IExitClick> =
  mongoose.models.ExitClick ||
  mongoose.model<IExitClick>("ExitClick", ExitClickSchema);

export default ExitClick;
