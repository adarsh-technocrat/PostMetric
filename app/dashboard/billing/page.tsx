"use client";

import { useState, useEffect } from "react";
import { PricingContent } from "@/components/landing/pricing/PricingContent";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { FAQ } from "@/components/ui/faq";
import { billingFAQItems } from "@/lib/faq-data";

export default function BillingPage() {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setShowSuccess(true);
      window.history.replaceState({}, "", "/dashboard/billing");
      const t = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div className="flex flex-col w-full items-center pb-20">
      {/* Header with Manage Billing */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full max-w-4xl mb-6">
        {showSuccess && (
          <p className="text-sm text-lime-600 font-medium">
            Payment successful. Your subscription is now active.
          </p>
        )}
        <div className={showSuccess ? "" : "sm:ml-auto"}>
          <ManageBillingButton />
        </div>
      </div>

      {/* Pricing - same UI as /pricing */}
      <div className="w-full max-w-4xl mx-auto">
        <PricingContent showHeader={false} showBillingToggle={true} />
      </div>

      {/* FAQ Section */}
      <div className="w-full max-w-4xl mt-12 md:mt-16">
        <FAQ items={billingFAQItems} />
      </div>
    </div>
  );
}
