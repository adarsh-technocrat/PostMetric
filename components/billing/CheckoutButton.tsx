"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createCheckout } from "@/store/slices/billingSlice";
import type { PlanId } from "@/lib/billing/plans";
import type { VolumeKey } from "@/lib/billing/pricing-tiers";
import { toast } from "@/lib/toast";

interface CheckoutButtonProps {
  planId: PlanId;
  billingPeriod: "monthly" | "yearly";
  volume?: VolumeKey;
  className?: string;
  "aria-label"?: string;
  "data-postmetric-goal"?: string;
  "data-postmetric-goal-plan-id"?: string;
  "data-postmetric-goal-plan-name"?: string;
  children: React.ReactNode;
}

export function CheckoutButton({
  planId,
  billingPeriod,
  volume = "10K",
  className,
  "aria-label": ariaLabel,
  "data-postmetric-goal": dataPostmetricGoal,
  "data-postmetric-goal-plan-id": dataPostmetricGoalPlanId,
  "data-postmetric-goal-plan-name": dataPostmetricGoalPlanName,
  children,
}: CheckoutButtonProps) {
  const dispatch = useAppDispatch();
  const { checkoutLoading } = useAppSelector((state) => state.billing);

  const handleClick = async () => {
    const result = await dispatch(
      createCheckout({ planId, billingPeriod, volume }),
    );
    if (createCheckout.rejected.match(result)) {
      const msg =
        typeof result.payload === "string" ? result.payload : "Checkout failed";
      toast.error(msg);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={checkoutLoading}
      aria-label={ariaLabel}
      {...(dataPostmetricGoal && {
        "data-postmetric-goal": dataPostmetricGoal,
      })}
      {...(dataPostmetricGoalPlanId && {
        "data-postmetric-goal-plan-id": dataPostmetricGoalPlanId,
      })}
      {...(dataPostmetricGoalPlanName && {
        "data-postmetric-goal-plan-name": dataPostmetricGoalPlanName,
      })}
      className={`${className}${checkoutLoading ? " cursor-not-allowed opacity-80" : ""}`}
    >
      {checkoutLoading ? (
        <span className="font-mono uppercase text-xs">Redirecting…</span>
      ) : (
        children
      )}
    </button>
  );
}
