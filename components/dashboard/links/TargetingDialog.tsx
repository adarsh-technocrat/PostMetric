"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TargetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TargetingDialog({ open, onOpenChange }: TargetingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 border-0 [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-borderColor/50">
          <DialogTitle className="text-base font-semibold text-textPrimary">
            Targeting
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-5">
          <p className="text-textSecondary text-sm">
            Target specific countries, devices, or referrers. Coming soon.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
