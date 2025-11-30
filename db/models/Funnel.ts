import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFunnelStep {
  name: string;
  path?: string; // URL pattern
  goalId?: mongoose.Types.ObjectId; // Or goal event
  order: number;
}

export interface IFunnel extends Document {
  websiteId: mongoose.Types.ObjectId;
  name: string;
  steps: IFunnelStep[];
  createdAt: Date;
  updatedAt: Date;
}

const FunnelStepSchema = new Schema<IFunnelStep>(
  {
    name: {
      type: String,
      required: true,
    },
    path: {
      type: String,
    },
    goalId: {
      type: Schema.Types.ObjectId,
      ref: "Goal",
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const FunnelSchema = new Schema<IFunnel>(
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
    steps: {
      type: [FunnelStepSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model re-compilation during hot reload in development
const Funnel: Model<IFunnel> =
  mongoose.models.Funnel || mongoose.model<IFunnel>("Funnel", FunnelSchema);

export default Funnel;
