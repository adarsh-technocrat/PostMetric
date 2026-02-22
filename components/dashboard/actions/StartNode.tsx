"use client";

import { memo } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { Plus } from "lucide-react";
import { ActionModulePicker, type ActionModule } from "./ActionModulePicker";

export interface StartNodeData extends Record<string, unknown> {
  onAddFirstAction?: () => void;
  onOpenModulePicker?: (event: React.MouseEvent) => void;
  onModuleSelect?: (module: ActionModule) => void;
}

type StartNodeType = Node<StartNodeData, "start">;

function StartNodeComponent({ data }: NodeProps<StartNodeType>) {
  const onModuleSelect = data.onModuleSelect;

  const button = (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#625fff] text-white shadow-lg ring-2 ring-transparent transition-all hover:ring-[#625fff]/40 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#625fff]/50"
      aria-label="Define first action"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </button>
  );

  if (onModuleSelect) {
    return (
      <ActionModulePicker onSelect={onModuleSelect}>
        {button}
      </ActionModulePicker>
    );
  }

  const onOpen = data.onOpenModulePicker ?? data.onAddFirstAction;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.(e);
      }}
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#625fff] text-white shadow-lg ring-2 ring-transparent transition-all hover:ring-[#625fff]/40 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#625fff]/50"
      aria-label="Define first action"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </button>
  );
}

export const StartNode = memo(StartNodeComponent);
