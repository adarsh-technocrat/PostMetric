"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionType =
  | "backend_call"
  | "navigate"
  | "push_notification"
  | "snack_bar";

export interface ActionNodeData extends Record<string, unknown> {
  label: string;
  actionType: ActionType;
  description?: string;
  actionNumber: number;
}

const ACTION_ICONS: Record<ActionType, string> = {
  backend_call: "API",
  navigate: "→",
  push_notification: "📤",
  snack_bar: "💬",
};

type ActionNodeType = Node<ActionNodeData, "action">;

function ActionNodeComponent({ data, selected }: NodeProps<ActionNodeType>) {
  const icon = ACTION_ICONS[data.actionType as ActionType] ?? "•";

  return (
    <div
      className={cn(
        "min-w-[220px] rounded-lg border bg-card shadow-sm transition-all",
        "border-border",
        selected &&
          "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-primary !bg-background"
      />
      <div className="flex items-start gap-2 p-3">
        <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
          <GripVertical className="h-4 w-4 cursor-grab" />
          <button
            type="button"
            className="rounded p-0.5 hover:bg-muted"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
              {icon}
            </span>
            <span className="text-sm font-medium truncate">
              Action {data.actionNumber}: {data.actionType.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {data.label}
          </p>
          {data.description && (
            <p className="mt-0.5 text-xs text-muted-foreground/80 truncate">
              {data.description}
            </p>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-primary !bg-background"
      />
      <div className="flex justify-center border-t py-1">
        <button
          type="button"
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-primary hover:bg-primary/10"
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="h-3 w-3" />
          Add below
        </button>
      </div>
    </div>
  );
}

export const ActionNode = memo(ActionNodeComponent);
