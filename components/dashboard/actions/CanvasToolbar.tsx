"use client";

import {
  Play,
  ChevronDown,
  Trash2,
  Sparkles,
  Send,
  Download,
  Settings,
  Copy,
  Undo2,
  GitBranch,
  Wrench,
  Braces,
  Sparkle,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
  onDeploy?: () => void;
  onExport?: () => void;
  onOpenSettings?: () => void;
  onCopy?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onAddAction?: (event?: React.MouseEvent) => void;
  onCollapsePanel?: () => void;
  panelCollapsed?: boolean;
  embedMode?: boolean;
}

export function CanvasToolbar({
  onRunOnce,
  scheduleEnabled = false,
  onScheduleChange,
  scheduleLabel = "Every 15 minutes",
  onDeleteSelected,
  hasSelection = false,
  onAutoLayout,
  onDeploy,
  onExport,
  onOpenSettings,
  onCopy,
  onUndo,
  canUndo = false,
  onAddAction,
  onCollapsePanel,
  panelCollapsed = false,
  embedMode = false,
}: CanvasToolbarProps) {
  const TooltipButton = ({
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
            "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:pointer-events-none",
            className,
          )}
          aria-label={label}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );

  const CircleButton = ({
    label,
    onClick,
    children,
    bgClass,
  }: {
    label: string;
    onClick?: () => void;
    children: React.ReactNode;
    bgClass: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95",
            bgClass,
          )}
          aria-label={label}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border bg-card/95 backdrop-blur-sm shadow-lg",
          "border-border",
        )}
      >
        {!embedMode && (
          <div className="flex items-center gap-3 pr-3 border-r border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  onClick={onRunOnce}
                  className="h-8 gap-1.5 bg-[#625fff] hover:bg-[#5348e6] text-white border-0 normal-case font-medium"
                >
                  <Play className="h-3.5 w-3.5" />
                  Run once
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

            <div className="flex items-center gap-2">
              <Switch
                checked={scheduleEnabled}
                onCheckedChange={onScheduleChange}
                className="data-[state=checked]:bg-[#625fff]"
              />
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {scheduleLabel}
              </span>
            </div>
          </div>
        )}

        {/* Center: Canvas tools */}
        <div className="flex items-center gap-0.5">
          <TooltipButton
            label="Delete selected"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
          >
            <Trash2 className="h-4 w-4" />
          </TooltipButton>
          <TooltipButton label="Auto-arrange" onClick={onAutoLayout}>
            <Sparkles className="h-4 w-4" />
          </TooltipButton>
          <TooltipButton label="Run workflow" onClick={onDeploy}>
            <Send className="h-4 w-4" />
          </TooltipButton>
          <TooltipButton label="Export" onClick={onExport}>
            <Download className="h-4 w-4" />
          </TooltipButton>
          <TooltipButton label="Settings" onClick={onOpenSettings}>
            <Settings className="h-4 w-4" />
          </TooltipButton>
          <TooltipButton label="Duplicate" onClick={onCopy}>
            <Copy className="h-4 w-4" />
          </TooltipButton>
          <TooltipButton label="Undo" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </TooltipButton>
        </div>

        <div className="flex items-center gap-1.5 pl-3 border-l border-border">
          <CircleButton
            label="Flow control"
            onClick={onAddAction}
            bgClass="bg-emerald-600 hover:bg-emerald-700"
          >
            <GitBranch className="h-4 w-4" />
          </CircleButton>
          <CircleButton
            label="Backend & Webhooks"
            onClick={onAddAction}
            bgClass="bg-blue-600 hover:bg-blue-700"
          >
            <Wrench className="h-4 w-4" />
          </CircleButton>
          <CircleButton
            label="Variables & code"
            onClick={onAddAction}
            bgClass="bg-amber-600 hover:bg-amber-700"
          >
            <Braces className="h-4 w-4" />
          </CircleButton>
          <CircleButton
            label="AI assist"
            onClick={onAddAction}
            bgClass="bg-violet-600 hover:bg-violet-700"
          >
            <Sparkle className="h-4 w-4" />
          </CircleButton>
          <CircleButton
            label="Add action"
            onClick={onAddAction}
            bgClass="bg-[#625fff] hover:bg-[#5348e6]"
          >
            <Plus className="h-4 w-4" />
          </CircleButton>
          {onCollapsePanel && (
            <TooltipButton
              label={panelCollapsed ? "Show panel" : "Hide panel"}
              onClick={onCollapsePanel}
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  panelCollapsed && "rotate-180",
                )}
              />
            </TooltipButton>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
