"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getBillingStatus, openPortal } from "@/store/slices/billingSlice";
import { toast } from "@/lib/toast";

export function ManageBillingButton() {
  const dispatch = useAppDispatch();
  const { canManageBilling, portalLoading } = useAppSelector(
    (state) => state.billing,
  );

  useEffect(() => {
    dispatch(getBillingStatus());
  }, [dispatch]);

  const handleClick = async () => {
    const result = await dispatch(openPortal());
    if (openPortal.rejected.match(result)) {
      toast.error(
        typeof result.payload === "string" ? result.payload : "Failed to open portal",
      );
    }
  };

  if (!canManageBilling) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={portalLoading}
      className="text-sm text-stone-600 hover:text-stone-800 underline"
    >
      {portalLoading ? "Opening…" : "Manage subscription"}
    </button>
  );
}
