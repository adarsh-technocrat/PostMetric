"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NewLinkForm } from "./NewLinkForm";

interface CreateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
  defaultBaseUrl: string;
  onLinkCreated?: () => void;
  initialValues?: {
    baseUrl?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

export function CreateLinkDialog({
  open,
  onOpenChange,
  websiteId,
  defaultBaseUrl,
  onLinkCreated,
  initialValues,
}: CreateLinkDialogProps) {
  const handleLinkCreated = () => {
    onLinkCreated?.();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-noise-bg flex flex-col max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0 border-0 [&>button]:absolute [&>button]:right-5 [&>button]:top-5 [&>button]:z-10">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold text-textPrimary">
            Create link
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <NewLinkForm
            websiteId={websiteId}
            defaultBaseUrl={defaultBaseUrl}
            onLinkCreated={handleLinkCreated}
            initialValues={initialValues}
            onClose={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
