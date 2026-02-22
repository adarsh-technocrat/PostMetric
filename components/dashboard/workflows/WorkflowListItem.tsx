"use client";

import { useState } from "react";
import { Pencil, Copy, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/toast";

interface WorkflowItem {
  _id: string;
  name: string;
  description?: string;
  trigger: { type: string };
  isActive: boolean;
  updatedAt: string;
  nodes?: unknown[];
  edges?: unknown[];
}

interface WorkflowListItemProps {
  workflow: WorkflowItem;
  websiteId: string;
  onEdit: (workflowId: string) => void;
  onToggle: (workflowId: string, isActive: boolean) => void;
  onDuplicate: (workflowId: string) => void;
  onDelete: (workflowId: string) => void;
}

export function WorkflowListItem({
  workflow,
  onEdit,
  onToggle,
  onDuplicate,
  onDelete,
}: WorkflowListItemProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await onToggle(workflow._id, !workflow.isActive);
    } finally {
      setToggling(false);
    }
  };

  return (
    <li>
      <div className="flex w-full items-center justify-between transition hover:bg-muted/50">
        <div className="group flex w-full max-w-full items-center justify-between overflow-hidden px-4 py-4 sm:px-6">
          <div className="relative flex-1 overflow-hidden pr-4 text-sm">
            <div>
              <button
                type="button"
                onClick={() => onEdit(workflow._id)}
                className="text-left w-full hover:opacity-80 transition-opacity"
              >
                <span className="break-words font-semibold text-foreground">
                  {workflow.name}
                </span>
                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                  <Badge
                    variant="secondary"
                    className="font-medium inline-flex items-center justify-center rounded py-1 px-1.5 text-xs"
                  >
                    Trigger: {workflow.trigger?.type || "manual"}
                  </Badge>
                  <Badge
                    variant={workflow.isActive ? "default" : "outline"}
                    className="font-medium inline-flex items-center justify-center rounded py-1 px-1.5 text-xs"
                  >
                    {workflow.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-4 flex shrink-0 items-center gap-2 sm:mt-0">
            <div className="flex items-center gap-2">
              <Switch
                checked={workflow.isActive}
                onCheckedChange={handleToggle}
                disabled={toggling}
              />
              <div className="hidden -space-x-px rounded-lg border sm:flex">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-r-none border-0 h-9 min-w-9 p-2"
                  onClick={() => onEdit(workflow._id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-l-none border-0 h-9 min-w-9 p-2"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(workflow._id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(workflow._id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex min-w-9 sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit(workflow._id)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(workflow._id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{workflow.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await onDelete(workflow._id);
                  setDeleteOpen(false);
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "Failed to delete",
                  );
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
