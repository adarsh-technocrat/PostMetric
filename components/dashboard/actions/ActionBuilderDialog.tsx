"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ActionBuilder } from "./ActionBuilder";
import type { Node, Edge } from "@xyflow/react";
import type { ActionNodeData } from "./ActionNode";
import type { ConditionNodeData } from "./ConditionNode";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchWorkflow,
  createWorkflow,
  updateWorkflow,
  clearCurrentWorkflow,
} from "@/store/slices/workflowsSlice";
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
  const dispatch = useAppDispatch();
  const { currentWorkflow, workflowLoading } = useAppSelector(
    (state) => state.workflows,
  );
  const [name, setName] = useState(
    currentWorkflow?.name ?? "Untitled workflow",
  );
  const nodesEdgesRef = useRef<{
    nodes: Node<ActionNodeData | ConditionNodeData>[];
    edges: Edge[];
  }>({ nodes: [], edges: [] });

  useEffect(() => {
    if (!open) return;
    if (!workflowId) {
      dispatch(clearCurrentWorkflow());
      setName("Untitled workflow");
      nodesEdgesRef.current = { nodes: [], edges: [] };
      return;
    }
    dispatch(fetchWorkflow({ websiteId, workflowId }));
  }, [open, websiteId, workflowId, dispatch]);

  useEffect(() => {
    if (currentWorkflow && workflowId === currentWorkflow._id) {
      setName(currentWorkflow.name || "Untitled workflow");
      nodesEdgesRef.current = {
        nodes: (currentWorkflow.nodes as Node<ActionNodeData | ConditionNodeData>[]) ?? [],
        edges: (currentWorkflow.edges as Edge[]) ?? [],
      };
    }
  }, [currentWorkflow, workflowId]);

  const nameRef = useRef(name);
  nameRef.current = name;

  const saveWorkflow = useCallback(
    async (params: {
      name: string;
      nodes: Node<ActionNodeData | ConditionNodeData>[];
      edges: Edge[];
    }) => {
      if (workflowId) {
        const result = await dispatch(
          updateWorkflow({
            websiteId,
            workflowId,
            name: params.name,
            nodes: params.nodes,
            edges: params.edges,
          }),
        );
        if (updateWorkflow.rejected.match(result)) {
          throw new Error(
            typeof result.payload === "string" ? result.payload : "Failed to save",
          );
        }
        toast.success("Workflow saved");
        onSaved?.();
      } else {
        const result = await dispatch(
          createWorkflow({
            websiteId,
            name: params.name,
            nodes: params.nodes,
            edges: params.edges,
          }),
        );
        if (createWorkflow.rejected.match(result)) {
          throw new Error(
            typeof result.payload === "string" ? result.payload : "Failed to save",
          );
        }
        toast.success("Workflow created");
        onSaved?.();
      }
    },
    [websiteId, workflowId, dispatch, onSaved],
  );

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextChangeRef = useRef(true);

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
    try {
      await saveWorkflow({
        name: nameRef.current.trim() || "Untitled workflow",
        nodes: nodesEdgesRef.current.nodes,
        edges: nodesEdgesRef.current.edges,
      });
      onOpenChange(false);
    } catch {
      toast.error("Failed to create workflow");
    }
  }, [workflowId, saveWorkflow, onOpenChange]);

  const workflow = workflowId ? currentWorkflow : null;
  const nodes = workflow?.nodes ?? [];
  const edges = workflow?.edges ?? [];
  const creating = false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="relative flex flex-col w-[min(1600px,95vw)] max-w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden p-0 gap-0 border-0 [&>button]:absolute [&>button]:right-5 [&>button]:top-5 [&>button]:z-20 [&>button]:rounded-md [&>button]:p-1.5 [&>button]:hover:bg-stone-100"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="shrink-0 flex items-center gap-4 pl-6 pr-14 pt-6 pb-2">
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            onFocus={(e) =>
              e.currentTarget.setSelectionRange(
                e.currentTarget.value.length,
                e.currentTarget.value.length,
              )
            }
            placeholder="Workflow name"
            className="flex-1 min-w-0 text-xl font-semibold text-foreground bg-transparent border-0 outline-none placeholder:text-muted-foreground focus:ring-0"
          />
          {!workflowId && !workflowLoading && (
            <Button
              onClick={handleCreate}
              variant={"stone"}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create workflow"}
            </Button>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {workflowLoading ? (
            <div className="flex-1 min-h-[400px] bg-muted/50 animate-pulse rounded-b-lg" />
          ) : (
            <ActionBuilder
              key={workflowId ?? "new"}
              workflowId={workflowId ?? undefined}
              workflowName={workflow?.name ?? "Untitled workflow"}
              initialNodes={nodes as Node<ActionNodeData | ConditionNodeData>[]}
              initialEdges={edges as Edge[]}
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
