"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConditionNodeData extends Record<string, unknown> {
  label: string;
  condition: string;
  conditionNumber: number;
}

function ConditionNodeComponent({
  data,
  selected,
}: NodeProps<Node<ConditionNodeData, "condition">>) {
  return (
    <div
      className={cn(
        "min-w-[200px] rounded-xl border-2 border-dashed bg-muted/30 shadow-sm transition-all",
        "border-primary/40 dark:border-primary/30",
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
          <span className="text-xs font-medium text-primary">
            Condition {data.conditionNumber}
          </span>
          <p className="mt-1 text-sm font-medium truncate">{data.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {data.condition}
          </p>
        </div>
      </div>
      <div className="flex border-t">
        <div className="flex flex-1 flex-col items-center border-r py-2">
          <span className="text-xs font-semibold text-green-600 dark:text-green-500">
            TRUE
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!relative !left-0 !h-2 !w-2 !translate-x-0 !border-2 !border-green-500 !bg-background"
          />
        </div>
        <div className="flex flex-1 flex-col items-center py-2">
          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
            FALSE
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!relative !left-0 !h-2 !w-2 !translate-x-0 !border-2 !border-red-500 !bg-background"
          />
        </div>
      </div>
    </div>
  );
}

export const ConditionNode = memo(ConditionNodeComponent);
