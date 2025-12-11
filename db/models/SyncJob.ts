import mongoose, { Schema, Document, Model } from "mongoose";

export type SyncJobProvider = "stripe" | "lemonsqueezy" | "polar" | "paddle";
export type SyncJobType = "webhook" | "cron" | "manual" | "periodic";
export type SyncJobStatus = "pending" | "processing" | "completed" | "failed";
export type SyncRange = "today" | "last24h" | "last7d" | "custom";

export interface ISyncJob extends Document {
  websiteId: mongoose.Types.ObjectId;
  provider: SyncJobProvider;
  type: SyncJobType;
  status: SyncJobStatus;
  priority: number; // Higher = more urgent (0-100)

  // Sync parameters
  startDate?: Date;
  endDate?: Date;
  syncRange?: SyncRange;

  // Execution tracking
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;

  // Results
  result?: {
    synced: number;
    skipped: number;
    errors: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const SyncJobSchema = new Schema<ISyncJob>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "lemonsqueezy", "polar", "paddle"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["webhook", "cron", "manual", "periodic"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    priority: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    syncRange: {
      type: String,
      enum: ["today", "last24h", "last7d", "custom"],
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    result: {
      synced: Number,
      skipped: Number,
      errors: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
SyncJobSchema.index({ websiteId: 1, status: 1, createdAt: 1 }); // For querying pending jobs by website
SyncJobSchema.index({ status: 1, priority: -1, createdAt: 1 }); // For job processing
SyncJobSchema.index({ createdAt: 1 }); // For cleanup of old jobs
SyncJobSchema.index({ provider: 1, status: 1 }); // For provider-specific queries

// Prevent model re-compilation during hot reload in development
const SyncJob: Model<ISyncJob> =
  mongoose.models.SyncJob || mongoose.model<ISyncJob>("SyncJob", SyncJobSchema);

export default SyncJob;
