import mongoose from "mongoose";
import connectDB from "@/db";
import LinkTemplate from "@/db/models/LinkTemplate";
import { getWebsiteById } from "./website";
import type { ILinkTemplate } from "@/db/models/LinkTemplate";

export async function getLinkTemplatesByWebsiteId(
  websiteId: string,
): Promise<ILinkTemplate[]> {
  await connectDB();
  const templates = await LinkTemplate.find({ websiteId })
    .sort({ updatedAt: -1 })
    .lean();
  return templates as ILinkTemplate[];
}

export async function createLinkTemplate(
  websiteId: string,
  data: {
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
    customPreview?: { title?: string; description?: string; imageUrl?: string };
    password?: string;
    expiresAt?: Date;
  },
): Promise<ILinkTemplate> {
  await connectDB();
  const template = await LinkTemplate.create({
    websiteId,
    ...data,
  });
  return template.toObject() as ILinkTemplate;
}

export async function updateLinkTemplate(
  templateId: string,
  websiteId: string,
  data: Partial<{
    name: string;
    baseUrl: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmTerm: string;
    utmContent: string;
    tags: string[];
    comments: string;
    folder: string;
    conversionTracking: boolean;
    customPreview: { title?: string; description?: string; imageUrl?: string };
    password: string;
    expiresAt: Date;
  }>,
): Promise<ILinkTemplate | null> {
  await connectDB();
  const template = await LinkTemplate.findOneAndUpdate(
    { _id: templateId, websiteId },
    { $set: data },
    { new: true },
  ).lean();
  return template as ILinkTemplate | null;
}

export async function deleteLinkTemplate(
  templateId: string,
  websiteId: string,
): Promise<boolean> {
  await connectDB();
  const result = await LinkTemplate.deleteOne({
    _id: templateId,
    websiteId,
  });
  return result.deletedCount === 1;
}

export async function getLinkTemplateById(
  templateId: string,
  websiteId: string,
): Promise<ILinkTemplate | null> {
  await connectDB();
  const template = await LinkTemplate.findOne({
    _id: templateId,
    websiteId,
  }).lean();
  return template as ILinkTemplate | null;
}

export interface FolderWithCount {
  name: string;
  linkCount: number;
}

export async function getFoldersByWebsiteId(
  websiteId: string,
): Promise<FolderWithCount[]> {
  await connectDB();
  const result = await LinkTemplate.aggregate([
    { $match: { websiteId: new mongoose.Types.ObjectId(websiteId) } },
    { $group: { _id: { $ifNull: ["$folder", ""] }, count: { $sum: 1 } } },
    { $match: { "_id": { $ne: "" } } },
    { $sort: { _id: 1 } },
    { $project: { name: "$_id", linkCount: "$count", _id: 0 } },
  ]);
  return result as FolderWithCount[];
}

export async function renameFolder(
  websiteId: string,
  oldName: string,
  newName: string,
): Promise<number> {
  await connectDB();
  const result = await LinkTemplate.updateMany(
    { websiteId, folder: oldName },
    { $set: { folder: newName } },
  );
  return result.modifiedCount;
}

export async function deleteFolder(
  websiteId: string,
  folderName: string,
): Promise<number> {
  await connectDB();
  const result = await LinkTemplate.updateMany(
    { websiteId, folder: folderName },
    { $set: { folder: "" } },
  );
  return result.modifiedCount;
}
