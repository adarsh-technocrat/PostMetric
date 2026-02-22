"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  onPasswordChange: (value: string) => void;
}

export function PasswordDialog({
  open,
  onOpenChange,
  password,
  onPasswordChange,
}: PasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 border-0 [&>button]:absolute [&>button]:right-4 [&>button]:top-4 [&>button]:z-10">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-borderColor/50">
          <DialogTitle className="text-base font-semibold text-textPrimary">
            Password protection
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="link-password"
              className="text-sm font-medium text-textPrimary"
            >
              Password
            </Label>
            <Input
              id="link-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
