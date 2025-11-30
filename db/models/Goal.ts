import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGoal extends Document {
  websiteId: mongoose.Types.ObjectId;
  name: string;
  event: string; // Event identifier (e.g., 'button_click', 'form_submit')
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
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
    event: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index
GoalSchema.index({ websiteId: 1, event: 1 }, { unique: true });

// Prevent model re-compilation during hot reload in development
const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);

export default Goal;
