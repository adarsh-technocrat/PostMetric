"use client";

import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { Slider } from "@/components/ui/slider";

const COMMISSION_PERCENT = 60;
const AVG_MONTHLY_PRICE = 25; // conservative avg across plans
const EARNINGS_PER_REFERRAL = (AVG_MONTHLY_PRICE * COMMISSION_PERCENT) / 100;

export function AffiliateEarningsCalculator() {
  const [referrals, setReferrals] = useState(10);

  const monthlyEarnings = Math.round(referrals * EARNINGS_PER_REFERRAL);

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2 min-w-[200px] overflow-hidden"
        aria-hidden
      >
        <svg
          className="absolute right-0 top-1/2 h-[120%] w-full -translate-y-1/2 blur-[2px]"
          viewBox="0 0 400 200"
          fill="none"
          preserveAspectRatio="xMaxYMid slice"
        >
          <defs>
            <linearGradient
              id="affiliate-chart-gradient"
              x1="0%"
              y1="100%"
              x2="100%"
              y2="0%"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#292524" stopOpacity="0" />
              <stop offset="30%" stopColor="#292524" stopOpacity="0.04" />
              <stop offset="70%" stopColor="#292524" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#292524" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <path
            d="M0 180 Q80 150 160 120 T320 40 T400 10 L400 200 L0 200 Z"
            fill="url(#affiliate-chart-gradient)"
          />
          <path
            d="M0 180 Q80 150 160 120 T320 40 T400 10"
            stroke="#292524"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.15"
          />
        </svg>
      </div>

      <div className="relative z-10 space-y-6 w-full">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="font-cooper text-2xl lg:text-3xl text-stone-900">
            Earnings calculator
          </h2>
          <p className="text-base text-stone-500">
            See how much you could earn by referring customers to our program.
          </p>
        </div>

        <div className="flex flex-col gap-6 w-full mt-6">
          <div className="relative flex flex-col pt-2">
            <span className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2">
              You can earn
            </span>
            <div className="flex items-baseline">
              <NumberFlow
                value={monthlyEarnings}
                format={{
                  style: "currency",
                  currency: "USD",
                  currencyDisplay: "narrowSymbol",
                  maximumFractionDigits: 0,
                }}
                className="text-6xl md:text-[80px] font-medium leading-none tracking-tight text-stone-800"
              />
              <span className="text-xl md:text-2xl font-semibold text-stone-400 ml-2">
                / mo
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden mt-6">
            <div className="relative z-10 flex flex-col gap-6">
              <p className="text-base font-medium text-stone-600 flex items-center gap-1.5">
                <NumberFlow
                  value={referrals}
                  className="font-semibold text-stone-900 text-lg"
                />{" "}
                customer sales
              </p>
              <Slider
                id="earnings-slider"
                min={1}
                max={50}
                step={1}
                value={[referrals]}
                onValueChange={([v]) => setReferrals(v ?? 1)}
                className="w-full cursor-grab active:cursor-grabbing"
              />
              <div className="flex items-center gap-2 text-stone-500">
                <svg
                  height="18"
                  width="18"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4 shrink-0"
                >
                  <g fill="currentColor">
                    <path
                      d="M14.75,3.75v12.5l-2.75-1.5-3,1.5-3-1.5-2.75,1.5V3.75c0-1.105,.895-2,2-2h7.5c1.105,0,2,.895,2,2Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    ></path>
                    <path
                      d="M10.724,6.556c-.374-.885-1.122-1.086-1.688-1.086-.526,0-1.907,.28-1.779,1.606,.09,.931,.967,1.277,1.734,1.414s1.88,.429,1.907,1.551c.023,.949-.83,1.597-1.861,1.597-.985,0-1.67-.383-1.934-1.25"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    ></path>
                    <line
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      x1="9"
                      x2="9"
                      y1="4.75"
                      y2="5.47"
                    ></line>
                    <line
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      x1="9"
                      x2="9"
                      y1="11.638"
                      y2="12.25"
                    ></line>
                  </g>
                </svg>
                <p className="text-sm font-medium">
                  Earn {COMMISSION_PERCENT}% per sale for 24 months
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
