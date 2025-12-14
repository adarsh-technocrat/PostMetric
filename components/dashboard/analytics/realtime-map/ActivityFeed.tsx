"use client";

import { useMemo } from "react";
import { Eye, CreditCard } from "lucide-react";
import {
  formatTimeAgo,
  generateVisitorName,
  type Visitor,
  type PaymentEvent,
} from "@/utils/realtime-map";

interface ActivityFeedProps {
  visitors: Visitor[];
  paymentEvents: PaymentEvent[];
}

function formatPaymentAmount(amount: number, currency: string = "usd"): string {
  const dollars = amount / 100;
  const currencySymbol = currency.toUpperCase() === "USD" ? "$" : "";
  return `${currencySymbol}${dollars.toFixed(2)}`;
}

export function ActivityFeed({ visitors, paymentEvents }: ActivityFeedProps) {
  const activityItems = useMemo(() => {
    const items: (Visitor | PaymentEvent)[] = [...visitors, ...paymentEvents];
    return items
      .sort((a, b) => {
        const timeA =
          "type" in a && a.type === "payment"
            ? new Date(a.timestamp).getTime()
            : new Date((a as Visitor).lastSeenAt).getTime();
        const timeB =
          "type" in b && b.type === "payment"
            ? new Date(b.timestamp).getTime()
            : new Date((b as Visitor).lastSeenAt).getTime();
        return timeB - timeA;
      })
      .slice(0, 20);
  }, [visitors, paymentEvents]);

  return (
    <div className="absolute bottom-0 left-0 z-10 max-h-[20vh] w-full max-w-full overflow-hidden bg-white/90 py-3 text-gray-700 ring-1 ring-gray-200 backdrop-blur-sm md:bottom-4 md:left-4 md:max-h-[30vh] md:w-96 md:rounded-box shadow-lg">
      <div className="hide-scrollbar max-h-[calc(20vh-40px)] overflow-y-auto md:mt-2 md:max-h-[calc(30vh-40px)]">
        <div className="space-y-1">
          {activityItems.map((item) => {
            // Check if it's a payment event
            if ("type" in item && item.type === "payment") {
              const payment = item as PaymentEvent;
              const customerName = payment.customerEmail
                ? payment.customerEmail.split("@")[0].toUpperCase()
                : payment.visitorId
                ? generateVisitorName(payment.visitorId)
                : "Customer";

              return (
                <div
                  key={payment.id}
                  className="flex items-start gap-1.5 py-1 text-xs animate-opacity cursor-default px-3 duration-100"
                >
                  <div className="mt-0.5 shrink-0">
                    <CreditCard className="h-3.5 w-3.5 text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900">
                      {customerName}
                    </span>
                    <span className="text-gray-600"> made a </span>
                    <span className="font-medium text-success">
                      {formatPaymentAmount(payment.amount, payment.currency)}
                    </span>
                    <span className="text-gray-600"> payment</span>
                    <div className="mt-0 text-[10px] text-gray-500 opacity-60">
                      {formatTimeAgo(payment.timestamp)}
                    </div>
                  </div>
                  <span className="ml-auto mt-0.5 inline-flex size-1.5 rounded-full bg-primary"></span>
                </div>
              );
            }
            const visitor = item as Visitor;
            return (
              <div
                key={visitor.sessionId}
                className="flex items-start gap-1.5 py-1 text-xs cursor-pointer px-3 duration-100 hover:bg-gray-100"
              >
                <div className="mt-0.5 shrink-0">
                  <Eye className="h-3.5 w-3.5 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900">
                    {generateVisitorName(visitor.visitorId, visitor.userId)}
                  </span>
                  <span className="text-gray-600"> from </span>
                  <span className="inline-flex items-baseline gap-1 truncate font-medium text-gray-900">
                    <div className="inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm h-[10px] w-[15px]">
                      <img
                        src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${visitor.country}.svg`}
                        alt={`${visitor.country} flag`}
                        className="h-full w-full saturate-[0.9]"
                        loading="lazy"
                      />
                    </div>
                    <span className="font-medium text-gray-900">
                      {visitor.country}
                    </span>
                  </span>
                  <span className="text-gray-600"> visited </span>
                  <span
                    className="-mx-1 -my-0.5 ml-0 rounded bg-gray-100 px-1 py-0.5 font-mono text-[11px]! font-medium text-gray-900"
                    title={`Path: ${visitor.currentPath || "/"} | Session: ${
                      visitor.sessionId
                    }`}
                  >
                    {visitor.currentPath || "/"}
                  </span>
                  <div className="mt-0 text-[10px] text-gray-500">
                    {formatTimeAgo(visitor.lastSeenAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
