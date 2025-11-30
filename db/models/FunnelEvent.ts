import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFunnelEvent extends Document {
  websiteId: mongoose.Types.ObjectId;
  funnelId: mongoose.Types.ObjectId;
  sessionId: string;
  visitorId: string;
  step: number;
  completed: boolean;
  timestamp: Date;
  createdAt: Date;
}

const FunnelEventSchema = new Schema<IFunnelEvent>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },
    funnelId: {
      type: Schema.Types.ObjectId,
      ref: "Funnel",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    step: {
      type: Number,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
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
FunnelEventSchema.index({ websiteId: 1, funnelId: 1, timestamp: -1 });
FunnelEventSchema.index({ websiteId: 1, sessionId: 1, funnelId: 1 });

// Prevent model re-compilation during hot reload in development
const FunnelEvent: Model<IFunnelEvent> =
  mongoose.models.FunnelEvent ||
  mongoose.model<IFunnelEvent>("FunnelEvent", FunnelEventSchema);

export default FunnelEvent;
