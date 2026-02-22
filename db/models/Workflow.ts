import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWorkflowTrigger {
  type: "manual" | "event" | "schedule" | "recurring";
  config?: {
    eventType?: string;
    runAt?: string;
    cron?: string;
    interval?: "daily" | "weekly";
    time?: string;
  };
}

export interface IWorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  type?: string;
}

export interface IWorkflow extends Document {
  websiteId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  trigger: IWorkflowTrigger;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const WorkflowEdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String },
    type: { type: String, default: "step" },
  },
  { _id: false },
);

const WorkflowTriggerSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["manual", "event", "schedule", "recurring"],
      default: "manual",
    },
    config: {
      eventType: { type: String },
      runAt: { type: String },
      cron: { type: String },
      interval: { type: String, enum: ["daily", "weekly"] },
      time: { type: String },
    },
  },
  { _id: false },
);

const WorkflowSchema = new Schema<IWorkflow>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    nodes: {
      type: [WorkflowNodeSchema],
      default: [],
    },
    edges: {
      type: [WorkflowEdgeSchema],
      default: [],
    },
    trigger: {
      type: WorkflowTriggerSchema,
      default: () => ({ type: "manual" }),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

WorkflowSchema.index({ websiteId: 1, updatedAt: -1 });

const Workflow: Model<IWorkflow> =
  mongoose.models.Workflow ||
  mongoose.model<IWorkflow>("Workflow", WorkflowSchema);

export default Workflow;
