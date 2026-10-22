import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  BREAKDOWN_KEYS,
  type BreakdownKey,
} from "@/lib/constants/analytics-breakdowns";
import * as analyticsRepo from "@/lib/api/repositories/analyticsRepository";
import { isAbortError } from "@/lib/api/repositories/analyticsRepository";

export const ABORTED_PAYLOAD = "__analytics_aborted__";

export { BREAKDOWN_KEYS };
export type { BreakdownKey };

export type Granularity = "hourly" | "daily" | "weekly" | "monthly";

/**
 * Stored analytics are keyed by the full query, not just the website, so the
 * dashboard card ("today / hourly") and the site dashboard (any period /
 * granularity / offset) can never read each other's data.
 */
export function analyticsQueryKey(q: {
  websiteId: string;
  period: string;
  granularity: Granularity;
  offset?: number;
}): string {
  return `${q.websiteId}|${q.period}|${q.granularity}|${q.offset ?? 0}`;
}

/** Breakdowns do not depend on granularity. */
export function breakdownQueryKey(q: {
  websiteId: string;
  period: string;
  offset?: number;
}): string {
  return `${q.websiteId}|${q.period}|${q.offset ?? 0}`;
}

export interface AnalyticsQueryArg {
  websiteId: string;
  /** API period: preset (e.g. "today") or `custom:YYYY-MM-DD:YYYY-MM-DD`. */
  period: string;
  granularity: Granularity;
  /** Integer <= 0 (shift back N whole periods). */
  offset?: number;
  /** Fallback timezone for date labels when the response has no `range`. */
  timezone?: string;
  signal?: AbortSignal;
}

export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (arg: AnalyticsQueryArg, { rejectWithValue }) => {
    try {
      return await analyticsRepo.getAnalytics({
        websiteId: arg.websiteId,
        period: arg.period,
        granularity: arg.granularity,
        offset: arg.offset,
        signal: arg.signal,
      });
    } catch (error: unknown) {
      if (arg.signal?.aborted || isAbortError(error)) {
        return rejectWithValue(ABORTED_PAYLOAD);
      }
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch analytics",
      );
    }
  },
);

export const fetchBreakdown = createAsyncThunk(
  "analytics/fetchBreakdown",
  async (
    arg: {
      websiteId: string;
      breakdown: BreakdownKey;
      period: string;
      offset?: number;
      signal?: AbortSignal;
    },
    { rejectWithValue },
  ) => {
    try {
      return await analyticsRepo.getBreakdown({
        websiteId: arg.websiteId,
        breakdown: arg.breakdown,
        period: arg.period,
        offset: arg.offset,
        signal: arg.signal,
      });
    } catch (error: unknown) {
      if (arg.signal?.aborted || isAbortError(error)) {
        return rejectWithValue(ABORTED_PAYLOAD);
      }
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch breakdown",
      );
    }
  },
);

interface ChartDataPoint {
  date: string;
  fullDate?: string;
  timestamp?: string;
  granularity?: Granularity;
  timezone?: string;
  visitors: number;
  revenue: number;
  revenueNew?: number;
  revenueRenewal?: number;
  revenueRefund?: number;
  revenuePerVisitor?: number;
  conversionRate?: number;
  hasMention?: boolean;
  mentions?: Array<{
    text: string;
    url?: string;
    type: "profile" | "gear";
  }>;
}

export interface BreakdownData {
  name: string;
  uv: number;
  revenue?: number;
  image?: string;
  flag?: string;
  conversionRate?: number;
  goalCount?: number;
  goalConversionRate?: number;
  hostname?: string;
}

/** Contract keys; null = no previous-period data (render "—"). */
export type PercentageChangeKey =
  | "visitors"
  | "sessions"
  | "pageViews"
  | "bounceRate"
  | "sessionDuration"
  | "conversionRate"
  | "revenue"
  | "revenuePerVisitor";

export type PercentageChangeMap = Partial<
  Record<PercentageChangeKey, number | null>
>;

export interface ResolvedRange {
  start: string;
  end: string;
  timezone: string;
}

export interface WebsiteAnalytics {
  chartData: ChartDataPoint[];
  metrics: {
    /** Plain numeric strings (no currency symbol); formatted by the view. */
    visitors: string;
    revenue: string;
    conversionRate: string;
    revenuePerVisitor: string;
    bounceRate: string;
    sessionTime: string;
    visitorsNow: string;
  } | null;
  /** Raw numeric totals from the response. */
  totals: {
    /** Unique visitors over the whole period (never a sum of buckets). */
    visitors: number;
    /** Major currency units. */
    revenue: number;
  } | null;
  percentageChange: PercentageChangeMap | null;
  revenueBreakdown: {
    newRevenue: number;
    renewalRevenue: number;
    refundedRevenue: number;
  } | null;
  range: ResolvedRange | null;
  currency: string | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
  /** requestId of the latest request for this query; older ones are ignored. */
  requestId: string | null;
  granularity: Granularity;
}

export interface BreakdownEntry {
  data: BreakdownData[];
  loading: boolean;
  error: string | null;
  requestId: string | null;
}

interface AnalyticsState {
  byQueryKey: Record<string, WebsiteAnalytics>;
  breakdownsByQueryKey: Record<
    string,
    Partial<Record<BreakdownKey, BreakdownEntry>>
  >;
}

export const createEmptyWebsiteAnalytics = (
  granularity: Granularity = "daily",
): WebsiteAnalytics => ({
  chartData: [],
  metrics: null,
  totals: null,
  percentageChange: null,
  revenueBreakdown: null,
  range: null,
  currency: null,
  loading: false,
  error: null,
  lastFetched: null,
  requestId: null,
  granularity,
});

const initialState: AnalyticsState = {
  byQueryKey: {},
  breakdownsByQueryKey: {},
};

function toPercentOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function normalizePercentageChange(raw: unknown): PercentageChangeMap | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    visitors: toPercentOrNull(r.visitors),
    sessions: toPercentOrNull(r.sessions),
    pageViews: toPercentOrNull(r.pageViews),
    bounceRate: toPercentOrNull(r.bounceRate),
    sessionDuration: toPercentOrNull(r.sessionDuration),
    conversionRate: toPercentOrNull(r.conversionRate),
    revenue: toPercentOrNull(r.revenue),
    revenuePerVisitor: toPercentOrNull(r.revenuePerVisitor),
  };
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalytics: (state, action: PayloadAction<string | undefined>) => {
      const websiteId = action.payload;
      if (!websiteId) {
        state.byQueryKey = {};
        state.breakdownsByQueryKey = {};
        return;
      }
      const prefix = `${websiteId}|`;
      for (const key of Object.keys(state.byQueryKey)) {
        if (key.startsWith(prefix)) delete state.byQueryKey[key];
      }
      for (const key of Object.keys(state.breakdownsByQueryKey)) {
        if (key.startsWith(prefix)) delete state.breakdownsByQueryKey[key];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state, action) => {
        const key = analyticsQueryKey(action.meta.arg);
        if (!state.byQueryKey[key]) {
          state.byQueryKey[key] = createEmptyWebsiteAnalytics(
            action.meta.arg.granularity,
          );
        }
        const entry = state.byQueryKey[key];
        entry.loading = true;
        entry.error = null;
        entry.requestId = action.meta.requestId;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        const arg = action.meta.arg;
        const key = analyticsQueryKey(arg);
        const entry = state.byQueryKey[key];
        // Stale (superseded) or cleared: ignore.
        if (!entry || entry.requestId !== action.meta.requestId) return;

        const payload = action.payload ?? {};
        const range: ResolvedRange | null =
          payload.range && payload.range.start && payload.range.end
            ? {
                start: String(payload.range.start),
                end: String(payload.range.end),
                timezone: String(payload.range.timezone || arg.timezone || ""),
              }
            : null;
        const timezone = range?.timezone || arg.timezone || undefined;
        const granularity = arg.granularity;

        entry.loading = false;
        entry.error = null;
        entry.requestId = null;
        entry.lastFetched = new Date().toISOString();
        entry.granularity = granularity;
        entry.range = range;
        entry.currency =
          typeof payload.currency === "string" ? payload.currency : null;

        const processedData: Array<Record<string, unknown>> = Array.isArray(
          payload.processedData,
        )
          ? payload.processedData
          : [];

        entry.chartData = processedData.map((item) => {
          const newRev = num(item.revenue);
          const renewalRev = num(item.renewalRevenue);
          const visitors = item.visitors as number;
          const timestamp =
            typeof item.timestamp === "string" ? item.timestamp : undefined;
          return {
            date: String(item.name ?? ""),
            fullDate: timestamp
              ? formatFullDate(timestamp, granularity, timezone)
              : undefined,
            timestamp,
            granularity,
            timezone,
            visitors,
            revenue: newRev + renewalRev,
            revenueNew: item.revenue as number,
            revenueRenewal: item.renewalRevenue as number,
            revenueRefund: item.refundedRevenue as number,
            revenuePerVisitor:
              num(visitors) > 0 ? (newRev + renewalRev) / num(visitors) : 0,
            conversionRate: 0,
          };
        });

        const totalVisitors = num(payload.totalVisitors);
        const totalRevenue = num(payload.totalRevenue);

        entry.totals = { visitors: totalVisitors, revenue: totalRevenue };
        entry.metrics = {
          visitors: String(totalVisitors),
          revenue: String(totalRevenue),
          conversionRate: `${num(payload.conversionRate).toFixed(2)}%`,
          revenuePerVisitor: String(num(payload.revenuePerVisitor)),
          bounceRate: `${num(payload.bounceRate).toFixed(0)}%`,
          sessionTime: formatDuration(num(payload.sessionDuration)),
          visitorsNow: "0",
        };

        entry.percentageChange = normalizePercentageChange(
          payload.percentageChange,
        );

        entry.revenueBreakdown = {
          newRevenue: num(payload.totalNewRevenue),
          renewalRevenue: num(payload.totalRenewalRevenue),
          refundedRevenue: num(payload.totalRefundedRevenue),
        };
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        const key = analyticsQueryKey(action.meta.arg);
        const entry = state.byQueryKey[key];
        if (!entry || entry.requestId !== action.meta.requestId) return;
        entry.loading = false;
        entry.requestId = null;
        if (action.payload !== ABORTED_PAYLOAD) {
          entry.error =
            (action.payload as string) ||
            action.error.message ||
            "Failed to fetch analytics";
        }
      })
      .addCase(fetchBreakdown.pending, (state, action) => {
        const { breakdown } = action.meta.arg;
        const key = breakdownQueryKey(action.meta.arg);
        const slot = (state.breakdownsByQueryKey[key] ??= {});
        const entry = (slot[breakdown] ??= {
          data: [],
          loading: false,
          error: null,
          requestId: null,
        });
        entry.loading = true;
        entry.error = null;
        entry.requestId = action.meta.requestId;
      })
      .addCase(fetchBreakdown.fulfilled, (state, action) => {
        const { breakdown } = action.meta.arg;
        const key = breakdownQueryKey(action.meta.arg);
        const entry = state.breakdownsByQueryKey[key]?.[breakdown];
        if (!entry || entry.requestId !== action.meta.requestId) return;
        entry.loading = false;
        entry.error = null;
        entry.requestId = null;
        entry.data = Array.isArray(action.payload.data)
          ? action.payload.data
          : [];
      })
      .addCase(fetchBreakdown.rejected, (state, action) => {
        const { breakdown } = action.meta.arg;
        const key = breakdownQueryKey(action.meta.arg);
        const entry = state.breakdownsByQueryKey[key]?.[breakdown];
        if (!entry || entry.requestId !== action.meta.requestId) return;
        entry.loading = false;
        entry.requestId = null;
        if (action.payload !== ABORTED_PAYLOAD) {
          // Show the failure instead of silently keeping old rows.
          entry.data = [];
          entry.error =
            (action.payload as string) ||
            action.error.message ||
            "Failed to fetch breakdown";
        }
      });
  },
});

/**
 * Tooltip date for a bucket, formatted in the website timezone. Daily/weekly
 * buckets get a date only; monthly gets month + year; hourly is handled by
 * `formatDateDisplay` (adds the hour).
 */
function formatFullDate(
  timestamp: string,
  granularity: Granularity,
  timezone?: string,
): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  const options: Intl.DateTimeFormatOptions =
    granularity === "monthly"
      ? { year: "numeric", month: "long" }
      : { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  let formatted: string;
  try {
    formatted = date.toLocaleDateString("en-US", {
      ...options,
      ...(timezone ? { timeZone: timezone } : {}),
    });
  } catch {
    // Unknown timezone id: fall back to the browser timezone.
    formatted = date.toLocaleDateString("en-US", options);
  }
  return granularity === "weekly" ? `Week of ${formatted}` : formatted;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export const { clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
