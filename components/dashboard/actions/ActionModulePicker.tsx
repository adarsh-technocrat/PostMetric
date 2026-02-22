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
  Globe,
  Webhook,
  MessageSquare,
  Bell,
  Search,
  DollarSign,
  User,
  MousePointer,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionType } from "./ActionNode";

export interface ActionModuleConfig {
  collection?: string;
  operation?: "create" | "update";
  defaultFields?: Record<string, string>;
  webhookProvider?: "stripe" | "lemonsqueezy" | "custom";
  urlSource?: "variable" | "constant";
  openInNewTab?: boolean;
  eventName?: string;
  [key: string]: unknown;
}

export interface ActionModule {
  id: string;
  name: string;
  actionType: ActionType;
  description?: string;
  icon: React.ReactNode;
  defaultConfig?: ActionModuleConfig;
}

const ACTION_MODULES: ActionModule[] = [
  {
    id: "snack-bar",
    name: "Show message",
    actionType: "snack_bar",
    description: "Immediate in-app toast. Use event.params for dynamic text.",
    icon: <MessageSquare className="h-5 w-5 text-violet-600" />,
    defaultConfig: {},
  },
  {
    id: "navigate",
    name: "Navigate to URL",
    actionType: "navigate",
    description: "Redirect after event. Signup→thank you, cart→offer page.",
    icon: <Globe className="h-5 w-5 text-indigo-500" />,
    defaultConfig: {
      urlSource: "constant",
      openInNewTab: false,
    },
  },
  {
    id: "push-notification",
    name: "Push notification",
    actionType: "push_notification",
    description: "Re-engage via browser push. Best for visitors who left.",
    icon: <Bell className="h-5 w-5 text-amber-600" />,
    defaultConfig: {},
  },
  {
    id: "webhook",
    name: "Send to webhook",
    actionType: "backend_call",
    description: "Trigger Zapier, Make, email tools. Event payload included.",
    icon: <Webhook className="h-5 w-5 text-rose-600" />,
    defaultConfig: {
      webhookProvider: "custom",
      defaultFields: {},
    },
  },
  {
    id: "identify-visitor",
    name: "Identify visitor",
    actionType: "backend_call",
    description: "Merge event with profile. Use event.params (email, user_id).",
    icon: <User className="h-5 w-5 text-blue-600" />,
    defaultConfig: {
      collection: "users",
      operation: "create",
      defaultFields: { userId: "", traits: "" },
    },
  },
  {
    id: "track-event",
    name: "Track follow-up event",
    actionType: "backend_call",
    description: "Record attribution. Use after engagement to measure impact.",
    icon: <MousePointer className="h-5 w-5 text-emerald-600" />,
    defaultConfig: {
      collection: "events",
      operation: "create",
      eventName: "workflow_engaged",
      defaultFields: { name: "", value: "" },
    },
  },
  {
    id: "track-revenue",
    name: "Track revenue",
    actionType: "backend_call",
    description: "Attribute payment to visitor when Stripe/LS webhook fires.",
    icon: <DollarSign className="h-5 w-5 text-amber-600" />,
    defaultConfig: {
      collection: "analytics",
      operation: "create",
      webhookProvider: "custom",
      defaultFields: { amount: "", currency: "USD" },
    },
  },
  {
    id: "flow-control",
    name: "Condition",
    actionType: "backend_call",
    description: "Branch by event type, UTM source, or custom params.",
    icon: <GitBranch className="h-5 w-5 text-indigo-600" />,
    defaultConfig: { operation: "create" },
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

  const filteredModules = useMemo(() => {
    if (!search.trim()) return ACTION_MODULES;
    const q = search.toLowerCase();
    return ACTION_MODULES.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q),
    );
  }, [search]);

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
        className="w-[420px] max-h-[420px] p-0 flex flex-col border shadow-lg relative"
      >
        <PopoverArrow
          className="fill-popover stroke-border"
          width={16}
          height={8}
        />
        <div className="px-4 py-3 border-b shrink-0">
          <p className="text-sm font-semibold text-foreground mb-1">
            Add action
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            When your event triggers, these actions engage the visitor
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g. thank you, webhook, push..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-[280px] w-full">
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
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
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
