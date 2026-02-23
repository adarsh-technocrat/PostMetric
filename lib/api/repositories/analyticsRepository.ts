import { apiClient } from "@/lib/api/client";
import type { BreakdownKey } from "@/lib/constants/analytics-breakdowns";

export interface AnalyticsParams {
  websiteId: string;
  period: string;
  granularity?: "hourly" | "daily" | "weekly" | "monthly";
  customDateRange?: { from: Date; to: Date };
  signal?: AbortSignal;
}

export async function getAnalytics(params: AnalyticsParams) {
  let apiPeriod = params.period;
  if (params.customDateRange?.from && params.customDateRange?.to) {
    const fromStr = params.customDateRange.from.toISOString().split("T")[0];
    const toStr = params.customDateRange.to.toISOString().split("T")[0];
    apiPeriod = `custom:${fromStr}:${toStr}`;
  }

  const searchParams = new URLSearchParams({
    period: apiPeriod,
    granularity: params.granularity ?? "daily",
  });

  const { data } = await apiClient.get(
    `/api/websites/${params.websiteId}/analytics?${searchParams.toString()}`,
    { signal: params.signal },
  );
  return { ...data, period: params.period, granularity: params.granularity };
}

export interface BreakdownParams {
  websiteId: string;
  breakdown: BreakdownKey;
  period: string;
  customDateRange?: { from: Date; to: Date };
  signal?: AbortSignal;
}

export async function getBreakdown(params: BreakdownParams) {
  const searchParams = new URLSearchParams({ period: params.period });
  if (params.customDateRange?.from && params.customDateRange?.to) {
    searchParams.set("startDate", params.customDateRange.from.toISOString());
    searchParams.set("endDate", params.customDateRange.to.toISOString());
  }

  const { data } = await apiClient.get(
    `/api/websites/${params.websiteId}/analytics/breakdowns/${params.breakdown}?${searchParams.toString()}`,
    { signal: params.signal },
  );
  return { websiteId: params.websiteId, breakdown: params.breakdown, data: data.data ?? [] };
}
