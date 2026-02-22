"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExpirationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expirationDate: string;
  onExpirationChange: (value: string) => void;
}

export function ExpirationDialog({
  open,
  onOpenChange,
  expirationDate,
  onExpirationChange,
}: ExpirationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 border-0 [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-borderColor/50">
          <DialogTitle className="text-base font-semibold text-textPrimary">
            Link expiration
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="link-expiration"
              className="text-sm font-medium text-textPrimary"
            >
              Expiration date & time
            </Label>
            <Input
              id="link-expiration"
              type="datetime-local"
              value={expirationDate}
              onChange={(e) => onExpirationChange(e.target.value)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
