import { NextRequest, NextResponse } from "next/server";
import {
  getWorkflowsByWebsiteId,
  createWorkflow,
} from "@/utils/database/workflow";
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

    const workflows = await getWorkflowsByWebsiteId(websiteId);
    return NextResponse.json({ workflows });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
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
    const { name, description, nodes, edges, trigger, isActive } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Workflow name is required" },
        { status: 400 },
      );
    }

    const workflow = await createWorkflow(websiteId, {
      name: name.trim(),
      description: typeof description === "string" ? description : undefined,
      nodes: Array.isArray(nodes) ? nodes : [],
      edges: Array.isArray(edges) ? edges : [],
      trigger:
        trigger && typeof trigger === "object" && trigger.type
          ? {
              type: trigger.type,
              config: trigger.config,
            }
          : undefined,
      isActive:
        typeof isActive === "boolean" ? isActive : undefined,
    });

    return NextResponse.json({ workflow });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 },
    );
  }
}
