"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Upload, Sparkles, Crown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const TITLE_MAX = 120;
const DESCRIPTION_MAX = 240;

export interface LinkPreviewValues {
  title: string;
  description: string;
  imageUrl: string;
}

interface LinkPreviewEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: LinkPreviewValues;
  onSave: (values: LinkPreviewValues) => void;
  defaultValues?: LinkPreviewValues;
}

export function LinkPreviewEditDialog({
  open,
  onOpenChange,
  values,
  onSave,
  defaultValues,
}: LinkPreviewEditDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [localValues, setLocalValues] = useState<LinkPreviewValues>(values);

  useEffect(() => {
    if (open) {
      setLocalValues(values);
    }
  }, [open, values]);

  const titleCount = localValues.title.length;
  const descCount = localValues.description.length;
  const hasChanges =
    localValues.title !== values.title ||
    localValues.description !== values.description ||
    localValues.imageUrl !== values.imageUrl;

  const handleReset = () => {
    const resetTo = defaultValues ?? {
      title: "",
      description: "",
      imageUrl: "",
    };
    setLocalValues(resetTo);
  };

  const handleSave = () => {
    setSaving(true);
    onSave(localValues);
    setSaving(false);
    onOpenChange(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalValues((v) => ({ ...v, imageUrl: url }));
    }
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 border-0 shadow-xl rounded-xl overflow-hidden bg-white [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10">
        <DialogHeader className="px-5 pt-5 pb-3 border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-semibold text-textPrimary">
                Link Preview
              </DialogTitle>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 font-medium bg-stone-100 text-stone-600 border-0"
              >
                <Crown className="h-3 w-3 mr-0.5" />
                PRO
              </Badge>
            </div>
            <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center text-textSecondary text-sm font-medium">
              L
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Image section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-textPrimary">
                Image
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="text-xs text-textSecondary hover:text-textPrimary"
                  onClick={() =>
                    setLocalValues((v) => ({ ...v, imageUrl: "" }))
                  }
                >
                  Remove
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-md text-textSecondary hover:text-textPrimary hover:bg-muted/50"
                  title="Refresh"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  className="p-1.5 rounded-md text-textSecondary hover:text-textPrimary hover:bg-muted/50"
                  title="Upload"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="aspect-video w-full rounded-lg bg-muted/30 overflow-hidden flex items-center justify-center min-h-[120px]">
              {localValues.imageUrl ? (
                <img
                  src={localValues.imageUrl}
                  alt="Preview"
                  width={640}
                  height={360}
                  className="w-full h-full object-cover"
                  onError={() =>
                    setLocalValues((v) => ({ ...v, imageUrl: "" }))
                  }
                />
              ) : (
                <div className="size-16 rounded-full bg-textSecondary/20 flex items-center justify-center">
                  <Globe className="h-8 w-8 text-textSecondary/60" />
                </div>
              )}
            </div>
            <input
              type="url"
              placeholder="Image URL"
              value={localValues.imageUrl}
              onChange={(e) =>
                setLocalValues((v) => ({ ...v, imageUrl: e.target.value }))
              }
              className={cn(
                "w-full rounded-lg bg-muted/30 px-3 py-2 text-sm text-textPrimary",
                "placeholder:text-textSecondary/60",
                "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-1",
                "border-0 mt-1.5",
              )}
            />
          </div>

          {/* Title section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-textPrimary">
                Title
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-textSecondary">
                  {titleCount}/{TITLE_MAX}
                </span>
                <Sparkles className="h-3.5 w-3.5 text-textSecondary" />
              </div>
            </div>
            <input
              type="text"
              value={localValues.title}
              onChange={(e) =>
                setLocalValues((v) => ({
                  ...v,
                  title: e.target.value.slice(0, TITLE_MAX),
                }))
              }
              placeholder="Add a title..."
              maxLength={TITLE_MAX}
              className={cn(
                "w-full rounded-lg bg-muted/30 px-3 py-2.5 text-sm text-textPrimary",
                "placeholder:text-textSecondary/60",
                "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-1",
                "border-0",
              )}
            />
          </div>

          {/* Description section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-textPrimary">
                Description
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-textSecondary">
                  {descCount}/{DESCRIPTION_MAX}
                </span>
                <Sparkles className="h-3.5 w-3.5 text-textSecondary" />
              </div>
            </div>
            <textarea
              value={localValues.description}
              onChange={(e) =>
                setLocalValues((v) => ({
                  ...v,
                  description: e.target.value.slice(0, DESCRIPTION_MAX),
                }))
              }
              placeholder="Add a description..."
              maxLength={DESCRIPTION_MAX}
              rows={3}
              className={cn(
                "w-full rounded-lg bg-muted/30 px-3 py-2.5 text-sm text-textSecondary resize-y",
                "placeholder:text-textSecondary/60",
                "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-1",
                "border-0",
              )}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-4 px-5 py-4 border-t border-borderColor/50">
          <button
            type="button"
            className="text-sm text-textSecondary hover:text-textPrimary"
            onClick={handleReset}
          >
            Reset to default
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-borderColor"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="stone"
              size="sm"
              className="min-w-[100px]"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
