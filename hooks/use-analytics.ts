import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  analyticsQueryKey,
  createEmptyWebsiteAnalytics,
  fetchAnalytics,
  type Granularity,
  type WebsiteAnalytics,
} from "@/store/slices/analyticsSlice";

const EMPTY_ANALYTICS: WebsiteAnalytics = createEmptyWebsiteAnalytics();

/** Select stored analytics for an exact query key (stable empty fallback). */
export function useAnalyticsEntry(queryKey: string | null): WebsiteAnalytics {
  return useAppSelector((state) =>
    queryKey
      ? (state.analytics.byQueryKey[queryKey] ?? EMPTY_ANALYTICS)
      : EMPTY_ANALYTICS,
  );
}

/**
 * Fetch + select analytics for one explicit query (website + period +
 * granularity + offset). Data is stored per query, so different callers (e.g.
 * the dashboard card and the site dashboard) never share a slot.
 */
export function useAnalytics(
  websiteId: string,
  options: {
    /** API period, e.g. "today" or `custom:YYYY-MM-DD:YYYY-MM-DD`. */
    period: string;
    granularity: Granularity;
    offset?: number;
    timezone?: string;
    disableAutoFetch?: boolean;
  },
): WebsiteAnalytics & { refetch: () => void } {
  const dispatch = useAppDispatch();
  const { period, granularity, offset = 0, timezone, disableAutoFetch } =
    options;
  const queryKey = websiteId
    ? analyticsQueryKey({ websiteId, period, granularity, offset })
    : null;
  const analytics = useAnalyticsEntry(queryKey);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => {
    if (!websiteId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch(
      fetchAnalytics({
        websiteId,
        period,
        granularity,
        offset,
        timezone,
        signal: controller.signal,
      }),
    );
  }, [dispatch, websiteId, period, granularity, offset, timezone]);

  useEffect(() => {
    if (!websiteId || disableAutoFetch) return;
    refetch();
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
    // queryKey captures websiteId/period/granularity/offset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, disableAutoFetch]);

  return { ...analytics, refetch };
}
