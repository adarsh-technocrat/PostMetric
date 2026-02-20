"use client";

import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import {
  getPriceForVolume,
  getTierByVolume,
} from "@/lib/billing/pricing-tiers";
import type { VolumeKey } from "@/lib/billing/pricing-tiers";
import { VolumeSelector } from "@/components/billing/VolumeSelector";

interface PricingContentProps {
  showHeader?: boolean;
  showBillingToggle?: boolean;
}

export function PricingContent({
  showHeader = true,
  showBillingToggle = true,
}: PricingContentProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [selectedVolume, setSelectedVolume] = useState<VolumeKey>("10K");

  const tier = getTierByVolume(selectedVolume);
  const starterPrice = getPriceForVolume(
    selectedVolume,
    "starter",
    billingPeriod,
  );
  const growthPrice = getPriceForVolume(selectedVolume, "pro", billingPeriod);
  const starterMonthly = tier.starterMonthly;
  const growthMonthly = tier.growthMonthly;
  const starterYearly = starterMonthly * 10;
  const growthYearly = growthMonthly * 10;
  const starterYearlySavings = starterMonthly * 12 - starterYearly;
  const growthYearlySavings = growthMonthly * 12 - growthYearly;

  const plans = [
    {
      id: "starter" as const,
      name: "Starter",
      price: starterPrice,
      monthlyPrice: starterMonthly,
      yearlySavings: starterYearlySavings,
      eventLimit: tier.label,
      features: [
        { text: tier.label, included: true },
        { text: "1 website", included: true },
        { text: "1 team member", included: true },
        { text: "3 years of data retention", included: true },
        { text: "Mentions and link attribution for 𝕏", included: false },
      ],
      buttonText: "Get Started",
      isPopular: false,
    },
    {
      id: "pro" as const,
      name: "Growth",
      price: growthPrice,
      monthlyPrice: growthMonthly,
      yearlySavings: growthYearlySavings,
      eventLimit: tier.label,
      features: [
        { text: tier.label, included: true },
        { text: "30 websites", included: true },
        { text: "30 team members", included: true },
        { text: "5+ years of data retention", included: true },
        { text: "Mentions and link attribution for 𝕏", included: true },
      ],
      buttonText: "Get Started",
      isPopular: true,
    },
  ];

  return (
    <div className="flex flex-col w-full items-center bg-stone-50 min-h-full">
      {showHeader && (
        <div className="flex flex-col w-full max-w-4xl md:border-x border-stone-200">
          <div className="py-6 px-4 lg:px-20 lg:py-20 flex flex-col gap-6 items-center lg:pb-12">
            <div className="flex flex-col gap-3 items-center">
              <h1 className="font-cooper text-[28px] lg:text-[40px] leading-8 lg:leading-tight text-center text-balance text-stone-800">
                Simple, transparent pricing
              </h1>
              <h2 className="text-center text-balance lg:whitespace-pre-line whitespace-normal leading-6 text-stone-500 text-base lg:text-lg max-w-md">
                Pay only for what you use. No hidden fees, no surprises.
                <br className="md:block hidden" />
                Start free and scale as you grow.
              </h2>
            </div>
          </div>
        </div>
      )}
      <div className="w-full border-b border-stone-200" />
      <div className="flex flex-col w-full max-w-4xl md:border-x border-stone-200">
        <div className="flex flex-col items-center w-full">
          <div className="flex flex-col w-full md:px-0 md:py-6 py-4 px-4 bg-stone-100 gap-4">
            <div className="flex flex-col items-center gap-1">
              <p className="text-stone-800 font-medium text-sm">
                How many events do you plan to track per month?
              </p>
            </div>
            <VolumeSelector
              value={selectedVolume}
              onChange={setSelectedVolume}
              hideLabel
            />
          </div>

          {showBillingToggle && (
            <div className="flex items-center justify-center w-full px-4 md:px-6 py-4">
              <div
                role="group"
                aria-label="Billing period"
                className="relative inline-flex items-center rounded border border-stone-200 bg-stone-50 p-1"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setBillingPeriod("monthly")}
                  aria-pressed={billingPeriod === "monthly"}
                  aria-label="Billing period: Monthly"
                  className={`px-4 py-2 text-xs font-medium font-mono uppercase transition-all rounded h-auto cursor-pointer ${
                    billingPeriod === "monthly"
                      ? "bg-white text-stone-800"
                      : "text-stone-500"
                  }`}
                >
                  Monthly
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setBillingPeriod("yearly")}
                  aria-pressed={billingPeriod === "yearly"}
                  aria-label="Billing period: Yearly"
                  className={`px-4 py-2 text-xs font-medium font-mono uppercase transition-all rounded h-auto cursor-pointer ${
                    billingPeriod === "yearly"
                      ? "bg-white text-stone-800"
                      : "text-stone-500"
                  }`}
                >
                  Yearly
                </Button>
                {billingPeriod === "yearly" && (
                  <div className="absolute -top-8 right-0 flex items-center gap-1.5">
                    <span className="whitespace-nowrap text-xs font-medium text-stone-600">
                      2 months free
                    </span>
                    <svg
                      className="h-5 w-5 fill-stone-600 opacity-60"
                      style={{ transform: "rotate(32deg) scaleX(-1)" }}
                      viewBox="0 0 219 41"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_3_248)">
                        <path d="M21.489 29.4305C36.9333 31.3498 51.3198 33.0559 65.7063 34.9753C66.7641 35.1885 67.6104 36.4681 69.9376 38.3875C63.1675 39.2406 57.8783 40.3069 52.5892 40.5201C38.6259 40.9467 24.8741 40.9467 10.9107 40.9467C9.21821 40.9467 7.5257 41.1599 5.83317 40.7334C0.332466 39.6671 -1.57164 36.0416 1.39028 31.1365C2.87124 28.7906 4.56377 26.658 6.46786 24.7386C13.6611 17.4876 21.0659 10.4499 28.4707 3.41224C29.7401 2.13265 31.6442 1.49285 34.183 0C34.6061 10.8765 23.8162 13.8622 21.489 22.3927C23.3931 21.9662 25.0856 21.7529 26.5666 21.3264C83.6894 5.54486 140.601 7.25099 197.3 22.606C203.224 24.0988 208.936 26.4447 214.649 28.5773C217.61 29.6437 220.149 31.9896 218.457 35.6151C216.976 39.2406 214.014 39.2406 210.629 37.7477C172.759 20.6866 132.561 18.7672 91.9404 19.407C70.7838 19.6203 50.0504 21.9662 29.5285 26.8713C26.9897 27.5111 24.4509 28.3641 21.489 29.4305Z" />
                      </g>
                      <defs>
                        <clipPath id="clip0_3_248">
                          <rect width="219" height="41" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col w-full items-center">
            <div className="grid grid-cols-1 md:grid-cols-2 max-w-full w-full border-t border-stone-200">
              {plans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`flex flex-col w-full ${
                    index === 0
                      ? "md:border-r border-stone-200"
                      : "border-none border-stone-200"
                  }`}
                >
                  <div className="px-4 md:px-6 py-3 flex items-center justify-between bg-stone-0 border-b border-stone-200">
                    <p className="text-stone-800 font-semibold text-sm font-mono uppercase">
                      {plan.name}
                      <br className="sm:hidden" />
                    </p>
                  </div>
                  <div className="flex md:flex-row flex-col gap-2 md:items-center py-5 bg-stone-0 md:py-10 px-4 md:px-6">
                    <p className="font-light text-[40px] font-mono text-stone-800">
                      <NumberFlow
                        value={plan.price}
                        format={{
                          style: "currency",
                          currency: "USD",
                          currencyDisplay: "narrowSymbol",
                          maximumFractionDigits: 0,
                        }}
                      />
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-stone-800 font-semibold text-sm font-mono uppercase">
                        per month
                      </p>
                      <p className="text-stone-800 font-normal text-xs">
                        <span className="hidden md:inline">
                          {plan.eventLimit}
                        </span>
                        <br className="md:hidden" />
                        <span className="md:hidden">{plan.eventLimit}</span>
                      </p>
                    </div>
                  </div>
                  <div className="w-full">
                    <CheckoutButton
                      planId={plan.id}
                      billingPeriod={billingPeriod}
                      volume={selectedVolume}
                      aria-label={`Get started with ${plan.name} plan`}
                      data-postmetric-goal="pricing_checkout"
                      data-postmetric-goal-plan-id={plan.id}
                      data-postmetric-goal-plan-name={plan.name}
                      className={`w-full md:px-6 group px-4 py-3 h-11 flex items-center justify-center font-semibold transition-all cursor-pointer ${
                        plan.isPopular
                          ? "text-white bg-[#625fff] hover:opacity-90"
                          : "bg-stone-800 hover:bg-stone-900 text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono uppercase text-xs text-white">
                          {plan.buttonText}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-white"
                        >
                          <path
                            d="M6 12L10 8L6 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </CheckoutButton>
                  </div>
                  <div className="flex flex-col gap-3 py-6 px-4 md:px-6 border-t border-stone-200">
                    {index === 1 ? (
                      <p className="text-lime-600 font-semibold text-sm">
                        Everything in Starter, plus:
                      </p>
                    ) : (
                      <p className="text-stone-800 font-semibold text-sm">
                        What's included:
                      </p>
                    )}
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-2"
                      >
                        <span
                          className={
                            feature.included
                              ? "text-brand-500"
                              : "text-stone-200"
                          }
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.6667 5L7.50004 14.1667L3.33337 10"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <p
                          className={
                            feature.included
                              ? "text-stone-800 font-normal text-sm"
                              : "text-stone-500 font-normal text-sm"
                          }
                        >
                          {feature.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full border-b border-stone-200" />
    </div>
  );
}
