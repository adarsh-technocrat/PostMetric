"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

interface VisitorsInLast30MinWidgetProps {
  websiteId: string;
  shareId: string;
  mainTextSize?: number;
  primaryColor?: string;
}

function VisitorsInLast30MinShimmer() {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex items-end gap-1" style={{ height: 60 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1" />
        ))}
      </div>
    </div>
  );
}

export function VisitorsInLast30MinWidget({
  websiteId,
  shareId,
  mainTextSize = 24,
  primaryColor = "#f97316",
}: VisitorsInLast30MinWidgetProps) {
  const [visitorsNow, setVisitorsNow] = useState(0);
  const [chartData, setChartData] = useState<
    { date: string; visitors: number }[]
  >([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      fetch(
        `${typeof window !== "undefined" ? window.location.origin : ""}/api/websites/${websiteId}/widget/data?shareId=${encodeURIComponent(shareId)}&type=visitors-last-30-min`,
      )
        .then((r) => r.json())
        .then((res) => {
          if (res.visitorsNow !== undefined) setVisitorsNow(res.visitorsNow);
          if (res.data) setChartData(res.data);
        })
        .catch(() => {});
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [websiteId, shareId]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const displayData =
    chartData.length > 0
      ? chartData
      : Array.from({ length: 6 }, (_, i) => ({
          date: new Date(Date.now() - (5 - i) * 3600000).toISOString(),
          visitors: 0,
        }));
  const maxVisitors = Math.max(...displayData.map((d) => d.visitors), 1);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-lg bg-stone-900 p-5">
        <VisitorsInLast30MinShimmer />
      </div>
    );
  }

  return (
    <div className="flex min-h-[180px] flex-col rounded-lg bg-stone-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 animate-pulse rounded-full"
          style={{ backgroundColor: primaryColor }}
        />
        <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
          Users in last 30 minutes
        </p>
      </div>
      <p
        className="text-3xl font-bold text-white"
        style={{ fontSize: `${mainTextSize}px` }}
      >
        <span style={{ color: primaryColor }}>{visitorsNow}</span>{" "}
        <span className="text-stone-400">
          {visitorsNow === 1 ? "person" : "people"}
        </span>
      </p>
      <div className="mt-4 flex items-end gap-1" style={{ height: 50 }}>
        {displayData.map((d) => (
          <div
            key={d.date}
            className="flex flex-1 flex-col items-center gap-0.5"
          >
            <div
              className="w-full min-h-[4px] rounded-t transition-all"
              style={{
                height: `${Math.max(4, (d.visitors / maxVisitors) * 100)}%`,
                backgroundColor: primaryColor,
                opacity: 0.8,
              }}
            />
            <span className="text-[9px] text-stone-500">
              {format(parseISO(d.date), "HH:mm")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
