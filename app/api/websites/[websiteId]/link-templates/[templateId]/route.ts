import { NextRequest, NextResponse } from "next/server";
import {
  getLinkTemplateById,
  updateLinkTemplate,
  deleteLinkTemplate,
} from "@/utils/database/link-template";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ websiteId: string; templateId: string }> },
) {
  try {
    const { websiteId, templateId } = await params;
    if (!isValidObjectId(websiteId) || !isValidObjectId(templateId)) {
      return NextResponse.json(
        { error: "Invalid ID" },
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

    const template = await getLinkTemplateById(templateId, websiteId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ websiteId: string; templateId: string }> },
) {
  try {
    const { websiteId, templateId } = await params;
    if (!isValidObjectId(websiteId) || !isValidObjectId(templateId)) {
      return NextResponse.json(
        { error: "Invalid ID" },
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
    } = body;

    const data: Record<string, string> = {};
    if (typeof name === "string") data.name = name.trim();
    if (typeof baseUrl === "string") data.baseUrl = baseUrl;
    if (typeof utmSource === "string") data.utmSource = utmSource;
    if (typeof utmMedium === "string") data.utmMedium = utmMedium;
    if (typeof utmCampaign === "string") data.utmCampaign = utmCampaign;
    if (typeof utmTerm === "string") data.utmTerm = utmTerm;
    if (typeof utmContent === "string") data.utmContent = utmContent;

    const template = await updateLinkTemplate(templateId, websiteId, data);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ websiteId: string; templateId: string }> },
) {
  try {
    const { websiteId, templateId } = await params;
    if (!isValidObjectId(websiteId) || !isValidObjectId(templateId)) {
      return NextResponse.json(
        { error: "Invalid ID" },
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

    const deleted = await deleteLinkTemplate(templateId, websiteId);
    if (!deleted) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 },
    );
  }
}
