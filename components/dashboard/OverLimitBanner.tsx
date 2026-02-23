"use client";

import Link from "next/link";
import { PricingContent } from "@/components/landing/pricing/PricingContent";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";

export function OverLimitBanner() {
  return (
    <div className="fixed inset-0 z-50 bg-stone-50 flex flex-col min-h-screen overflow-y-auto">
      <div className="w-full flex flex-col items-center">
        <Navbar />
        <div className="max-w-4xl w-full border-x border-stone-200 flex flex-col gap-20 lg:gap-30">
          <div className="flex flex-col items-center gap-6 text-center px-4 md:px-6 pt-12 lg:pt-20">
            <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 mb-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D97706"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18"></path>
                <path d="M18 9l-5 5-4-4-3 3"></path>
              </svg>
            </div>

            <div className="flex flex-col gap-3 max-w-lg">
              <h1 className="font-cooper text-4xl lg:text-5xl text-stone-800 leading-tight">
                You&apos;ve exceeded your plan&apos;s{" "}
                <span className="italic text-amber-600">event limit.</span>
              </h1>
              <p className="text-stone-500 text-lg leading-relaxed">
                Upgrade to a larger plan to access your dashboard and continue
                viewing your analytics.
              </p>
            </div>

            <div className="flex gap-4 mt-2">
              <Link
                href="/dashboard/billing"
                className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-indigo-600 bg-indigo-600 text-white px-8 py-3 rounded text-xs hover:bg-indigo-700 transition-all shadow-sm"
              >
                Go to Billing
              </Link>
              <Link
                href="mailto:support@postmetric.io"
                className="cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border border-stone-200 bg-white px-8 py-3 rounded text-xs hover:bg-stone-50 transition-all text-stone-700"
              >
                Contact Support
              </Link>
            </div>
          </div>

          <div className="w-full mt-8">
            <PricingContent showHeader={false} showBillingToggle={true} />
          </div>
        </div>

        <div className="max-w-4xl w-full border-x border-stone-200 flex flex-col">
          <div className="w-full flex flex-col items-center justify-center gap-2 text-center px-4 md:px-6 py-12 lg:py-20">
            <p className="text-stone-400 text-sm">
              Need a custom volume or enterprise plan?
            </p>
            <Link
              href="mailto:support@postmetric.io"
              className="text-indigo-600 font-mono text-xs uppercase hover:underline decoration-1 underline-offset-4 inline-block"
            >
              Contact us →
            </Link>
          </div>
        </div>

        <div className="max-w-4xl w-full border-x border-stone-200">
          <Footer />
        </div>
      </div>
    </div>
  );
}
