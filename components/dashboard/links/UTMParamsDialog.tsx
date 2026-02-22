"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const UTM_FIELDS = [
  {
    key: "utm_source",
    label: "Source",
    placeholder: "e.g. google, newsletter",
  },
  {
    key: "utm_medium",
    label: "Medium",
    placeholder: "e.g. cpc, email, social",
  },
  { key: "utm_campaign", label: "Campaign", placeholder: "e.g. summer_sale" },
  { key: "utm_term", label: "Term", placeholder: "e.g. keyword" },
  { key: "utm_content", label: "Content", placeholder: "e.g. ad_variant_a" },
] as const;

interface UTMParamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  utmParams: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
}

export function UTMParamsDialog({
  open,
  onOpenChange,
  utmParams,
  onUpdate,
}: UTMParamsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl p-0 gap-0 border-0 [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-borderColor/50">
          <DialogTitle className="text-base font-semibold text-textPrimary">
            UTM Parameters
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {UTM_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label
                  htmlFor={key}
                  className="text-sm font-medium text-textPrimary"
                >
                  {label}
                </Label>
                <Input
                  id={key}
                  placeholder={placeholder}
                  value={utmParams[key] || ""}
                  onChange={(e) => onUpdate(key, e.target.value)}
                  className="font-mono text-sm lowercase"
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
