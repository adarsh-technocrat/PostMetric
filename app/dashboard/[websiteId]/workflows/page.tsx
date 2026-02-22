"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isValidObjectId } from "@/utils/validation";
import { useAppDispatch } from "@/store/hooks";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import { Button } from "@/components/ui/button";
import { Plus, Workflow } from "lucide-react";
import { ActionBuilderDialog } from "@/components/dashboard/actions";
import { WorkflowListItem } from "@/components/dashboard/workflows";
import { toast } from "@/lib/toast";

interface WorkflowItem {
  _id: string;
  name: string;
  description?: string;
  trigger: { type: string };
  isActive: boolean;
  updatedAt: string;
  nodes?: unknown[];
  edges?: unknown[];
}

export default function WorkflowsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isValidObjectId(websiteId)) {
      router.push("/dashboard");
      return;
    }
    dispatch(fetchWebsiteDetailsById(websiteId)).finally(() =>
      setLoading(false),
    );
  }, [websiteId, router, dispatch]);

  const refreshWorkflows = useCallback(() => {
    if (!websiteId || !isValidObjectId(websiteId)) return;
    fetch(`/api/websites/${websiteId}/workflows`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed")),
      )
      .then((data) => setWorkflows(data.workflows || []))
      .catch(() => setWorkflows([]));
  }, [websiteId]);

  useEffect(() => {
    refreshWorkflows();
  }, [refreshWorkflows]);

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

  const handleToggle = useCallback(
    async (workflowId: string, isActive: boolean) => {
      const res = await fetch(
        `/api/websites/${websiteId}/workflows/${workflowId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update");
      }
      setWorkflows((prev) =>
        prev.map((w) => (w._id === workflowId ? { ...w, isActive } : w)),
      );
    },
    [websiteId],
  );

  const handleDuplicate = useCallback(
    async (workflowId: string) => {
      try {
        const res = await fetch(
          `/api/websites/${websiteId}/workflows/${workflowId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch workflow");
        const { workflow } = await res.json();
        const duplicateRes = await fetch(
          `/api/websites/${websiteId}/workflows`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `${workflow.name} (copy)`,
              nodes: workflow.nodes || [],
              edges: workflow.edges || [],
              trigger: workflow.trigger || { type: "manual" },
              isActive: false,
            }),
          },
        );
        if (!duplicateRes.ok) {
          const data = await duplicateRes.json().catch(() => ({}));
          throw new Error(data.error || "Failed to duplicate");
        }
        toast.success("Workflow duplicated");
        refreshWorkflows();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to duplicate workflow",
        );
      }
    },
    [websiteId, refreshWorkflows],
  );

  const handleDelete = useCallback(
    async (workflowId: string) => {
      const res = await fetch(
        `/api/websites/${websiteId}/workflows/${workflowId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      toast.success("Workflow deleted");
      refreshWorkflows();
    },
    [websiteId, refreshWorkflows],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

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
        {workflows.length === 0 ? (
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
        onSaved={refreshWorkflows}
      />
    </div>
  );
}
