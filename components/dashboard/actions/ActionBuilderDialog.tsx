"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ActionBuilder } from "./ActionBuilder";
import type { Node, Edge } from "@xyflow/react";
import type { ActionNodeData } from "./ActionNode";
import type { ConditionNodeData } from "./ConditionNode";
import { toast } from "@/lib/toast";

interface ActionBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
  workflowId?: string | null;
  onSaved?: () => void;
}

export function ActionBuilderDialog({
  open,
  onOpenChange,
  websiteId,
  workflowId,
  onSaved,
}: ActionBuilderDialogProps) {
  const [workflow, setWorkflow] = useState<{
    _id: string;
    name: string;
    nodes: Node<ActionNodeData | ConditionNodeData>[];
    edges: Edge[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("Untitled workflow");
  const nodesEdgesRef = useRef<{
    nodes: Node<ActionNodeData | ConditionNodeData>[];
    edges: Edge[];
  }>({ nodes: [], edges: [] });

  useEffect(() => {
    if (!open) return;
    if (!workflowId) {
      setWorkflow(null);
      setName("Untitled workflow");
      nodesEdgesRef.current = { nodes: [], edges: [] };
      return;
    }
    setLoading(true);
    fetch(`/api/websites/${websiteId}/workflows/${workflowId}`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed")),
      )
      .then((data) => {
        setWorkflow(data.workflow);
        setName(data.workflow.name || "Untitled workflow");
        nodesEdgesRef.current = {
          nodes: data.workflow.nodes || [],
          edges: data.workflow.edges || [],
        };
      })
      .catch(() => setWorkflow(null))
      .finally(() => setLoading(false));
  }, [open, websiteId, workflowId]);

  const saveWorkflow = useCallback(
    async (params: {
      name: string;
      nodes: Node<ActionNodeData | ConditionNodeData>[];
      edges: Edge[];
    }) => {
      if (workflowId) {
        const res = await fetch(
          `/api/websites/${websiteId}/workflows/${workflowId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: params.name,
              nodes: params.nodes,
              edges: params.edges,
            }),
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save");
        }
        const { workflow: updated } = await res.json();
        setWorkflow(updated);
        toast.success("Workflow saved");
        onSaved?.();
      } else {
        const res = await fetch(`/api/websites/${websiteId}/workflows`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: params.name,
            nodes: params.nodes,
            edges: params.edges,
            trigger: { type: "manual" },
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save");
        }
        const { workflow: created } = await res.json();
        toast.success("Workflow created");
        setWorkflow(created);
        onSaved?.();
      }
    },
    [websiteId, workflowId, onSaved, onOpenChange],
  );

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextChangeRef = useRef(true);
  const nameRef = useRef(name);
  nameRef.current = name;

  const scheduleSave = useCallback(
    (nodes: Node<ActionNodeData | ConditionNodeData>[], edges: Edge[]) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveWorkflow({
          name: nameRef.current.trim() || "Untitled workflow",
          nodes,
          edges,
        }).catch(() => {});
        saveTimeoutRef.current = null;
      }, 800);
    },
    [saveWorkflow],
  );

  const handleChange = useCallback(
    (nodes: Node<ActionNodeData | ConditionNodeData>[], edges: Edge[]) => {
      nodesEdgesRef.current = { nodes, edges };
      if (!workflowId) return;
      if (skipNextChangeRef.current) {
        skipNextChangeRef.current = false;
        return;
      }
      scheduleSave(nodes, edges);
    },
    [scheduleSave, workflowId],
  );

  useEffect(() => {
    if (open) skipNextChangeRef.current = true;
  }, [open]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      if (!workflowId) return;
      skipNextChangeRef.current = false;
      scheduleSave(nodesEdgesRef.current.nodes, nodesEdgesRef.current.edges);
    },
    [scheduleSave, workflowId],
  );

  const handleCreate = useCallback(async () => {
    if (workflowId) return;
    setCreating(true);
    try {
      await saveWorkflow({
        name: nameRef.current.trim() || "Untitled workflow",
        nodes: nodesEdgesRef.current.nodes,
        edges: nodesEdgesRef.current.edges,
      });
      onOpenChange(false);
    } catch {
      toast.error("Failed to create workflow");
    } finally {
      setCreating(false);
    }
  }, [workflowId, saveWorkflow, onOpenChange]);

  const nodes = workflow?.nodes ?? [];
  const edges = workflow?.edges ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative flex flex-col w-[min(1600px,95vw)] max-w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden p-0 gap-0 border-0 [&>button]:absolute [&>button]:right-5 [&>button]:top-5 [&>button]:z-20 [&>button]:rounded-md [&>button]:p-1.5 [&>button]:hover:bg-stone-100">
        <div className="shrink-0 flex items-center gap-4 pl-6 pr-14 pt-6 pb-2">
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Workflow name"
            className="flex-1 min-w-0 text-xl font-semibold text-foreground bg-transparent border-0 outline-none placeholder:text-muted-foreground focus:ring-0"
          />
          {!workflowId && !loading && (
            <Button
              onClick={handleCreate}
              className="shrink-0 font-mono font-semibold normal-case text-white bg-[#625fff] hover:opacity-90 hover:bg-[#625fff]"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create workflow"}
            </Button>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 min-h-[400px] bg-muted/50 animate-pulse rounded-b-lg" />
          ) : (
            <ActionBuilder
              key={workflowId ?? "new"}
              workflowId={workflowId ?? undefined}
              workflowName={workflow?.name ?? "Untitled workflow"}
              initialNodes={nodes}
              initialEdges={edges}
              embedInDialog
              onChange={handleChange}
              onSave={saveWorkflow}
              className="flex-1 min-h-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
