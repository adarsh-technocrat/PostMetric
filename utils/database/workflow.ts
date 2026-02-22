import connectDB from "@/db";
import Workflow from "@/db/models/Workflow";
import type { IWorkflow } from "@/db/models/Workflow";

export async function getWorkflowsByWebsiteId(
  websiteId: string,
): Promise<IWorkflow[]> {
  await connectDB();
  const workflows = await Workflow.find({ websiteId })
    .sort({ updatedAt: -1 })
    .lean();
  return workflows as IWorkflow[];
}

export async function getWorkflowById(
  workflowId: string,
  websiteId: string,
): Promise<IWorkflow | null> {
  await connectDB();
  const workflow = await Workflow.findOne({
    _id: workflowId,
    websiteId,
  }).lean();
  return workflow as IWorkflow | null;
}

export async function createWorkflow(
  websiteId: string,
  data: {
    name: string;
    description?: string;
    nodes?: IWorkflow["nodes"];
    edges?: IWorkflow["edges"];
    trigger?: IWorkflow["trigger"];
    isActive?: boolean;
  },
): Promise<IWorkflow> {
  await connectDB();
  const workflow = await Workflow.create({
    websiteId,
    name: data.name,
    description: data.description || "",
    nodes: data.nodes || [],
    edges: data.edges || [],
    trigger: data.trigger || { type: "manual" },
    isActive: data.isActive ?? true,
  });
  return workflow.toObject() as IWorkflow;
}

export async function updateWorkflow(
  workflowId: string,
  websiteId: string,
  data: Partial<{
    name: string;
    description: string;
    nodes: IWorkflow["nodes"];
    edges: IWorkflow["edges"];
    trigger: IWorkflow["trigger"];
    isActive: boolean;
  }>,
): Promise<IWorkflow | null> {
  await connectDB();
  const workflow = await Workflow.findOneAndUpdate(
    { _id: workflowId, websiteId },
    { $set: data },
    { new: true },
  ).lean();
  return workflow as IWorkflow | null;
}

export async function deleteWorkflow(
  workflowId: string,
  websiteId: string,
): Promise<boolean> {
  await connectDB();
  const result = await Workflow.deleteOne({
    _id: workflowId,
    websiteId,
  });
  return result.deletedCount === 1;
}
