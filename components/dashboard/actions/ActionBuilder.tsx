"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ActionNode, type ActionNodeData } from "./ActionNode";
import { ConditionNode, type ConditionNodeData } from "./ConditionNode";
import { StartNode, type StartNodeData } from "./StartNode";
import { ActionConfigPanel } from "./ActionConfigPanel";
import { ActionModulePicker, type ActionModule } from "./ActionModulePicker";
import { CanvasToolbar } from "./CanvasToolbar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const START_NODE_ID = "start";

const nodeTypes: NodeTypes = {
  action: ActionNode,
  condition: ConditionNode,
  start: StartNode,
};

type BuilderNode = Node<ActionNodeData | ConditionNodeData | StartNodeData>;

const defaultNodes: Node<ActionNodeData | ConditionNodeData>[] = [];
const defaultEdges: Edge[] = [];

function createStartNode(
  onModuleSelect: (module: import("./ActionModulePicker").ActionModule) => void,
): Node<StartNodeData, "start"> {
  return {
    id: START_NODE_ID,
    type: "start",
    position: { x: 250, y: 80 },
    data: { onModuleSelect },
    draggable: true,
  };
}

function CanvasToolbarFlow({
  onOpenModulePicker,
  scheduleEnabled,
  onScheduleChange,
  panelCollapsed,
  onCollapsePanel,
  embedInDialog,
}: {
  onOpenModulePicker: (event?: React.MouseEvent) => void;
  scheduleEnabled: boolean;
  onScheduleChange: (enabled: boolean) => void;
  panelCollapsed: boolean;
  onCollapsePanel: () => void;
  embedInDialog: boolean;
}) {
  const { fitView, deleteElements, getNodes, getEdges } = useReactFlow();
  const selectedNodes = getNodes().filter((n) => n.selected);
  const selectedEdges = getEdges().filter((e) => e.selected);
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;

  return (
    <CanvasToolbar
      embedMode={embedInDialog}
      onRunOnce={() => {}}
      scheduleEnabled={scheduleEnabled}
      onScheduleChange={onScheduleChange}
      scheduleLabel="Every 15 minutes"
      onDeleteSelected={() =>
        deleteElements({
          nodes: selectedNodes,
          edges: selectedEdges,
        })
      }
      hasSelection={hasSelection}
      onAutoLayout={() => fitView()}
      onDeploy={() => {}}
      onExport={() => {}}
      onOpenSettings={() => {}}
      onCopy={() => {}}
      onUndo={() => {}}
      canUndo={false}
      onAddAction={onOpenModulePicker}
      onCollapsePanel={onCollapsePanel}
      panelCollapsed={panelCollapsed}
    />
  );
}

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
  const isEmpty = initialNodes.length === 0 && initialEdges.length === 0;
  const [modulePickerOpen, setModulePickerOpen] = useState(false);
  const [pickerAnchorRect, setPickerAnchorRect] = useState<DOMRect | null>(
    null,
  );
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const handleOpenModulePicker = useCallback((event?: React.MouseEvent) => {
    const rect = event?.currentTarget
      ? (event.currentTarget as HTMLElement).getBoundingClientRect()
      : new DOMRect(
          typeof window !== "undefined" ? window.innerWidth / 2 - 20 : 0,
          typeof window !== "undefined" ? window.innerHeight / 2 - 20 : 0,
          40,
          40,
        );
    setPickerAnchorRect(rect);
    setModulePickerOpen(true);
  }, []);

  const handleModulePickerOpenChange = useCallback((open: boolean) => {
    setModulePickerOpen(open);
    if (!open) setPickerAnchorRect(null);
  }, []);

  const handleModuleSelectRef = useRef<(module: ActionModule) => void>(
    () => {},
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderNode>(
    isEmpty
      ? [createStartNode((m) => handleModuleSelectRef.current(m))]
      : (initialNodes as BuilderNode[]),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    isEmpty ? [] : initialEdges,
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [name, setName] = useState(workflowName);
  const [saving, setSaving] = useState(false);

  const handleModuleSelect = useCallback(
    (module: ActionModule) => {
      const newId = `action-${Date.now()}`;
      const newActionNode: Node<ActionNodeData> = {
        id: newId,
        type: "action",
        position: { x: 250, y: 220 },
        data: {
          label: module.name,
          actionType: module.actionType,
          actionNumber: 1,
        },
      };
      setNodes((prev: BuilderNode[]) => [...prev, newActionNode]);
      setEdges((prev: Edge[]) => [
        ...prev,
        {
          id: `e-${START_NODE_ID}-${newId}`,
          source: START_NODE_ID,
          target: newId,
          type: "step",
        },
      ]);
    },
    [setNodes, setEdges],
  );

  handleModuleSelectRef.current = handleModuleSelect;

  useEffect(() => {
    setName(workflowName);
  }, [workflowName]);

  useEffect(() => {
    if (isEmpty) {
      setNodes([createStartNode((m) => handleModuleSelectRef.current(m))]);
      setEdges([]);
    } else {
      setNodes(initialNodes as BuilderNode[]);
      setEdges(initialEdges);
    }
  }, [workflowId, isEmpty, initialNodes, initialEdges, setNodes, setEdges]);

  const nodesToSave = nodes.filter(
    (n): n is Node<ActionNodeData | ConditionNodeData> => n.type !== "start",
  );
  const edgesToSave = edges.filter(
    (e) => e.source !== START_NODE_ID && e.target !== START_NODE_ID,
  );

  useEffect(() => {
    onChange?.(nodesToSave, edgesToSave);
  }, [nodesToSave, edgesToSave, onChange]);

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
        nodes: nodesToSave,
        edges: edgesToSave,
      });
    } finally {
      setSaving(false);
    }
  }, [onSave, name, nodesToSave, edgesToSave]);

  const selectedActionData =
    selectedNode?.type === "action"
      ? (selectedNode.data as ActionNodeData)
      : null;

  return (
    <div className="contents">
      <ActionModulePicker
        open={modulePickerOpen}
        onOpenChange={handleModulePickerOpenChange}
        onSelect={handleModuleSelect}
        anchorRect={pickerAnchorRect}
      />
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
                <Panel position="bottom-center" className="mb-4">
                  <CanvasToolbarFlow
                    onOpenModulePicker={handleOpenModulePicker}
                    scheduleEnabled={scheduleEnabled}
                    onScheduleChange={setScheduleEnabled}
                    panelCollapsed={panelCollapsed}
                    onCollapsePanel={() => setPanelCollapsed((prev) => !prev)}
                    embedInDialog={embedInDialog}
                  />
                </Panel>
              </ReactFlow>
            </div>
          </div>

          {selectedActionData && !panelCollapsed && (
            <div className="w-80 shrink-0 border-l">
              <ActionConfigPanel
                nodeData={selectedActionData}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
