"use client";

import { useCallback, useState } from "react";
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

import { cn } from "@/lib/utils";

const nodeTypes: NodeTypes = {
  action: ActionNode,
  condition: ConditionNode,
};

const initialNodes: Node<ActionNodeData | ConditionNodeData>[] = [
  {
    id: "1",
    type: "action",
    position: { x: 250, y: 0 },
    data: {
      label: "Update Record users",
      actionType: "backend_call",
      description: "myRef Authenticated User",
      actionNumber: 1,
    },
  },
  {
    id: "2",
    type: "condition",
    position: { x: 250, y: 120 },
    data: {
      label: "Candidate Record == Document Exists",
      condition: "Check if record exists",
      conditionNumber: 1,
    },
  },
  {
    id: "3",
    type: "action",
    position: { x: 0, y: 260 },
    data: {
      label: "Navigate to pageName 2",
      actionType: "navigate",
      description: "myRef usersRef (scaffold)",
      actionNumber: 4,
    },
  },
  {
    id: "4",
    type: "action",
    position: { x: 200, y: 380 },
    data: {
      label: "Create Record candidates",
      actionType: "backend_call",
      description: "candidateRef candidateDetails (Column)",
      actionNumber: 5,
    },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", type: "step" },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    sourceHandle: "true",
    type: "step",
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    sourceHandle: "false",
    type: "step",
  },
];

interface ActionBuilderProps {
  className?: string;
}

export function ActionBuilder({ className }: ActionBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

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

  const selectedActionData =
    selectedNode?.type === "action"
      ? (selectedNode.data as ActionNodeData)
      : null;

  return (
    <div className={cn("flex h-[calc(100vh-12rem)] gap-0", className)}>
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-background">
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
  );
}
