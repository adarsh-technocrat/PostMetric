import { apiClient } from "@/lib/api/client";
import type { BreakdownKey } from "@/lib/constants/analytics-breakdowns";

export type Granularity = "hourly" | "daily" | "weekly" | "monthly";

/**
 * Format a calendar date picked by the user as `yyyy-MM-dd` using its LOCAL
 * components. `toISOString()` would convert to UTC first and can shift the
 * day (e.g. midnight Oct 5 in UTC+5:30 becomes "2026-10-04").
 */
/** True when the error is an aborted/cancelled request. */
export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name;
  return name === "AbortError" || name === "CanceledError";
}

export function formatLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Build the `period` query value. Presets are passed through unchanged;
 * a custom range becomes `custom:YYYY-MM-DD:YYYY-MM-DD` (inclusive local
 * dates, interpreted server-side in the website timezone).
 */
export function buildApiPeriod(
  period: string,
  customDateRange?: { from: Date; to: Date },
): string {
  if (customDateRange?.from && customDateRange?.to) {
    return `custom:${formatLocalYmd(customDateRange.from)}:${formatLocalYmd(
      customDateRange.to,
    )}`;
  }
  return period;
}

export interface AnalyticsParams {
  websiteId: string;
  /** Preset period string or `custom:YYYY-MM-DD:YYYY-MM-DD`. */
  period: string;
  granularity?: Granularity;
  /** Integer <= 0: shift back N whole periods (server does the date math). */
  offset?: number;
  signal?: AbortSignal;
}

function appendOffset(searchParams: URLSearchParams, offset?: number) {
  if (offset && offset !== 0) {
    searchParams.set("offset", String(Math.min(0, Math.trunc(offset))));
  }
}

export async function getAnalytics(params: AnalyticsParams) {
  const searchParams = new URLSearchParams({
    period: params.period,
    granularity: params.granularity ?? "daily",
  });
  appendOffset(searchParams, params.offset);

  const { data } = await apiClient.get(
    `/api/websites/${params.websiteId}/analytics?${searchParams.toString()}`,
    { signal: params.signal },
  );
  return { ...data, period: params.period, granularity: params.granularity };
}

export interface BreakdownParams {
  websiteId: string;
  breakdown: BreakdownKey;
  /** Same `period` value as the overview request. */
  period: string;
  offset?: number;
  signal?: AbortSignal;
}

export async function getBreakdown(params: BreakdownParams) {
  const searchParams = new URLSearchParams({ period: params.period });
  appendOffset(searchParams, params.offset);

  const { data } = await apiClient.get(
    `/api/websites/${params.websiteId}/analytics/breakdowns/${params.breakdown}?${searchParams.toString()}`,
    { signal: params.signal },
  );
  return {
    websiteId: params.websiteId,
    breakdown: params.breakdown,
    data: data.data ?? [],
  };
}

export interface GoalStatsRow {
  name: string;
  /** Total completions in the period (null when unknown). */
  completions: number | null;
  /** Unique visitors who completed the goal (null when unknown). */
  uniqueConverters: number | null;
  /** Percent of period visitors who converted (null when unknown). */
  conversionRate: number | null;
}

function toNumberOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Goals for the goals card. Tries the `goals` breakdown (per-goal stats for
 * the period); if the server does not support it yet (400/404), falls back to
 * the list of configured goals without stats.
 */
export async function getGoalStats(params: {
  websiteId: string;
  period: string;
  offset?: number;
  signal?: AbortSignal;
}): Promise<{ goals: GoalStatsRow[]; hasStats: boolean }> {
  const searchParams = new URLSearchParams({ period: params.period });
  appendOffset(searchParams, params.offset);
  try {
    const { data } = await apiClient.get(
      `/api/websites/${params.websiteId}/analytics/breakdowns/goals?${searchParams.toString()}`,
      { signal: params.signal },
    );
    const rows: unknown[] = Array.isArray(data?.data) ? data.data : [];
    return {
      hasStats: true,
      goals: rows.map((raw) => {
        const r = (raw ?? {}) as Record<string, unknown>;
        return {
          name: String(r.name ?? r.goal ?? r.event ?? "Unknown"),
          completions: toNumberOrNull(
            r.completions ?? r.count ?? r.goalCount ?? r.uv,
          ),
          uniqueConverters: toNumberOrNull(
            r.uniqueConverters ?? r.uniqueVisitors ?? r.visitors,
          ),
          conversionRate: toNumberOrNull(
            r.conversionRate ?? r.goalConversionRate,
          ),
        };
      }),
    };
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status;
    if (status !== 400 && status !== 404) throw error;
  }

  const { data } = await apiClient.get(
    `/api/goals?websiteId=${encodeURIComponent(params.websiteId)}`,
    { signal: params.signal },
  );
  const list: unknown[] = Array.isArray(data?.goals) ? data.goals : [];
  return {
    hasStats: false,
    goals: list.map((raw) => {
      const g = (raw ?? {}) as Record<string, unknown>;
      return {
        name: String(g.name ?? g.event ?? "Unknown"),
        completions: null,
        uniqueConverters: null,
        conversionRate: null,
      };
    }),
  };
}
