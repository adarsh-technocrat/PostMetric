"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function getVisitorLabel(n: number): string {
  return n === 1 ? "person" : "people";
}

interface VisitorCountWidgetProps {
  websiteId: string;
  shareId: string;
  initialCount: number;
  mainTextSize?: number;
  primaryColor?: string;
}

function VisitorCountShimmer() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-3 w-44" />
    </div>
  );
}

export function VisitorCountWidget({
  websiteId,
  shareId,
  initialCount,
  mainTextSize = 16,
  primaryColor = "#e78468",
}: VisitorCountWidgetProps) {
  const [visitorsNow, setVisitorsNow] = useState(initialCount);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchCount = () => {
      fetch(
        `${typeof window !== "undefined" ? window.location.origin : ""}/api/websites/${websiteId}/widget/data?shareId=${encodeURIComponent(shareId)}`,
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.visitorsNow !== undefined) {
            setVisitorsNow(data.visitorsNow);
          }
        })
        .catch(() => {});
    };

    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, [websiteId, shareId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-5">
      {!isLoaded ? (
        <VisitorCountShimmer />
      ) : (
        <div
          className="text-center font-bold"
          style={{ fontSize: `${mainTextSize}px` }}
        >
          <span style={{ color: primaryColor }}>{visitorsNow}</span>{" "}
          <span style={{ color: "#666" }}>
            {getVisitorLabel(visitorsNow)} visiting this site now
          </span>
        </div>
      )}
    </div>
  );
}
