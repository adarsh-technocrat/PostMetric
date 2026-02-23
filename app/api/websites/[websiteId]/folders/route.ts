import { NextRequest, NextResponse } from "next/server";
import {
  getFoldersByWebsiteId,
  renameFolder,
  deleteFolder,
  createLinkTemplate,
} from "@/utils/database/link-template";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";

export async function GET(
  _request: NextRequest,
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

    const folders = await getFoldersByWebsiteId(websiteId);
    return NextResponse.json({ folders });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch folders" },
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
    const { name } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 },
      );
    }

    const folderName = name.trim();
    const baseUrl = website.domain
      ? `https://${website.domain.replace(/^https?:\/\//, "")}`
      : "https://example.com";

    await createLinkTemplate(websiteId, {
      name: "Untitled",
      baseUrl,
      folder: folderName,
    });

    return NextResponse.json({ folder: folderName });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
    const { oldName, newName } = body;

    if (
      typeof oldName !== "string" ||
      !oldName.trim() ||
      typeof newName !== "string" ||
      !newName.trim()
    ) {
      return NextResponse.json(
        { error: "oldName and newName are required" },
        { status: 400 },
      );
    }

    const count = await renameFolder(websiteId, oldName.trim(), newName.trim());
    return NextResponse.json({ updated: count });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to rename folder" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 },
      );
    }

    const count = await deleteFolder(websiteId, name.trim());
    return NextResponse.json({ updated: count });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}
