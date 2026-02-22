import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILinkTemplate extends Document {
  websiteId: mongoose.Types.ObjectId;
  name: string;
  baseUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  tags?: string[];
  comments?: string;
  folder?: string;
  conversionTracking?: boolean;
  customPreview?: {
    title?: string;
    description?: string;
    imageUrl?: string;
  };
  password?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LinkTemplateSchema = new Schema<ILinkTemplate>(
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
    baseUrl: {
      type: String,
      default: "",
    },
    utmSource: { type: String, default: "" },
    utmMedium: { type: String, default: "" },
    utmCampaign: { type: String, default: "" },
    utmTerm: { type: String, default: "" },
    utmContent: { type: String, default: "" },
    tags: [String],
    comments: { type: String, default: "" },
    folder: { type: String, default: "" },
    conversionTracking: { type: Boolean, default: false },
    customPreview: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      imageUrl: { type: String, default: "" },
    },
    password: { type: String, default: "" },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

const LinkTemplate: Model<ILinkTemplate> =
  mongoose.models.LinkTemplate ||
  mongoose.model<ILinkTemplate>("LinkTemplate", LinkTemplateSchema);

export default LinkTemplate;
