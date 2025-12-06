"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BillingPage() {
  const [eventsRange, setEventsRange] = useState(9);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const eventsOptions = [
    "10k",
    "100k",
    "200k",
    "500k",
    "1M",
    "2M",
    "5M",
    "7M",
    "10M",
    "10M+",
  ];

  const currentEvents = eventsOptions[eventsRange];
  const eventsValue =
    eventsRange === 9
      ? "10M+"
      : eventsRange === 0
      ? "10k"
      : eventsOptions[eventsRange];

  // Pricing structure based on events range
  // Starter plan: $9/month for 10k, scaling up
  // Growth plan: $19/month for 10k, scaling up
  const getPricing = (eventsRange: number) => {
    const baseStarterMonthly = 9;
    const baseGrowthMonthly = 19;

    // Pricing multipliers based on events range
    const multipliers = [
      1, // 10k - base price
      1.5, // 100k
      2, // 200k
      3, // 500k
      4, // 1M
      5, // 2M
      6, // 5M
      7, // 7M
      8, // 10M
      10, // 10M+
    ];

    const multiplier = multipliers[eventsRange] || 1;
    const starterMonthly = Math.round(baseStarterMonthly * multiplier);
    const growthMonthly = Math.round(baseGrowthMonthly * multiplier);

    return {
      starterMonthly,
      growthMonthly,
      starterYearly: starterMonthly * 10, // 2 months free (10 months)
      growthYearly: growthMonthly * 10, // 2 months free (10 months)
    };
  };

  const pricing = getPricing(eventsRange);
  const starterPrice =
    billingPeriod === "monthly"
      ? pricing.starterMonthly
      : pricing.starterYearly;
  const growthPrice =
    billingPeriod === "monthly" ? pricing.growthMonthly : pricing.growthYearly;

  // Calculate savings for yearly plans
  const starterYearlySavings =
    pricing.starterMonthly * 12 - pricing.starterYearly;
  const growthYearlySavings = pricing.growthMonthly * 12 - pricing.growthYearly;

  const daysLeft = 8; // This would come from props or API

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-20 pt-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="mb-12 space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="size-4"
            >
              <path
                fillRule="evenodd"
                d="M14 8a.75.75 0 0 1-.75.75H4.56l1.22 1.22a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        </section>

        <section>
          <section className="space-y-8">
            {/* Pricing Controls */}
            <div className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-2 md:gap-3">
                  <span className="text-base-secondary shrink-0 cursor-pointer select-none text-xs md:text-sm">
                    10k
                  </span>
                  <div className="relative flex flex-1 items-center">
                    <input
                      min="0"
                      max="9"
                      step="1"
                      className="range h-2 w-full cursor-pointer"
                      id="events-range"
                      type="range"
                      value={eventsRange}
                      onChange={(e) => setEventsRange(Number(e.target.value))}
                      name="events-range"
                    />
                    <div
                      className="pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 transform"
                      style={{
                        left: `clamp(30px, ${((eventsRange / 9) * 100).toFixed(
                          0
                        )}%, calc(100% - 30px))`,
                      }}
                    >
                      <div className="whitespace-nowrap rounded-md bg-neutral px-2 py-1 text-center text-xs text-neutral-content shadow-lg dark:bg-base-content dark:text-base-100">
                        <span className="font-semibold">{eventsValue}</span>{" "}
                        monthly events
                      </div>
                    </div>
                  </div>
                  <span className="text-base-secondary shrink-0 cursor-pointer select-none text-xs md:text-sm">
                    10M+
                  </span>
                </div>
                <div className="relative flex shrink-0 items-center justify-end">
                  <div className="relative grid grid-cols-2 rounded-lg bg-neutral/5 p-1 shadow-inner dark:bg-neutral/50">
                    <button
                      onClick={() => setBillingPeriod("monthly")}
                      className={`flex cursor-pointer select-none items-center justify-center gap-1 truncate rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        billingPeriod === "monthly"
                          ? "bg-base-100 shadow-sm"
                          : "text-base-content/70"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod("yearly")}
                      className={`flex cursor-pointer select-none items-center justify-center gap-1 truncate rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        billingPeriod === "yearly"
                          ? "bg-base-100 shadow-sm"
                          : "text-base-content/70"
                      }`}
                    >
                      Yearly
                    </button>
                    <div className="absolute -top-6 right-0 flex -translate-y-full items-center gap-1.5">
                      <span className="whitespace-nowrap text-xs font-medium text-primary">
                        2 months free
                      </span>
                      <svg
                        className="h-5 w-5 fill-primary opacity-60 md:h-6 md:w-6"
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
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Starter Plan */}
              <div className="rounded-[1.3rem] border border-base-content/5 bg-neutral/5 p-1.5 dark:bg-neutral/50">
                <Card className="custom-card relative flex h-full flex-col p-6 sm:p-8">
                  <div className="flex flex-1 flex-col space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-base-secondary text-sm font-medium uppercase tracking-wider">
                        Starter
                      </h3>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <p className="text-4xl font-extrabold tracking-tight">
                            $0
                          </p>
                          <p className="text-base-secondary text-sm leading-tight">
                            then{" "}
                            <span className="font-semibold text-base-content">
                              ${starterPrice}
                            </span>
                            {billingPeriod === "monthly" ? "/month" : "/year"}{" "}
                            in{" "}
                            <span className="font-semibold text-base-content">
                              {daysLeft}
                            </span>{" "}
                            days
                          </p>
                        </div>
                        {billingPeriod === "yearly" &&
                          starterYearlySavings > 0 && (
                            <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="size-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Save ${starterYearlySavings}
                            </p>
                          )}
                      </div>
                    </div>
                    <ul className="flex-1 space-y-2.5 text-sm">
                      <li className="flex items-start gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-4 shrink-0 text-primary opacity-80"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed">
                          <span className="font-medium text-base-content">
                            {eventsValue}
                          </span>{" "}
                          monthly{" "}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help border-b border-dashed border-base-content/30 transition-colors hover:border-primary">
                                  events
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Events are pageviews, payments, and goals you
                                  track. Counted across all your websites
                                  combined.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-4 shrink-0 text-base-content/60"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed">
                          <span className="font-medium">1</span> website
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-4 shrink-0 text-base-content/60"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed">
                          <span className="font-medium">1</span> team member
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-4 shrink-0 text-base-content/60"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed">
                          <span className="font-medium">3</span> years of data
                          retention
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-4 shrink-0 text-base-content/30"
                        >
                          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                        </svg>
                        <span className="leading-relaxed text-base-content/60">
                          Mentions and link attribution for 𝕏
                        </span>
                      </li>
                    </ul>
                    <div className="mt-auto space-y-2">
                      <Button
                        className="w-full"
                        data-fast-goal="checkout_button_clicked"
                        data-fast-goal-price-id="price_1PjYvqEIeBR5XIjfRwXlMnGp"
                      >
                        Pick Starter plan
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        No charge until your free trial ends in{" "}
                        <span className="font-medium text-foreground">
                          {daysLeft}
                        </span>{" "}
                        days
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Growth Plan */}
              <div className="rounded-[1.3rem] border border-base-content/5 bg-neutral/5 p-1.5 dark:bg-neutral/50">
                <Card className="custom-card relative flex h-full flex-col p-6 sm:p-8">
                  <div className="flex flex-1 flex-col space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-base-secondary text-sm font-medium uppercase tracking-wider">
                        Growth
                      </h3>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <p className="text-4xl font-extrabold tracking-tight">
                            $0
                          </p>
                          <p className="text-base-secondary text-sm leading-tight">
                            then{" "}
                            <span className="font-semibold text-base-content">
                              ${growthPrice}
                            </span>
                            {billingPeriod === "monthly" ? "/month" : "/year"}{" "}
                            in{" "}
                            <span className="font-semibold text-base-content">
                              {daysLeft}
                            </span>{" "}
                            days
                          </p>
                        </div>
                        {billingPeriod === "yearly" &&
                          growthYearlySavings > 0 && (
                            <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="size-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Save ${growthYearlySavings}
                            </p>
                          )}
                      </div>
                    </div>
                    <ul className="flex-1 space-y-2.5 text-sm">
                      <li className="flex items-start gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-4 shrink-0 text-primary opacity-80"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed">
                          <span className="font-medium text-base-content">
                            {eventsValue}
                          </span>{" "}
                          monthly{" "}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help border-b border-dashed border-base-content/30 transition-colors hover:border-primary">
                                  events
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Events are pageviews, payments, and goals you
                                  track. Counted across all your websites
                                  combined.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-4 shrink-0 text-base-content/60"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed">
                          <span className="font-medium">30</span> websites
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-4 shrink-0 text-base-content/60"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed">
                          <span className="font-medium">30</span> team members
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-4 shrink-0 text-base-content/60"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed">
                          <span className="font-medium">5+</span> years of data
                          retention
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="mt-0.5 size-4 shrink-0 text-base-content/60"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help border-b border-dashed border-base-content/30 transition-colors hover:border-primary">
                                  Mentions
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>See who talks about your brand on 𝕏</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>{" "}
                          and{" "}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help border-b border-dashed border-base-content/30 transition-colors hover:border-primary">
                                  link attribution
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Find exact 𝕏 post URLs that brought traffic
                                  and revenue to your site (not just t.co links)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>{" "}
                          for 𝕏
                        </span>
                      </li>
                    </ul>
                    <div className="mt-auto space-y-2">
                      <Button
                        className="w-full"
                        data-fast-goal="checkout_button_clicked"
                        data-fast-goal-price-id="price_1SImzbEIeBR5XIjf7IqKjV6D"
                      >
                        Pick Growth plan
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        No charge until your free trial ends in{" "}
                        <span className="font-medium text-foreground">
                          {daysLeft}
                        </span>{" "}
                        days
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-24 rounded-lg bg-muted/30 py-12" id="faq">
            <div className="mx-auto max-w-2xl px-4">
              <h2 className="mb-8 text-2xl font-bold tracking-tight">FAQ</h2>
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem
                  value="starter-growth"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Starter or Growth?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <ul className="list-inside list-disc space-y-1">
                        <li className="list-item">
                          Starter tier is for 1 website, 1 team member and 3
                          years of data retention. It&apos;s best for solo
                          founders getting started.
                        </li>
                        <li className="list-item">
                          Growth tier is for 30 websites, 30 team members and 5+
                          years of data retention. It also includes advanced
                          features like{" "}
                          <Link
                            href="/docs/twitter-mentions"
                            className="link"
                            target="_blank"
                          >
                            mentions
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/docs/twitter-link-attribution"
                            className="link"
                            target="_blank"
                          >
                            link attribution
                          </Link>{" "}
                          for 𝕏. It&apos;s best for established businesses.
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="events"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    10k, 100k, 1M+ events per month?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <ul className="list-inside list-disc space-y-1">
                        <li className="list-item">
                          If you&apos;re just getting started, start with the
                          10k events per month plan.
                        </li>
                        <li className="list-item">
                          If you already have some traffic (couple hundreds of
                          visitors per day), go for the 100k/200k events per
                          month plan.
                        </li>
                        <li className="list-item">
                          If you have a lot of traffic (1k+ visitors per day),
                          go for 1M+ events per month.
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="more-events"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    What happens if I get more events than my plan?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        No worries! We&apos;ll continue tracking your events,
                        but you&apos;ll need to upgrade to a larger plan to
                        access your dashboard.
                      </p>
                      <p>Congrats on all the traffic btw!</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="free-trial"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Is there a free trial?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        Yep! You can try DataFast for free for 14 days and you
                        don&apos;t even need a credit card!
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="gdpr"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Is DataFast GDPR compliant?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>Yes, DataFast is GDPR compliant.</p>
                      <p>
                        We prioritize data privacy and security, ensuring that
                        all data we collect is processed in accordance with GDPR
                        regulations.
                      </p>
                      <p>
                        As a DataFast user, you&apos;ll need to obtain explicit
                        consent from your website visitors for data collection.
                      </p>
                      <p>
                        You can read more about GDPR compliance in our{" "}
                        <Link className="link" href="/tos">
                          Terms of Service
                        </Link>
                        .
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="make-money"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Do I need to make money to use DataFast?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        Not at all! You can use DataFast to get insights about
                        your traffic.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="need-code"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Do I need to code to use DataFast?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        You don&apos;t need to code to use DataFast! You can set
                        up the web analytics and revenue data in just 2 minutes.
                      </p>
                      <p>
                        And we offer no-code solutions for advanced features
                        like revenue attribution.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="migrate-data"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Can I migrate my existing data?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        Yes! For now, you can import your data from
                        Plausible.io. Next is Google Analytics.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="seo-keywords"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Can I see SEO keywords that drive traffic to my website?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        Yes! You can connect{" "}
                        <Link
                          href="/docs/google-search-console"
                          className="link"
                          target="_blank"
                        >
                          Google Search Console
                        </Link>{" "}
                        to see keywords that drive traffic to your website.
                      </p>
                      <p>
                        With{" "}
                        <Link
                          href="docs/revenue-attribution-guide"
                          className="link"
                          target="_blank"
                        >
                          revenue attribution
                        </Link>{" "}
                        enabled, you can even estimate which keywords drive the
                        most revenue.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="payment-providers"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Which payment providers are supported?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        We offer native integration with Stripe, LemonSqueezy,
                        Polar, and Shopify (and yes, you can connect multiple
                        payment providers).
                        <br />
                        You can also use our{" "}
                        <Link className="link" href="/docs/api-create-payment">
                          Payment API
                        </Link>{" "}
                        to send your payment data to DataFast.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="subdomains"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Does DataFast track across subdomains?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        Yes, DataFast tracks across any subdomains for maximum
                        accuracy.
                      </p>
                      <p>
                        Simply create a DataFast website under your root domain
                        (e.g., example.com) and install the tracking script on
                        any subdomains (e.g., app.example.com, blog.example.com)
                        you want to track.
                      </p>
                      <p>
                        This ensures you get unified analytics across your
                        entire domain ecosystem without any gaps in your data.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="different-domains"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Does DataFast track across different domains?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        Yes! Create a DataFast website under your root domain
                        (e.g., marketing.com) and add the other domains you want
                        to track to the allowed hostnames (e.g., app.com).
                      </p>
                      <p>
                        To get started, check out our{" "}
                        <Link
                          href="/docs/cross-domain-tracking"
                          className="link"
                          target="_blank"
                        >
                          cross-domain tracking documentation
                        </Link>
                        .
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="api"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Does DataFast have an API?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        Yes,{" "}
                        <Link className="link" href="/docs/api-introduction">
                          DataFast has an API.
                        </Link>
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="team"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Can I invite my team to DataFast?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <p>
                        Yes! You can have unlimited team members on DataFast.
                      </p>
                      <p>
                        You can invite your team to DataFast by sharing the link
                        to the dashboard with them.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="affiliate"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    Do you have an affiliate program?
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      Yep! You get 50% commission for every payments (up to 12
                      months). You can{" "}
                      <Link
                        className="link"
                        href="https://datafast.getrewardful.com/signup"
                        target="_blank"
                      >
                        sign-up here
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="another-question"
                  className="rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 text-left font-medium">
                    I have another question
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-2 leading-relaxed text-muted-foreground">
                      <div className="space-y-2 leading-relaxed">
                        Cool, send me{" "}
                        <Link
                          target="_blank"
                          className="link"
                          href="mailto:marc@datafa.st?subject=DataFast%20Question"
                        >
                          an email
                        </Link>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
