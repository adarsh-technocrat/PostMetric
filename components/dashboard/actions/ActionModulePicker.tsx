"use client";

import { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  Wrench,
  TrendingUp,
  Sparkles,
  GitBranch,
  Globe,
  Webhook,
  MessageSquare,
  Bell,
  Layout,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionType } from "./ActionNode";

export interface ActionModule {
  id: string;
  name: string;
  actionType: ActionType;
  description?: string;
  category: "all" | "featured" | "builtin" | "productivity" | "ai";
  icon: React.ReactNode;
}

const MODULE_CATEGORIES = [
  { id: "all", label: "All apps", icon: Layout },
  { id: "featured", label: "Featured", icon: Star },
  { id: "builtin", label: "Built-in tools", icon: Wrench },
  { id: "productivity", label: "Productivity", icon: TrendingUp },
  { id: "ai", label: "AI", icon: Sparkles },
] as const;

const ACTION_MODULES: ActionModule[] = [
  {
    id: "flow-control",
    name: "Flow Control",
    actionType: "backend_call",
    category: "builtin",
    icon: <GitBranch className="h-5 w-5 text-emerald-600" />,
  },
  {
    id: "backend-call",
    name: "Backend API",
    actionType: "backend_call",
    description: "Create or update records via API",
    category: "productivity",
    icon: <Globe className="h-5 w-5 text-blue-600" />,
  },
  {
    id: "webhooks",
    name: "Webhooks",
    actionType: "backend_call",
    description: "Receive HTTP webhooks",
    category: "builtin",
    icon: <Webhook className="h-5 w-5 text-rose-600" />,
  },
  {
    id: "navigate",
    name: "Navigate",
    actionType: "navigate",
    description: "Redirect or open URL",
    category: "builtin",
    icon: <Globe className="h-5 w-5 text-indigo-600" />,
  },
  {
    id: "push-notification",
    name: "Push Notification",
    actionType: "push_notification",
    description: "Trigger push notification",
    category: "productivity",
    icon: <Bell className="h-5 w-5 text-amber-600" />,
  },
  {
    id: "snack-bar",
    name: "Snack Bar",
    actionType: "snack_bar",
    description: "Show in-app message",
    category: "builtin",
    icon: <MessageSquare className="h-5 w-5 text-violet-600" />,
  },
];

interface ActionModulePickerProps {
  onSelect: (module: ActionModule) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  anchorRect?: DOMRect | null;
}

export function ActionModulePicker({
  onSelect,
  children,
  open,
  onOpenChange,
  anchorRect,
}: ActionModulePickerProps) {
  const isTriggerMode = children != null;
  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<(typeof MODULE_CATEGORIES)[number]["id"]>("all");

  const filteredModules = useMemo(() => {
    const byCategory =
      category === "all"
        ? ACTION_MODULES
        : ACTION_MODULES.filter((m) => m.category === category);
    const bySearch = search.trim()
      ? byCategory.filter(
          (m) =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.description?.toLowerCase().includes(search.toLowerCase()),
        )
      : byCategory;
    return bySearch;
  }, [search, category]);

  const handleSelect = (module: ActionModule) => {
    onSelect(module);
    onOpenChange?.(false);
    setSearch("");
  };

  const anchorStyle =
    !isTriggerMode && anchorRect
      ? {
          left: anchorRect.right,
          top: anchorRect.top + anchorRect.height / 2,
        }
      : !isTriggerMode && open
        ? {
            left: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
            top: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
          }
        : undefined;

  return (
    <Popover {...(isTriggerMode ? {} : { open, onOpenChange })}>
      {isTriggerMode ? (
        <PopoverTrigger asChild>{children}</PopoverTrigger>
      ) : (
        <PopoverAnchor asChild>
          <div className="fixed w-0 h-0" style={anchorStyle} />
        </PopoverAnchor>
      )}
      <PopoverContent
        align="center"
        side="right"
        sideOffset={12}
        className="w-[380px] max-h-[420px] p-0 flex flex-col border shadow-lg relative"
      >
        <PopoverArrow
          className="fill-popover stroke-border"
          width={16}
          height={8}
        />
        <div className="px-4 py-3 border-b shrink-0">
          <p className="text-sm font-semibold text-foreground mb-2">
            Search apps or modules
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search apps or modules"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <ScrollArea className="flex-1 max-h-[280px]">
            <div className="p-2 space-y-0.5">
              {filteredModules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => handleSelect(module)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left",
                    "hover:bg-muted/80 transition-colors",
                  )}
                >
                  <span className="flex shrink-0 size-8 items-center justify-center rounded-md bg-muted/50">
                    {module.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {module.name}
                    </p>
                    {module.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {module.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
              {filteredModules.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No modules found
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="shrink-0 w-28 border-l bg-muted/30 py-2 flex flex-col gap-0.5">
            {MODULE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors",
                  category === cat.id
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <cat.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="shrink-0 px-3 py-2 border-t">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Share feedback
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
