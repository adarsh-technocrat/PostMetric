"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isValidObjectId } from "@/utils/validation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import {
  fetchWorkflows,
  updateWorkflow,
  duplicateWorkflow,
  deleteWorkflow,
} from "@/store/slices/workflowsSlice";
import { Button } from "@/components/ui/button";
import { Plus, Workflow } from "lucide-react";
import { ActionBuilderDialog } from "@/components/dashboard/actions";
import { WorkflowListItem } from "@/components/dashboard/workflows";
import { toast } from "@/lib/toast";

export default function WorkflowsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { workflows, loading: workflowsLoading } = useAppSelector(
    (state) => state.workflows,
  );
  const { loading: websiteLoading } = useAppSelector(
    (state) => state.websites,
  );
  const loading = websiteLoading || workflowsLoading;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isValidObjectId(websiteId)) {
      router.push("/dashboard");
      return;
    }
    dispatch(fetchWebsiteDetailsById(websiteId));
    dispatch(fetchWorkflows(websiteId));
  }, [websiteId, router, dispatch]);

  const handleCreate = () => {
    setEditingWorkflowId(null);
    setDialogOpen(true);
  };

  const handleEdit = (workflowId: string) => {
    setEditingWorkflowId(workflowId);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingWorkflowId(null);
  };

  const handleToggle = async (workflowId: string, isActive: boolean) => {
    const result = await dispatch(
      updateWorkflow({ websiteId, workflowId, isActive }),
    );
    if (updateWorkflow.rejected.match(result)) {
      throw new Error(
        typeof result.payload === "string" ? result.payload : "Failed to update",
      );
    }
  };

  const handleDuplicate = async (workflowId: string) => {
    const result = await dispatch(
      duplicateWorkflow({ websiteId, workflowId }),
    );
    if (duplicateWorkflow.fulfilled.match(result)) {
      toast.success("Workflow duplicated");
      dispatch(fetchWorkflows(websiteId));
    } else {
      toast.error(
        typeof result.payload === "string"
          ? result.payload
          : "Failed to duplicate workflow",
      );
    }
  };

  const handleDelete = async (workflowId: string) => {
    const result = await dispatch(
      deleteWorkflow({ websiteId, workflowId }),
    );
    if (deleteWorkflow.fulfilled.match(result)) {
      toast.success("Workflow deleted");
    } else {
      throw new Error(
        typeof result.payload === "string" ? result.payload : "Failed to delete",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/dashboard/${websiteId}/workflows`}
          className="hover:text-foreground transition-colors"
        >
          Builders
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">Workflows</span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Workflows</h1>
        <Button
          variant="stone"
          size="sm"
          onClick={handleCreate}
          className="gap-2 h-9 px-4 normal-case shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create workflow
        </Button>
      </div>

      <div className="flex flex-col overflow-hidden rounded-md border bg-card">
        {loading ? (
          <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No workflows yet
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create a workflow to automate actions based on PostMetric events.
            </p>
            <Button
              variant="stone"
              size="sm"
              onClick={handleCreate}
              className="normal-case"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create your first workflow
            </Button>
          </div>
        ) : (
          <ul className="w-full divide-y divide-border" data-testid="workflows">
            {workflows.map((w) => (
              <WorkflowListItem
                key={w._id}
                workflow={w}
                websiteId={websiteId}
                onEdit={handleEdit}
                onToggle={handleToggle}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>

      <ActionBuilderDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        websiteId={websiteId}
        workflowId={editingWorkflowId}
        onSaved={() => dispatch(fetchWorkflows(websiteId))}
      />
    </div>
  );
}
