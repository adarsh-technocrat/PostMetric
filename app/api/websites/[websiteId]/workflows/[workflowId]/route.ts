import { NextRequest, NextResponse } from "next/server";
import {
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
} from "@/utils/database/workflow";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ websiteId: string; workflowId: string }> },
) {
  try {
    const { websiteId, workflowId } = await params;
    if (!isValidObjectId(websiteId) || !isValidObjectId(workflowId)) {
      return NextResponse.json(
        { error: "Invalid website or workflow ID" },
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

    const workflow = await getWorkflowById(workflowId, websiteId);
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ websiteId: string; workflowId: string }> },
) {
  try {
    const { websiteId, workflowId } = await params;
    if (!isValidObjectId(websiteId) || !isValidObjectId(workflowId)) {
      return NextResponse.json(
        { error: "Invalid website or workflow ID" },
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

    const updates: Parameters<typeof updateWorkflow>[2] = {};
    if (typeof name === "string") updates.name = name.trim();
    if (typeof description === "string") updates.description = description;
    if (Array.isArray(nodes)) updates.nodes = nodes;
    if (Array.isArray(edges)) updates.edges = edges;
    if (trigger && typeof trigger === "object")
      updates.trigger = {
        type: trigger.type,
        config: trigger.config,
      };
    if (typeof isActive === "boolean") updates.isActive = isActive;

    const workflow = await updateWorkflow(workflowId, websiteId, updates);
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ websiteId: string; workflowId: string }> },
) {
  try {
    const { websiteId, workflowId } = await params;
    if (!isValidObjectId(websiteId) || !isValidObjectId(workflowId)) {
      return NextResponse.json(
        { error: "Invalid website or workflow ID" },
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

    const deleted = await deleteWorkflow(workflowId, websiteId);
    if (!deleted) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 },
    );
  }
}
