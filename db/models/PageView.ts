import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPageView extends Document {
  websiteId: mongoose.Types.ObjectId;
  sessionId: string;
  visitorId: string;

  path: string;
  hostname: string;
  title?: string;
  referrer?: string;
  referrerPath?: string;

  // UTM parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  // Device info
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  country: string;
  region?: string;
  city?: string;

  timestamp: Date;
  createdAt: Date;
}

const PageViewSchema = new Schema<IPageView>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
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
    path: {
      type: String,
      required: true,
      index: true,
    },
    hostname: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
    },
    referrer: {
      type: String,
    },
    referrerPath: {
      type: String,
    },
    utmSource: {
      type: String,
      index: true,
    },
    utmMedium: {
      type: String,
      index: true,
    },
    utmCampaign: {
      type: String,
      index: true,
    },
    utmTerm: {
      type: String,
    },
    utmContent: {
      type: String,
    },
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet"],
      required: true,
      index: true,
    },
    browser: {
      type: String,
      required: true,
      index: true,
    },
    os: {
      type: String,
      required: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
      index: true,
    },
    region: {
      type: String,
    },
    city: {
      type: String,
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

// Compound indexes for common queries
PageViewSchema.index({ websiteId: 1, timestamp: -1 });
PageViewSchema.index({ websiteId: 1, path: 1, timestamp: -1 });
PageViewSchema.index({ websiteId: 1, country: 1, timestamp: -1 });
PageViewSchema.index({ websiteId: 1, utmSource: 1, timestamp: -1 });

// Prevent model re-compilation during hot reload in development
const PageView: Model<IPageView> =
  mongoose.models.PageView ||
  mongoose.model<IPageView>("PageView", PageViewSchema);

export default PageView;
