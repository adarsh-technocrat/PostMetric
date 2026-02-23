"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

interface VisitorsTrendWidgetProps {
  websiteId: string;
  shareId: string;
  mainTextSize?: number;
  primaryColor?: string;
}

function VisitorsTrendShimmer() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-end justify-between gap-2">
        {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
          <Skeleton key={i} className="h-16 w-full flex-1" />
        ))}
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function VisitorsTrendWidget({
  websiteId,
  shareId,
  mainTextSize = 16,
  primaryColor = "#e78468",
}: VisitorsTrendWidgetProps) {
  const [data, setData] = useState<{ date: string; visitors: number }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      fetch(
        `${typeof window !== "undefined" ? window.location.origin : ""}/api/websites/${websiteId}/widget/data?shareId=${encodeURIComponent(shareId)}&type=visitors-over-time`,
      )
        .then((r) => r.json())
        .then((res) => {
          if (res.data) setData(res.data);
        })
        .catch(() => {});
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [websiteId, shareId]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const maxVisitors = Math.max(...data.map((d) => d.visitors), 1);
  const totalVisitors = data.reduce((s, d) => s + d.visitors, 0);
  const prevTotal = data.length >= 7 ? data.slice(0, 3).reduce((s, d) => s + d.visitors, 0) : 0;
  const recentTotal = data.length >= 7 ? data.slice(-3).reduce((s, d) => s + d.visitors, 0) : totalVisitors;
  const delta = prevTotal > 0 ? ((recentTotal - prevTotal) / prevTotal) * 100 : 0;

  if (!isLoaded) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-5">
        <VisitorsTrendShimmer />
      </div>
    );
  }

  return (
    <div className="flex min-h-[200px] flex-col justify-between rounded-lg border border-stone-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
            Visitors (7 days)
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: primaryColor }}
          >
            {totalVisitors.toLocaleString()}
          </p>
        </div>
        {data.length >= 6 && (
          <span
            className={`text-sm font-medium ${
              delta >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-4 flex items-end gap-1" style={{ height: 80 }}>
        {data.length > 0 ? (
          data.map((d, i) => (
            <div
              key={d.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${Math.max(8, (d.visitors / maxVisitors) * 100)}%`,
                  backgroundColor: primaryColor,
                  opacity: 0.85,
                }}
              />
              <span className="text-[10px] text-stone-400">
                {format(parseISO(d.date), "EEE")}
              </span>
            </div>
          ))
        ) : (
          <div className="flex w-full items-center justify-center text-sm text-stone-400">
            No data yet
          </div>
        )}
      </div>
    </div>
  );
}
