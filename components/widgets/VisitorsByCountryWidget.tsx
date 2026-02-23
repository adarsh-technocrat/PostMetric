"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface VisitorsByCountryWidgetProps {
  websiteId: string;
  shareId: string;
  primaryColor?: string;
}

interface CountryData {
  country: string;
  flag?: string;
  visitors: number;
}

function VisitorsByCountryShimmer() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

export function VisitorsByCountryWidget({
  websiteId,
  shareId,
  primaryColor = "#e78468",
}: VisitorsByCountryWidgetProps) {
  const [data, setData] = useState<CountryData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      fetch(
        `${typeof window !== "undefined" ? window.location.origin : ""}/api/websites/${websiteId}/widget/data?shareId=${encodeURIComponent(shareId)}&type=visitors-by-country`,
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

  if (!isLoaded) {
    return (
      <div className="flex min-h-[180px] items-center justify-center p-5">
        <VisitorsByCountryShimmer />
      </div>
    );
  }

  return (
    <div className="flex min-h-[180px] flex-col rounded-lg border border-stone-200/80 bg-white p-5 shadow-sm">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-500">
        Top countries (7 days)
      </p>
      {data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.map((d) => (
            <div key={d.country} className="flex items-center gap-3">
              <span className="text-lg">{d.flag || "🌍"}</span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-800">{d.country}</span>
                  <span
                    className="font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {d.visitors.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(d.visitors / maxVisitors) * 100}%`,
                      backgroundColor: primaryColor,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-stone-400">No data yet</p>
      )}
    </div>
  );
}
