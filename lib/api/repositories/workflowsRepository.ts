import { apiClient } from "@/lib/api/client";

export interface WorkflowItem {
  _id: string;
  name: string;
  description?: string;
  trigger: { type: string };
  isActive: boolean;
  updatedAt: string;
  nodes?: unknown[];
  edges?: unknown[];
}

export async function getWorkflows(
  websiteId: string,
): Promise<WorkflowItem[]> {
  const { data } = await apiClient.get<{ workflows: WorkflowItem[] }>(
    `/api/websites/${websiteId}/workflows`,
  );
  return data.workflows ?? [];
}

export async function getWorkflow(
  websiteId: string,
  workflowId: string,
): Promise<WorkflowItem> {
  const { data } = await apiClient.get<{ workflow: WorkflowItem }>(
    `/api/websites/${websiteId}/workflows/${workflowId}`,
  );
  return data.workflow;
}

export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  nodes?: unknown[];
  edges?: unknown[];
  trigger?: { type: string };
  isActive?: boolean;
}

export async function createWorkflow(
  websiteId: string,
  payload: CreateWorkflowPayload,
): Promise<WorkflowItem> {
  const { data } = await apiClient.post<{ workflow: WorkflowItem }>(
    `/api/websites/${websiteId}/workflows`,
    {
      name: payload.name,
      description: payload.description,
      nodes: payload.nodes ?? [],
      edges: payload.edges ?? [],
      trigger: payload.trigger ?? { type: "manual" },
      isActive: payload.isActive ?? false,
    },
  );
  return data.workflow;
}

export interface UpdateWorkflowPayload {
  name?: string;
  nodes?: unknown[];
  edges?: unknown[];
  isActive?: boolean;
}

export async function updateWorkflow(
  websiteId: string,
  workflowId: string,
  payload: UpdateWorkflowPayload,
): Promise<WorkflowItem> {
  const { data } = await apiClient.patch<{ workflow: WorkflowItem }>(
    `/api/websites/${websiteId}/workflows/${workflowId}`,
    payload,
  );
  return data.workflow;
}

export async function deleteWorkflow(
  websiteId: string,
  workflowId: string,
): Promise<void> {
  await apiClient.delete(
    `/api/websites/${websiteId}/workflows/${workflowId}`,
  );
}
