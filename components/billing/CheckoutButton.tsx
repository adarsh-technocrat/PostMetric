"use client";

import { useState } from "react";
import type { PlanId } from "@/lib/billing/plans";
import type { VolumeKey } from "@/lib/billing/pricing-tiers";

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
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingPeriod, volume }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          const returnPath =
            typeof window !== "undefined"
              ? window.location.pathname
              : "/pricing";
          window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}`;
          return;
        }
        throw new Error(data.error || "Checkout failed");
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={ariaLabel}
      {...(dataPostmetricGoal && { "data-postmetric-goal": dataPostmetricGoal })}
      {...(dataPostmetricGoalPlanId && {
        "data-postmetric-goal-plan-id": dataPostmetricGoalPlanId,
      })}
      {...(dataPostmetricGoalPlanName && {
        "data-postmetric-goal-plan-name": dataPostmetricGoalPlanName,
      })}
      className={`${className}${loading ? " cursor-not-allowed opacity-80" : ""}`}
    >
      {loading ? (
        <span className="font-mono uppercase text-xs">Redirecting…</span>
      ) : (
        children
      )}
    </button>
  );
}
