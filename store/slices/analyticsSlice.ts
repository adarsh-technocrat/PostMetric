import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (
    {
      websiteId,
      period,
      granularity = "daily",
      customDateRange,
    }: {
      websiteId: string;
      period: string;
      granularity?: "hourly" | "daily" | "weekly" | "monthly";
      customDateRange?: { from: Date; to: Date };
    },
    { rejectWithValue }
  ) => {
    try {
      let apiPeriod = period;
      if (period === "Custom" && customDateRange?.from && customDateRange?.to) {
        const fromStr = customDateRange.from.toISOString().split("T")[0];
        const toStr = customDateRange.to.toISOString().split("T")[0];
        apiPeriod = `custom:${fromStr}:${toStr}`;
      }

      const params = new URLSearchParams({
        period: apiPeriod,
        granularity,
      });

      const response = await fetch(
        `/api/websites/${websiteId}/analytics?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      return { ...data, period, granularity };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface ChartDataPoint {
  date: string;
  fullDate?: string;
  timestamp?: string;
  visitors: number;
  revenue: number;
  revenueNew?: number;
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

interface BreakdownData {
  name: string;
  uv: number; // Unique visitors
  revenue?: number; // Revenue in cents
  image?: string; // Image URL (for system and location breakdowns)
  flag?: string; // Flag emoji (for location breakdowns)
  conversionRate?: number;
  goalCount?: number;
  goalConversionRate?: number;
  hostname?: string; // For path breakdowns
}

interface AnalyticsState {
  chartData: ChartDataPoint[];
  metrics: {
    visitors: string;
    revenue: string;
    conversionRate: string;
    revenuePerVisitor: string;
    bounceRate: string;
    sessionTime: string;
    visitorsNow: string;
  } | null;
  revenueBreakdown: {
    newRevenue: number;
    renewalRevenue: number;
    refundedRevenue: number;
  } | null;
  breakdowns: {
    source: {
      channel: BreakdownData[];
      referrer: BreakdownData[];
      campaign: BreakdownData[];
      keyword: BreakdownData[];
    };
    path: {
      pages: BreakdownData[];
      hostnames: BreakdownData[];
      entryPages: BreakdownData[];
    };
    location: {
      country: BreakdownData[];
      region: BreakdownData[];
      city: BreakdownData[];
    };
    system: {
      browser: BreakdownData[];
      os: BreakdownData[];
      device: BreakdownData[];
    };
  } | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
  currentWebsiteId: string | null;
  currentStartDate: string | null;
  currentEndDate: string | null;
  currentGranularity: "hourly" | "daily" | "weekly" | "monthly";
}

const initialState: AnalyticsState = {
  chartData: [],
  metrics: null,
  revenueBreakdown: null,
  breakdowns: null,
  loading: false,
  error: null,
  lastFetched: null,
  currentWebsiteId: null,
  currentStartDate: null,
  currentEndDate: null,
  currentGranularity: "daily",
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalytics: (state) => {
      state.chartData = [];
      state.metrics = null;
      state.revenueBreakdown = null;
      state.breakdowns = null;
      state.error = null;
      state.lastFetched = null;
    },
    setGranularity: (
      state,
      action: PayloadAction<"hourly" | "daily" | "weekly" | "monthly">
    ) => {
      state.currentGranularity = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.lastFetched = new Date().toISOString();
        const processedData = action.payload.processedData || [];

        state.chartData = processedData.map((item: any) => {
          return {
            date: item.name,
            fullDate: formatFullDate(item.timestamp),
            timestamp: item.timestamp,
            visitors: item.visitors ?? 0,
            revenue: (item.revenue ?? 0) + (item.renewalRevenue ?? 0), // Total revenue
            revenueNew: item.revenue ?? 0,
            revenueRenewal: item.renewalRevenue ?? 0,
            revenueRefund: item.refundedRevenue ?? 0,
            revenuePerVisitor:
              (item.visitors ?? 0) > 0
                ? ((item.revenue ?? 0) + (item.renewalRevenue ?? 0)) /
                  (item.visitors ?? 1)
                : 0,
            conversionRate: 0, // Will be calculated if needed
          };
        });

        // Store metrics from totals
        state.metrics = {
          visitors: formatNumber(action.payload.totalVisitors || 0),
          revenue: formatCurrency((action.payload.totalRevenue || 0) * 100), // Convert to cents
          conversionRate: action.payload.conversionRate
            ? `${action.payload.conversionRate.toFixed(2)}%`
            : "0%",
          revenuePerVisitor: action.payload.revenuePerVisitor
            ? formatCurrency((action.payload.revenuePerVisitor || 0) * 100)
            : "$0.00",
          bounceRate: action.payload.bounceRate
            ? `${action.payload.bounceRate.toFixed(0)}%`
            : "0%",
          sessionTime: action.payload.sessionDuration
            ? formatDuration(action.payload.sessionDuration)
            : "0m 0s",
          visitorsNow: "0", // TODO: Get from real-time if available
        };

        // Store revenue breakdown
        state.revenueBreakdown = {
          newRevenue: action.payload.totalNewRevenue || 0,
          renewalRevenue: action.payload.totalRenewalRevenue || 0,
          refundedRevenue: action.payload.totalRefundedRevenue || 0,
        };

        if (action.payload.breakdowns) {
          state.breakdowns = {
            source: {
              channel: action.payload.breakdowns.source?.channel || [],
              referrer: action.payload.breakdowns.source?.referrer || [],
              campaign: action.payload.breakdowns.source?.campaign || [],
              keyword: action.payload.breakdowns.source?.keyword || [],
            },
            path: {
              pages: action.payload.breakdowns.path?.pages || [],
              hostnames: action.payload.breakdowns.path?.hostnames || [],
              entryPages: action.payload.breakdowns.path?.entryPages || [],
            },
            location: {
              country: action.payload.breakdowns.location?.country || [],
              region: action.payload.breakdowns.location?.region || [],
              city: action.payload.breakdowns.location?.city || [],
            },
            system: {
              browser: action.payload.breakdowns.system?.browser || [],
              os: action.payload.breakdowns.system?.os || [],
              device: action.payload.breakdowns.system?.device || [],
            },
          };
        } else {
          state.breakdowns = null;
        }

        state.currentWebsiteId = action.meta.arg.websiteId;
        state.currentStartDate = null;
        state.currentEndDate = null;
        state.currentGranularity = action.meta.arg.granularity || "daily";
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000000) {
    return "$" + (dollars / 1000000).toFixed(1) + "M";
  }
  if (dollars >= 1000) {
    return "$" + (dollars / 1000).toFixed(1) + "k";
  }
  return "$" + dollars.toFixed(2);
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export const { clearAnalytics, setGranularity } = analyticsSlice.actions;
export default analyticsSlice.reducer;
