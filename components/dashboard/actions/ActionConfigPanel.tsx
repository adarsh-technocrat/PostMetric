"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActionNodeData } from "./ActionNode";

interface ActionConfigPanelProps {
  nodeData: ActionNodeData | null;
  onClose: () => void;
  onUpdate?: (data: Partial<ActionNodeData>) => void;
}

const ACTION_TYPES = [
  { value: "backend_call", label: "Backend Call Create Record" },
  { value: "backend_call_update", label: "Backend Call Update Record" },
  { value: "navigate", label: "Navigate" },
  { value: "push_notification", label: "Trigger Push Notification" },
  { value: "snack_bar", label: "Show Snack Bar" },
];

const COLLECTIONS = ["users", "candidates", "events", "analytics"];

export function ActionConfigPanel({
  nodeData,
  onClose,
}: ActionConfigPanelProps) {
  if (!nodeData) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <p className="text-sm">Select an action node to configure it.</p>
      </div>
    );
  }

  const config = (nodeData.config || {}) as Record<string, unknown>;
  const defaultCollection = (config.collection as string) || "users";
  const isTrackEvent = nodeData.moduleId === "track-event";
  const isTrackRevenue = nodeData.moduleId === "track-revenue";
  const isWebhook = nodeData.moduleId === "webhook";
  const isNavigate = nodeData.actionType === "navigate";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">
          Action {nodeData.actionNumber} - {nodeData.label}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>Action Type</Label>
            <Select defaultValue={nodeData.actionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {nodeData.actionType === "backend_call" && (
            <>
              <div className="space-y-2">
                <Label>Collection</Label>
                <Select defaultValue={defaultCollection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLECTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isTrackEvent && (
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input
                    placeholder="e.g. goal_completed, signup, purchase"
                    defaultValue={
                      (config.eventName as string) || "goal_completed"
                    }
                  />
                </div>
              )}

              {(isTrackRevenue || isWebhook) && (
                <div className="space-y-2">
                  <Label>Webhook Provider</Label>
                  <Select
                    defaultValue={
                      (config.webhookProvider as string) || "custom"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="lemonsqueezy">LemonSqueezy</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm">Set Fields</Label>
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Field:{" "}
                      {isTrackEvent
                        ? "value"
                        : isTrackRevenue
                          ? "amount"
                          : "userName"}
                    </Label>
                    <Select defaultValue="variable">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="variable">From Variable</SelectItem>
                        <SelectItem value="constant">Constant</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Default value..." className="mt-2" />
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    + Add Field
                  </Button>
                </div>
              </div>
            </>
          )}

          {isNavigate && (
            <>
              <div className="space-y-2">
                <Label>URL Source</Label>
                <Select
                  defaultValue={(config.urlSource as string) || "constant"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="variable">From Variable</SelectItem>
                    <SelectItem value="constant">Constant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Open in new tab</Label>
                <Switch
                  defaultChecked={(config.openInNewTab as boolean) ?? false}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Output Variable Name</Label>
            <Input placeholder="e.g. userValue" defaultValue="userValue" />
          </div>

          <div className="flex items-center justify-between">
            <Label>Block Subsequent Actions</Label>
            <Switch defaultChecked />
          </div>
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <Button className="w-full" variant="default" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
