import { useEffect, useRef } from "react";
import { createSelector } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAnalytics,
  type WebsiteAnalytics,
} from "@/store/slices/analyticsSlice";

const selectAnalyticsCache = new Map<
  string,
  (state: {
    analytics: {
      byWebsiteId: Record<string, unknown>;
      breakdownsByWebsiteId: Record<string, unknown>;
    };
  }) => unknown
>();

function getSelectAnalytics(websiteId: string) {
  if (!selectAnalyticsCache.has(websiteId)) {
    selectAnalyticsCache.set(
      websiteId,
      createSelector(
        [
          (state: {
            analytics: {
              byWebsiteId: Record<string, unknown>;
              breakdownsByWebsiteId: Record<string, unknown>;
            };
          }) => state.analytics.byWebsiteId[websiteId],
          (state: {
            analytics: { breakdownsByWebsiteId: Record<string, unknown> };
          }) => state.analytics.breakdownsByWebsiteId[websiteId],
        ],
        (websiteData, breakdownsFromStore) => {
          const breakdowns =
            breakdownsFromStore ??
            (websiteData as { breakdowns?: unknown })?.breakdowns ??
            null;
          if (websiteData) {
            return { ...(websiteData as object), breakdowns };
          }
          return {
            chartData: [],
            metrics: null,
            percentageChange: null,
            revenueBreakdown: null,
            breakdowns: breakdownsFromStore ?? null,
            loading: false,
            error: null,
            lastFetched: null,
            currentStartDate: null,
            currentEndDate: null,
            currentGranularity: "daily" as const,
          };
        },
      ),
    );
  }
  return selectAnalyticsCache.get(websiteId)!;
}

export function useAnalytics(
  websiteId: string,
  options?: {
    customDateRange?: { startDate: Date; endDate: Date };
    disableAutoFetch?: boolean;
    period?: string;
    granularity?: "hourly" | "daily" | "weekly" | "monthly";
  },
): WebsiteAnalytics & { refetch: () => void } {
  const dispatch = useAppDispatch();
  const selectAnalytics = getSelectAnalytics(websiteId);
  const analytics = useAppSelector(selectAnalytics);
  const selectedPeriod = useAppSelector((state) => state.ui.selectedPeriod);
  const selectedGranularity = useAppSelector(
    (state) => state.ui.selectedGranularity,
  );

  const period = options?.period ?? selectedPeriod;
  const granularity = options?.granularity ?? selectedGranularity;
  const analyticsAbortRef = useRef<AbortController | null>(null);

  const getSignalForNewAnalyticsRequest = (): AbortSignal => {
    analyticsAbortRef.current?.abort();
    const controller = new AbortController();
    analyticsAbortRef.current = controller;
    return controller.signal;
  };

  const getDateRange = (period: string) => {
    let endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "Today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Yesterday":
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Last 24 hours":
        endDate = new Date();
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case "Last 7 days":
        endDate = new Date();
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Last 30 days":
        endDate = new Date();
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Last 12 months":
        endDate = new Date();
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 12);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "Week to date":
        endDate = new Date();
        const dayOfWeek = endDate.getDay();
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "Month to date":
        endDate = new Date();
        startDate = new Date(endDate);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "Year to date":
        endDate = new Date();
        startDate = new Date(endDate);
        startDate.setMonth(0);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "All time": {
        endDate = new Date();
        const maxYearsBack = 3;
        startDate = new Date(
          Date.now() - maxYearsBack * 365 * 24 * 60 * 60 * 1000,
        );
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      default:
        endDate = new Date();
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  };

  const getGranularity = (
    granularity: string,
  ): "hourly" | "daily" | "weekly" | "monthly" => {
    switch (granularity.toLowerCase()) {
      case "hourly":
        return "hourly";
      case "daily":
        return "daily";
      case "weekly":
        return "weekly";
      case "monthly":
        return "monthly";
      default:
        return "daily";
    }
  };

  useEffect(() => {
    if (!websiteId || options?.disableAutoFetch) return;

    const granularityValue = getGranularity(granularity);
    const customDateRange = options?.customDateRange
      ? {
          from: options.customDateRange.startDate,
          to: options.customDateRange.endDate,
        }
      : undefined;

    // If customDateRange is provided, use "Custom" period
    const periodToUse = customDateRange ? "Custom" : period;

    dispatch(
      fetchAnalytics({
        websiteId,
        period: periodToUse,
        granularity: granularityValue,
        customDateRange,
        signal: getSignalForNewAnalyticsRequest(),
      }),
    );
  }, [
    websiteId,
    period,
    granularity,
    dispatch,
    options?.customDateRange,
    options?.disableAutoFetch,
  ]);

  const analyticsData = (analytics ?? {}) as WebsiteAnalytics;
  return {
    ...analyticsData,
    loading: analyticsData.loading ?? false,
    refetch: () => {
      if (!websiteId) return;
      const granularityValue = getGranularity(granularity);
      const customDateRange = options?.customDateRange
        ? {
            from: options.customDateRange.startDate,
            to: options.customDateRange.endDate,
          }
        : undefined;
      // If customDateRange is provided, use "Custom" period
      const periodToUse = customDateRange ? "Custom" : period;
      dispatch(
        fetchAnalytics({
          websiteId,
          period: periodToUse,
          granularity: granularityValue,
          customDateRange,
          signal: getSignalForNewAnalyticsRequest(),
        }),
      );
    },
  } as WebsiteAnalytics & { refetch: () => void };
}
