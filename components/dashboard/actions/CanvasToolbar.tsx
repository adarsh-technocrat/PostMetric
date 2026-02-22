"use client";

import { Play, ChevronDown, Trash2, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface CanvasToolbarProps {
  onRunOnce?: () => void;
  scheduleEnabled?: boolean;
  onScheduleChange?: (enabled: boolean) => void;
  scheduleLabel?: string;
  onDeleteSelected?: () => void;
  hasSelection?: boolean;
  onAutoLayout?: () => void;
  onAddAction?: (event?: React.MouseEvent) => void;
  embedMode?: boolean;
}

const ToolbarButton = ({
  label,
  onClick,
  disabled,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors",
          "hover:bg-stone-100 hover:text-stone-800 disabled:opacity-40 disabled:pointer-events-none",
          className,
        )}
        aria-label={label}
      >
        {children}
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs font-medium">
      {label}
    </TooltipContent>
  </Tooltip>
);

export function CanvasToolbar({
  onRunOnce,
  scheduleEnabled = false,
  onScheduleChange,
  scheduleLabel = "Every 15 minutes",
  onDeleteSelected,
  hasSelection = false,
  onAutoLayout,
  onAddAction,
  embedMode = false,
}: CanvasToolbarProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 shadow-sm">
        {!embedMode && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="xs"
                  className="h-8 gap-1.5 normal-case font-medium px-3 bg-[#625fff] text-white hover:bg-[#625fff]/90 border-0"
                  onClick={onRunOnce}
                >
                  <Play className="h-3.5 w-3.5" />
                  Run once
                  <span className="ml-0.5 w-px h-4 bg-white/30" aria-hidden />
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[160px]">
                <DropdownMenuItem onClick={onRunOnce}>
                  Run once
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onScheduleChange?.(!scheduleEnabled)}
                >
                  {scheduleEnabled ? "Disable schedule" : "Enable schedule"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="xs"
              className={cn(
                "h-8 normal-case font-medium px-3 pl-2 border-r border-stone-200 rounded-r-none mr-1",
                scheduleEnabled &&
                  "bg-[#625fff] text-white border-[#625fff] hover:bg-[#625fff]/90 hover:text-white",
              )}
              onClick={() => onScheduleChange?.(!scheduleEnabled)}
            >
              {scheduleLabel}
            </Button>
          </>
        )}

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            label="Delete selected"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
          >
            <Trash2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Auto-arrange" onClick={onAutoLayout}>
            <Sparkles className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pl-2 border-l border-stone-200">
          <Button
            variant="stone"
            size="xs"
            onClick={(e) => onAddAction?.(e)}
            className="h-8 gap-1.5 normal-case font-medium px-3"
          >
            <Plus className="h-3.5 w-3.5" />
            Add action
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
