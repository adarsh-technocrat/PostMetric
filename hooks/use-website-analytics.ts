import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { type DateRange } from "react-day-picker";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setSelectedPeriod,
  setSelectedGranularity,
  setSelectedSourceTab,
  setSelectedPathTab,
  setSelectedLocationTab,
  setSelectedSystemTab,
  setSelectedGoalTab,
} from "@/store/slices/uiSlice";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import {
  analyticsQueryKey,
  breakdownQueryKey,
  fetchAnalytics,
  fetchBreakdown,
  type BreakdownEntry,
  type BreakdownKey,
  type Granularity,
  type PercentageChangeKey,
  type ResolvedRange,
  type WebsiteAnalytics,
} from "@/store/slices/analyticsSlice";
import { toApiPeriod } from "@/lib/constants/periods";
import {
  buildApiPeriod,
  getGoalStats,
  isAbortError,
  type GoalStatsRow,
} from "@/lib/api/repositories/analyticsRepository";
import { useAnalyticsEntry } from "@/hooks/use-analytics";
import { useRealtimeVisitors } from "@/hooks/use-realtime-visitors";
import type { ChartDataPoint } from "@/components/chart";

interface UseWebsiteAnalyticsProps {
  websiteId: string;
}

export interface WebsiteSettings {
  currency?: string;
  excludeIps?: string[];
  excludeCountries?: string[];
  excludeHostnames?: string[];
  excludePaths?: string[];
  hashPaths?: boolean;
  trackScroll?: boolean;
  trackUserIdentification?: boolean;
  timezone?: string;
  colorScheme?: string;
  nickname?: string;
  additionalDomains?: string[];
  publicDashboard?: {
    enabled: boolean;
    shareId?: string;
  };
  attackMode?: {
    enabled: boolean;
    autoActivate: boolean;
    threshold?: number;
    activatedAt?: Date;
  };
  primaryGoalId?: string;
}

type UiGranularity = "Hourly" | "Daily" | "Weekly" | "Monthly";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Inclusive number of calendar days in a picked custom range. */
function customSpanDays(range: DateRange | undefined): number | null {
  if (!range?.from || !range?.to) return null;
  const from = Date.UTC(
    range.from.getFullYear(),
    range.from.getMonth(),
    range.from.getDate(),
  );
  const to = Date.UTC(
    range.to.getFullYear(),
    range.to.getMonth(),
    range.to.getDate(),
  );
  return Math.round((to - from) / DAY_MS) + 1;
}

/**
 * Granularities offered for a period. Depends only on the period's length, so
 * no client-side date math is needed (the server resolves actual dates).
 */
export function getAvailableGranularities(
  period: string,
  spanDays: number | null,
): UiGranularity[] {
  switch (period) {
    case "Today":
    case "Yesterday":
    case "Last 24 hours":
      return ["Hourly"];
    case "Week to date":
      return ["Hourly", "Daily"];
    case "Last 7 days":
    case "Month to date":
    case "Year to date":
      return ["Daily", "Weekly"];
    case "Last 30 days":
      return ["Daily", "Weekly", "Monthly"];
    case "Last 12 months":
    case "All time":
      return ["Weekly", "Monthly"];
    case "Custom": {
      const days = spanDays ?? 30;
      if (days <= 2) return ["Hourly", "Daily"];
      if (days <= 7) return ["Daily", "Weekly"];
      if (days <= 90) return ["Daily", "Weekly", "Monthly"];
      return ["Weekly", "Monthly"];
    }
    default:
      return ["Daily", "Weekly", "Monthly"];
  }
}

function defaultGranularityFor(
  period: string,
  available: UiGranularity[],
): UiGranularity {
  if (period === "All time") return "Monthly";
  if (period === "Last 12 months" || period === "Year to date") {
    return "Weekly";
  }
  return available[0] ?? "Daily";
}

/**
 * Human label for the server-resolved range, formatted in its timezone.
 * The end is nudged back 1ms so both inclusive (23:59:59.999) and exclusive
 * (next midnight) range ends render as the last included day.
 */
export function formatResolvedRange(range: ResolvedRange | null): string | null {
  if (!range) return null;
  const start = new Date(range.start);
  const endRaw = new Date(range.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(endRaw.getTime())) {
    return null;
  }
  const end = new Date(Math.max(start.getTime(), endRaw.getTime() - 1));
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => {
    try {
      return d.toLocaleDateString("en-US", {
        ...opts,
        ...(range.timezone ? { timeZone: range.timezone } : {}),
      });
    } catch {
      return d.toLocaleDateString("en-US", opts);
    }
  };
  const full: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const startStr = fmt(start, full);
  const endStr = fmt(end, full);
  if (startStr === endStr) return startStr;
  const sameYear =
    fmt(start, { year: "numeric" }) === fmt(end, { year: "numeric" });
  return `${sameYear ? fmt(start, { month: "short", day: "numeric" }) : startStr} → ${endStr}`;
}

export interface GoalsState {
  rows: GoalStatsRow[];
  hasStats: boolean;
  loading: boolean;
  error: string | null;
}

const EMPTY_BREAKDOWN_SLOT: Partial<Record<BreakdownKey, BreakdownEntry>> = {};

export function useWebsiteAnalytics({ websiteId }: UseWebsiteAnalyticsProps) {
  const dispatch = useAppDispatch();
  // Number of whole periods shifted back (0 = current). Sent as `offset=-N`.
  const [periodOffset, setPeriodOffset] = useState(0);
  const [customDateRange, setCustomDateRangeState] = useState<
    DateRange | undefined
  >({
    from: undefined,
    to: undefined,
  });
  const [mentionDialogOpen, setMentionDialogOpen] = useState(false);
  const [selectedMentionData, setSelectedMentionData] =
    useState<ChartDataPoint | null>(null);

  const ui = useAppSelector((state) => state.ui) as {
    selectedPeriod: string;
    selectedGranularity: UiGranularity;
    selectedSourceTab: "Channel" | "Referrer" | "Campaign" | "Keyword";
    selectedPathTab: "Hostname" | "Page" | "Entry page" | "Exit link";
    selectedLocationTab: "Map" | "Country" | "Region" | "City";
    selectedSystemTab: "Browser" | "OS" | "Device";
    selectedGoalTab: "Goal" | "Funnel" | "Journey";
    showMentionsOnChart: boolean;
    showRevenueOnChart: boolean;
    showVisitorsOnChart: boolean;
  };

  const currentWebsite = useAppSelector(
    (state) => state.websites.currentWebsite,
  ) as {
    _id: string;
    domain: string;
    name: string;
    iconUrl?: string;
    settings?: WebsiteSettings;
  } | null;
  // Never show another site's name/logo/currency while the new one loads.
  const website =
    currentWebsite && currentWebsite._id === websiteId ? currentWebsite : null;
  const websiteTimezone = website?.settings?.timezone;

  useEffect(() => {
    if (websiteId) {
      dispatch(fetchWebsiteDetailsById(websiteId));
    }
  }, [websiteId, dispatch]);

  // ---- Query description -------------------------------------------------
  const isCustom = ui.selectedPeriod === "Custom";
  const customFrom = customDateRange?.from;
  const customTo = customDateRange?.to;
  const queryReady = !isCustom || Boolean(customFrom && customTo);
  const apiPeriod = useMemo(
    () =>
      isCustom && customFrom && customTo
        ? buildApiPeriod("custom", { from: customFrom, to: customTo })
        : toApiPeriod(ui.selectedPeriod),
    [isCustom, customFrom, customTo, ui.selectedPeriod],
  );
  const apiOffset = periodOffset === 0 ? 0 : -periodOffset;

  const availableGranularities = useMemo(
    () =>
      getAvailableGranularities(
        ui.selectedPeriod,
        customSpanDays(customDateRange),
      ),
    [ui.selectedPeriod, customDateRange],
  );
  const effectiveUiGranularity: UiGranularity = availableGranularities.includes(
    ui.selectedGranularity,
  )
    ? ui.selectedGranularity
    : defaultGranularityFor(ui.selectedPeriod, availableGranularities);
  const granularity = effectiveUiGranularity.toLowerCase() as Granularity;

  // Keep the selector in sync when the stored granularity is not valid for
  // the period. The fetch already uses the effective value, so this does not
  // trigger another request.
  useEffect(() => {
    if (ui.selectedGranularity !== effectiveUiGranularity) {
      dispatch(setSelectedGranularity(effectiveUiGranularity));
    }
  }, [dispatch, ui.selectedGranularity, effectiveUiGranularity]);

  const queryKey = websiteId
    ? analyticsQueryKey({
        websiteId,
        period: apiPeriod,
        granularity,
        offset: apiOffset,
      })
    : null;
  const bQueryKey = websiteId
    ? breakdownQueryKey({ websiteId, period: apiPeriod, offset: apiOffset })
    : null;

  const breakdownKeys = useMemo<[BreakdownKey, BreakdownKey, BreakdownKey, BreakdownKey]>(
    () => [
      ui.selectedSourceTab === "Channel"
        ? "source-channels"
        : ui.selectedSourceTab === "Referrer"
          ? "source-referrer"
          : ui.selectedSourceTab === "Campaign"
            ? "source-campaign"
            : "source-keyword",
      ui.selectedPathTab === "Page"
        ? "path-pages"
        : ui.selectedPathTab === "Hostname"
          ? "path-hostnames"
          : ui.selectedPathTab === "Entry page"
            ? "path-entry-pages"
            : "path-exit-links",
      ui.selectedLocationTab === "Country" || ui.selectedLocationTab === "Map"
        ? "location-country"
        : ui.selectedLocationTab === "Region"
          ? "location-region"
          : "location-city",
      ui.selectedSystemTab === "Browser"
        ? "system-browser"
        : ui.selectedSystemTab === "OS"
          ? "system-os"
          : "system-device",
    ],
    [
      ui.selectedSourceTab,
      ui.selectedPathTab,
      ui.selectedLocationTab,
      ui.selectedSystemTab,
    ],
  );

  // ---- Fetching ----------------------------------------------------------
  const analyticsAbortRef = useRef<AbortController | null>(null);
  const lastFetchedQueryKeyRef = useRef<string | null>(null);
  // One controller + last-fetched slot per breakdown card (source/path/location/system).
  const breakdownAbortRefs = useRef<(AbortController | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const lastBreakdownSlotRefs = useRef<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  const fetchOverview = useCallback(() => {
    if (!websiteId || !queryReady) return;
    analyticsAbortRef.current?.abort();
    const controller = new AbortController();
    analyticsAbortRef.current = controller;
    dispatch(
      fetchAnalytics({
        websiteId,
        period: apiPeriod,
        granularity,
        offset: apiOffset,
        timezone: websiteTimezone,
        signal: controller.signal,
      }),
    );
  }, [
    dispatch,
    websiteId,
    queryReady,
    apiPeriod,
    granularity,
    apiOffset,
    websiteTimezone,
  ]);

  const fetchBreakdownSlot = useCallback(
    (index: number, breakdown: BreakdownKey) => {
      if (!websiteId || !queryReady || !bQueryKey) return;
      breakdownAbortRefs.current[index]?.abort();
      const controller = new AbortController();
      breakdownAbortRefs.current[index] = controller;
      lastBreakdownSlotRefs.current[index] = `${bQueryKey}::${breakdown}`;
      dispatch(
        fetchBreakdown({
          websiteId,
          breakdown,
          period: apiPeriod,
          offset: apiOffset,
          signal: controller.signal,
        }),
      );
    },
    [dispatch, websiteId, queryReady, bQueryKey, apiPeriod, apiOffset],
  );

  // Overview: fetch on mount and whenever website/period/custom range/
  // granularity/offset change (tracked by the full query key, so going back
  // to offset 0 refetches too).
  useEffect(() => {
    if (!queryKey || !queryReady) return;
    if (lastFetchedQueryKeyRef.current === queryKey) return;
    lastFetchedQueryKeyRef.current = queryKey;
    fetchOverview();
  }, [queryKey, queryReady, fetchOverview]);

  // Breakdowns: refetch a card whenever its (query, tab) changes.
  useEffect(() => {
    if (!bQueryKey || !queryReady) return;
    breakdownKeys.forEach((breakdown, index) => {
      const slot = `${bQueryKey}::${breakdown}`;
      if (lastBreakdownSlotRefs.current[index] !== slot) {
        fetchBreakdownSlot(index, breakdown);
      }
    });
  }, [bQueryKey, queryReady, breakdownKeys, fetchBreakdownSlot]);

  // Abort everything on unmount (and allow a clean refetch on remount, e.g.
  // React strict-mode double effects).
  useEffect(() => {
    const breakdownControllers = breakdownAbortRefs.current;
    const breakdownSlots = lastBreakdownSlotRefs.current;
    return () => {
      analyticsAbortRef.current?.abort();
      analyticsAbortRef.current = null;
      lastFetchedQueryKeyRef.current = null;
      for (let i = 0; i < breakdownControllers.length; i++) {
        breakdownControllers[i]?.abort();
        breakdownControllers[i] = null;
        breakdownSlots[i] = null;
      }
    };
  }, []);

  // ---- Goals ---------------------------------------------------------------
  // Results are tagged with the query they belong to; anything else is stale.
  const goalsKey = queryReady ? bQueryKey : null;
  const [goalsResult, setGoalsResult] = useState<{
    key: string;
    rows: GoalStatsRow[];
    hasStats: boolean;
    error: string | null;
  } | null>(null);
  const goalsRequestRef = useRef(0);
  const goalsAbortRef = useRef<AbortController | null>(null);

  const fetchGoals = useCallback(() => {
    if (!websiteId || !goalsKey) return;
    goalsAbortRef.current?.abort();
    const controller = new AbortController();
    goalsAbortRef.current = controller;
    const requestId = ++goalsRequestRef.current;
    getGoalStats({
      websiteId,
      period: apiPeriod,
      offset: apiOffset,
      signal: controller.signal,
    })
      .then((result) => {
        if (requestId !== goalsRequestRef.current) return;
        setGoalsResult({
          key: goalsKey,
          rows: result.goals,
          hasStats: result.hasStats,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (requestId !== goalsRequestRef.current || isAbortError(error)) {
          return;
        }
        setGoalsResult({
          key: goalsKey,
          rows: [],
          hasStats: false,
          error:
            error instanceof Error ? error.message : "Failed to load goals",
        });
      });
  }, [websiteId, goalsKey, apiPeriod, apiOffset]);

  useEffect(() => {
    fetchGoals();
    return () => {
      goalsAbortRef.current?.abort();
    };
  }, [fetchGoals]);

  const goals: GoalsState =
    goalsResult && goalsResult.key === goalsKey
      ? {
          rows: goalsResult.rows,
          hasStats: goalsResult.hasStats,
          loading: false,
          error: goalsResult.error,
        }
      : { rows: [], hasStats: false, loading: Boolean(goalsKey), error: null };

  // ---- Selection -----------------------------------------------------------
  const currentEntry = useAnalyticsEntry(queryKey);
  // While a new query has never loaded, keep showing this hook's previously
  // displayed data (with loading=true) instead of flashing zeros. Only data
  // fetched by this hook for this website is reused.
  const [lastShown, setLastShown] = useState<{
    key: string;
    entry: WebsiteAnalytics;
  } | null>(null);
  if (
    queryKey &&
    currentEntry.lastFetched &&
    (lastShown?.key !== queryKey || lastShown.entry !== currentEntry)
  ) {
    setLastShown({ key: queryKey, entry: currentEntry });
  }
  let shownEntry = currentEntry;
  if (
    !currentEntry.lastFetched &&
    currentEntry.loading &&
    lastShown &&
    lastShown.key.startsWith(`${websiteId}|`)
  ) {
    // Drop the old range so the period label doesn't show stale dates.
    shownEntry = {
      ...lastShown.entry,
      range: null,
      loading: true,
      error: null,
    };
  }

  const breakdownSlot = useAppSelector((state) =>
    bQueryKey
      ? (state.analytics.breakdownsByQueryKey[bQueryKey] ?? EMPTY_BREAKDOWN_SLOT)
      : EMPTY_BREAKDOWN_SLOT,
  );
  const breakdownState = useCallback(
    (key: BreakdownKey) => {
      const entry = breakdownSlot[key];
      return {
        data: entry?.data ?? [],
        // A slot that has never been requested is about to be fetched.
        loading: entry ? entry.loading : queryReady,
        error: entry?.error ?? null,
      };
    },
    [breakdownSlot, queryReady],
  );

  const source = breakdownState(breakdownKeys[0]);
  const path = breakdownState(breakdownKeys[1]);
  const location = breakdownState(breakdownKeys[2]);
  const system = breakdownState(breakdownKeys[3]);

  const { visitorsNow: realtimeVisitorsNow, isConnected } =
    useRealtimeVisitors(websiteId);

  // ---- Period navigation ---------------------------------------------------
  const handlePreviousPeriod = () => {
    // Server shifts back whole periods (presets and custom ranges alike).
    setPeriodOffset((prev) => prev + 1);
  };

  const handleNextPeriod = () => {
    setPeriodOffset((prev) => Math.max(0, prev - 1));
  };

  const handlePeriodSelect = (period: string) => {
    dispatch(setSelectedPeriod(period));
    setPeriodOffset(0);
    if (period === "All time") {
      dispatch(setSelectedGranularity("Monthly"));
    }
    if (period !== "Custom") {
      setCustomDateRangeState({ from: undefined, to: undefined });
    }
  };

  const setCustomDateRange = (range: DateRange | undefined) => {
    setCustomDateRangeState(range);
    // A new custom range starts at its own dates (offset only applies to the
    // range currently being viewed).
    if (ui.selectedPeriod === "Custom") setPeriodOffset(0);
  };

  const canGoNext = periodOffset > 0;

  // ---- Metrics -------------------------------------------------------------
  const analytics = shownEntry;
  const resolvedRangeLabel = formatResolvedRange(analytics.range);

  const metricsData = useMemo(() => {
    const pc = analytics.percentageChange ?? {};
    const change = (key: PercentageChangeKey) => {
      const v = pc[key];
      if (v == null || !Number.isFinite(v)) {
        return { variation: "—", trend: "up" as const, change: null };
      }
      const rounded = Math.round(v * 10) / 10;
      return {
        variation: `${rounded}%`,
        trend: rounded < 0 ? ("down" as const) : ("up" as const),
        change: rounded,
      };
    };

    if (!analytics.metrics) {
      const none = { variation: "—", trend: "up" as const, change: null };
      return {
        visitors: { value: "0", ...none },
        revenue: { value: "0", ...none },
        conversionRate: { value: "0%", ...none },
        revenuePerVisitor: { value: "0", ...none },
        bounceRate: { value: "0%", ...none },
        sessionTime: { value: "0m 0s", ...none },
        visitorsNow: { value: "0" },
      };
    }

    return {
      visitors: { value: analytics.metrics.visitors, ...change("visitors") },
      revenue: { value: analytics.metrics.revenue, ...change("revenue") },
      conversionRate: {
        value: analytics.metrics.conversionRate,
        ...change("conversionRate"),
      },
      revenuePerVisitor: {
        value: analytics.metrics.revenuePerVisitor,
        ...change("revenuePerVisitor"),
      },
      bounceRate: {
        value: analytics.metrics.bounceRate,
        ...change("bounceRate"),
      },
      sessionTime: {
        value: analytics.metrics.sessionTime,
        ...change("sessionDuration"),
      },
      visitorsNow: { value: analytics.metrics.visitorsNow },
    };
  }, [analytics.metrics, analytics.percentageChange]);

  const chartData = analytics.chartData || [];

  const visitorsNow =
    realtimeVisitorsNow > 0
      ? realtimeVisitorsNow.toString()
      : metricsData.visitorsNow.value;

  const refetch = () => {
    if (!websiteId || !queryReady) return;
    lastFetchedQueryKeyRef.current = queryKey;
    fetchOverview();
    breakdownKeys.forEach((breakdown, index) =>
      fetchBreakdownSlot(index, breakdown),
    );
    fetchGoals();
  };

  return {
    ui,
    website,
    periodOffset,
    customDateRange,
    mentionDialogOpen,
    selectedMentionData,
    canGoNext,
    availableGranularities,
    /** Server-resolved range of the displayed data (website timezone). */
    resolvedRange: analytics.range,
    resolvedRangeLabel,

    analytics,
    refetch,
    chartData,
    metricsData,
    revenueBreakdown: analytics.revenueBreakdown,
    sourceData: source.data,
    pathData: path.data,
    locationData: location.data,
    systemData: system.data,
    breakdownStatus: {
      source: { loading: source.loading, error: source.error },
      path: { loading: path.loading, error: path.error },
      location: { loading: location.loading, error: location.error },
      system: { loading: system.loading, error: system.error },
    },
    goals,
    visitorsNow,
    isConnected,

    handlePreviousPeriod,
    handleNextPeriod,
    handlePeriodSelect,
    setCustomDateRange,
    setMentionDialogOpen,
    setSelectedMentionData,

    setSelectedSourceTab: (tab: string) =>
      dispatch(setSelectedSourceTab(tab as typeof ui.selectedSourceTab)),
    setSelectedPathTab: (tab: string) =>
      dispatch(setSelectedPathTab(tab as typeof ui.selectedPathTab)),
    setSelectedLocationTab: (tab: string) =>
      dispatch(setSelectedLocationTab(tab as typeof ui.selectedLocationTab)),
    setSelectedSystemTab: (tab: string) =>
      dispatch(setSelectedSystemTab(tab as typeof ui.selectedSystemTab)),
    setSelectedGoalTab: (tab: string) =>
      dispatch(setSelectedGoalTab(tab as typeof ui.selectedGoalTab)),
    setSelectedGranularity: (granularity: typeof ui.selectedGranularity) =>
      dispatch(setSelectedGranularity(granularity)),
  };
}
