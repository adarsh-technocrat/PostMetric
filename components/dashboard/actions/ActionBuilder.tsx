"use client";

import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ActionNode, type ActionNodeData } from "./ActionNode";
import { ConditionNode, type ConditionNodeData } from "./ConditionNode";
import { ActionConfigPanel } from "./ActionConfigPanel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const nodeTypes: NodeTypes = {
  action: ActionNode,
  condition: ConditionNode,
};

const defaultNodes: Node<ActionNodeData | ConditionNodeData>[] = [];
const defaultEdges: Edge[] = [];

interface ActionBuilderProps {
  className?: string;
  workflowId?: string;
  workflowName?: string;
  initialNodes?: Node<ActionNodeData | ConditionNodeData>[];
  initialEdges?: Edge[];
  embedInDialog?: boolean;
  onSave?: (params: {
    name: string;
    nodes: Node<ActionNodeData | ConditionNodeData>[];
    edges: Edge[];
  }) => Promise<void>;
  onChange?: (
    nodes: Node<ActionNodeData | ConditionNodeData>[],
    edges: Edge[],
  ) => void;
}

export function ActionBuilder({
  className,
  workflowId,
  workflowName = "Untitled workflow",
  initialNodes = defaultNodes,
  initialEdges = defaultEdges,
  embedInDialog = false,
  onSave,
  onChange,
}: ActionBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [name, setName] = useState(workflowName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(workflowName);
  }, [workflowName]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [workflowId, initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    onChange?.(nodes, edges);
  }, [nodes, edges, onChange]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, type: "step" }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim() || "Untitled workflow",
        nodes,
        edges,
      });
    } finally {
      setSaving(false);
    }
  }, [onSave, name, nodes, edges]);

  const selectedActionData =
    selectedNode?.type === "action"
      ? (selectedNode.data as ActionNodeData)
      : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-0 min-h-[400px]",
        className ?? "h-[calc(100vh-12rem)]",
      )}
    >
      {onSave && !embedInDialog && (
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-background rounded-t-lg">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow name"
            className="max-w-xs h-9"
          />
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
      <div className="flex flex-1 gap-0 min-h-0">
        <div className="flex flex-1 flex-col overflow-hidden rounded-b-lg border border-t-0 bg-background">
          <div className="relative flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={{ type: "step" }}
              fitView
              colorMode="light"
              className="bg-slate-100"
            >
              <Background gap={20} size={1} color="#94a3b8" />
            </ReactFlow>
          </div>
        </div>

        <div className="w-80 shrink-0 border-l">
          <ActionConfigPanel
            nodeData={selectedActionData}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      </div>
    </div>
  );
}
