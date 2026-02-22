import { NextRequest, NextResponse } from "next/server";
import {
  getLinkTemplatesByWebsiteId,
  createLinkTemplate,
} from "@/utils/database/link-template";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 },
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const templates = await getLinkTemplatesByWebsiteId(websiteId);
    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch link templates" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 },
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      baseUrl,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      tags,
      comments,
      folder,
      conversionTracking,
      customPreview,
      password,
      expiresAt,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 },
      );
    }

    const template = await createLinkTemplate(websiteId, {
      name: name.trim(),
      baseUrl: typeof baseUrl === "string" ? baseUrl : undefined,
      utmSource: typeof utmSource === "string" ? utmSource : undefined,
      utmMedium: typeof utmMedium === "string" ? utmMedium : undefined,
      utmCampaign: typeof utmCampaign === "string" ? utmCampaign : undefined,
      utmTerm: typeof utmTerm === "string" ? utmTerm : undefined,
      utmContent: typeof utmContent === "string" ? utmContent : undefined,
      tags: Array.isArray(tags)
        ? tags.filter((t: unknown) => typeof t === "string")
        : undefined,
      comments: typeof comments === "string" ? comments : undefined,
      folder: typeof folder === "string" ? folder : undefined,
      conversionTracking:
        typeof conversionTracking === "boolean"
          ? conversionTracking
          : undefined,
      customPreview:
        customPreview && typeof customPreview === "object"
          ? {
              title:
                typeof customPreview.title === "string"
                  ? customPreview.title
                  : undefined,
              description:
                typeof customPreview.description === "string"
                  ? customPreview.description
                  : undefined,
              imageUrl:
                typeof customPreview.imageUrl === "string"
                  ? customPreview.imageUrl
                  : undefined,
            }
          : undefined,
      password: typeof password === "string" ? password : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create link template" },
      { status: 500 },
    );
  }
}
