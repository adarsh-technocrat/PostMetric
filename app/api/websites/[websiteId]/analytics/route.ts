import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";
import { getVisitorsOverTime } from "@/utils/analytics/aggregations/getVisitorsOverTime.aggregation";
import { getRevenueOverTime } from "@/utils/analytics/aggregations/getRevenueOverTime.aggregation";
import {
  getCustomersAndSalesOverTime,
  getCustomersAndSalesTotals,
} from "@/utils/analytics/aggregations/getCustomersAndSalesOverTime.aggregation";
import {
  getGoalsOverTime,
  getGoalConvertedVisitors,
} from "@/utils/analytics/aggregations/getGoalsOverTime.aggregation";
import { getMetrics } from "@/utils/analytics/aggregations/getMetrics.aggregation";
import type { Granularity } from "@/utils/analytics/types";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isDemoWebsite } from "@/lib/demo-website";
import {
  addLocalDays,
  localYMD,
  resolvePeriodRange,
  zonedStartOfDay,
} from "@/lib/date-time-conversion";
import { bucketKeyForDate, getBucketKeys } from "@/utils/analytics/pipelines";
import { type TimeZone } from "timezones-list";

const CENTS_TO_DOLLARS = 1 / 100;

function formatBucketLabel(
  date: Date,
  granularity: Granularity,
  timezone: string,
): string {
  const currentYear = parseInt(
    formatInTimeZone(new Date(), timezone, "yyyy"),
    10,
  );
  const yearInTz = parseInt(formatInTimeZone(date, timezone, "yyyy"), 10);
  const showYear = yearInTz !== currentYear;
  switch (granularity) {
    case "hourly":
      return formatInTimeZone(date, timezone, "h:mm a");
    case "daily":
      return formatInTimeZone(
        date,
        timezone,
        showYear ? "MMM d, yyyy" : "MMM d",
      );
    case "weekly": {
      // Label = local Sunday ending the ISO week (Monday + 6 local days).
      const weekEnd = addLocalDays(localYMD(date, timezone), 6);
      return formatInTimeZone(
        zonedStartOfDay(weekEnd, timezone),
        timezone,
        "dd MMM",
      );
    }
    case "monthly":
      return formatInTimeZone(date, timezone, "MMM yyyy");
    default:
      return formatInTimeZone(date, timezone, "MMM d");
  }
}

type BucketRow = {
  visitors: number;
  revenue: number;
  renewalRevenue: number;
  refundedRevenue: number;
  customers: number;
  sales: number;
  goal: number;
};

function mergeTimeSeries(
  visitors: { key: string; visitors: number }[],
  revenue: {
    date: Date;
    revenueNew: number;
    renewalRevenue: number;
    revenueRefund: number;
  }[],
  customersSales: { date: Date; customers: number; sales: number }[],
  goals: { key: string; goalCount: number }[],
  timezone: string,
  granularity: Granularity,
  startDate: Date,
  endDate: Date,
): {
  name: string;
  timestamp: string;
  key: string;
  visitors: number | null;
  revenue: number | null;
  renewalRevenue: number | null;
  refundedRevenue: number | null;
  customers: number | null;
  sales: number | null;
  goal: number | null;
}[] {
  const now = new Date();
  const byKey = new Map<string, BucketRow>();

  const row = (key: string) => {
    let r = byKey.get(key);
    if (!r) {
      r = {
        visitors: 0,
        revenue: 0,
        renewalRevenue: 0,
        refundedRevenue: 0,
        customers: 0,
        sales: 0,
        goal: 0,
      };
      byKey.set(key, r);
    }
    return r;
  };
  // Revenue/customer series come back as $dateTrunc instants (local bucket
  // starts); map them onto the same local bucket keys. Sum (not overwrite)
  // so a repeated DST hour folds into its single local key.
  const keyOf = (d: Date | string) =>
    bucketKeyForDate(new Date(d), granularity, timezone);

  visitors.forEach((r) => {
    row(r.key).visitors += r.visitors;
  });
  revenue.forEach((r) => {
    const b = row(keyOf(r.date));
    b.revenue += r.revenueNew;
    b.renewalRevenue += r.renewalRevenue;
    b.refundedRevenue += r.revenueRefund;
  });
  customersSales.forEach((r) => {
    const b = row(keyOf(r.date));
    b.customers += r.customers;
    b.sales += r.sales;
  });
  goals.forEach((r) => {
    row(r.key).goal += r.goalCount;
  });

  return getBucketKeys(startDate, endDate, granularity, timezone).map(
    ({ key, date }) => {
      const isFuture = date > now;
      const r = byKey.get(key);
      const v = (n: number | undefined, scale = 1) =>
        isFuture ? null : (n ?? 0) * scale;
      return {
        name: formatBucketLabel(date, granularity, timezone),
        timestamp: formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        key,
        visitors: v(r?.visitors),
        revenue: v(r?.revenue, CENTS_TO_DOLLARS),
        renewalRevenue: v(r?.renewalRevenue, CENTS_TO_DOLLARS),
        refundedRevenue: v(r?.refundedRevenue, CENTS_TO_DOLLARS),
        customers: v(r?.customers),
        sales: v(r?.sales),
        goal: v(r?.goal),
      };
    },
  );
}

/** % change rounded to 1 decimal; null when there is no baseline. */
function computePercentageChange(
  current: number,
  previous: number,
): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null;
  if (!Number.isFinite(current)) return null;
  const pct = ((current - previous) / previous) * 100;
  return Math.round(pct * 10) / 10;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const isDemo = isDemoWebsite(websiteId);
    const userId = await getUserId();
    if (!isDemo) {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (website.userId.toString() !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "today").toString();
    const rawGranularity = (
      searchParams.get("granularity") || "daily"
    ).toLowerCase();
    const granularity: Granularity = (
      ["hourly", "daily", "weekly", "monthly"] as const
    ).includes(rawGranularity as Granularity)
      ? (rawGranularity as Granularity)
      : "daily";
    const timezone =
      (website.settings?.timezone as TimeZone["tzCode"]) || "UTC";
    const currency = website.settings?.currency ?? "USD";

    const range = resolvePeriodRange(period, timezone, {
      offset: searchParams.get("offset"),
    });
    const { startDate, endDate } = range;
    const prevStart = range.previousStartDate;
    const prevEnd = range.previousEndDate;

    const [
      metrics,
      prevMetrics,
      visitorsOverTime,
      revenueOverTime,
      customersSalesOverTime,
      goalsOverTime,
      goalVisitors,
      customersSalesTotals,
    ] = await Promise.all([
      getMetrics(websiteId, startDate, endDate),
      getMetrics(websiteId, prevStart, prevEnd),
      getVisitorsOverTime(websiteId, startDate, endDate, granularity, timezone),
      getRevenueOverTime(websiteId, startDate, endDate, granularity, timezone),
      getCustomersAndSalesOverTime(
        websiteId,
        startDate,
        endDate,
        granularity,
        timezone,
      ),
      getGoalsOverTime(websiteId, startDate, endDate, granularity, timezone),
      getGoalConvertedVisitors(websiteId, startDate, endDate),
      getCustomersAndSalesTotals(websiteId, startDate, endDate),
    ]);

    const revenueSums = revenueOverTime.reduce(
      (acc, r) => ({
        newRevenue: acc.newRevenue + r.revenueNew,
        renewalRevenue: acc.renewalRevenue + r.renewalRevenue,
        refundedRevenue: acc.refundedRevenue + r.revenueRefund,
      }),
      { newRevenue: 0, renewalRevenue: 0, refundedRevenue: 0 },
    );

    const totalGoal = goalsOverTime.reduce((sum, r) => sum + r.goalCount, 0);
    // Unique over the whole period; summing buckets counts a returning
    // customer once per bucket.
    const totalCustomers = customersSalesTotals.customers;
    const totalSales = customersSalesTotals.sales;

    const processedData = mergeTimeSeries(
      visitorsOverTime,
      revenueOverTime,
      customersSalesOverTime,
      goalsOverTime,
      timezone,
      granularity,
      startDate,
      endDate,
    );

    // Goal conversion: unique visitors with >= 1 goal / unique visitors (%).
    const goalConversionRate =
      metrics.visitors > 0 ? (goalVisitors / metrics.visitors) * 100 : null;

    const percentageChange = {
      visitors: computePercentageChange(metrics.visitors, prevMetrics.visitors),
      sessions: computePercentageChange(metrics.sessions, prevMetrics.sessions),
      pageViews: computePercentageChange(
        metrics.pageViews,
        prevMetrics.pageViews,
      ),
      bounceRate: computePercentageChange(
        metrics.bounceRate,
        prevMetrics.bounceRate,
      ),
      sessionDuration: computePercentageChange(
        metrics.sessionTime,
        prevMetrics.sessionTime,
      ),
      conversionRate: computePercentageChange(
        metrics.conversionRate,
        prevMetrics.conversionRate,
      ),
      revenue: computePercentageChange(metrics.revenue, prevMetrics.revenue),
      revenuePerVisitor: computePercentageChange(
        metrics.revenuePerVisitor,
        prevMetrics.revenuePerVisitor,
      ),
    };

    const totalRevenueDollars = metrics.revenue * CENTS_TO_DOLLARS;
    const totalNewRevenueDollars = revenueSums.newRevenue * CENTS_TO_DOLLARS;
    const totalRenewalRevenueDollars =
      revenueSums.renewalRevenue * CENTS_TO_DOLLARS;
    const totalRefundedRevenueDollars =
      revenueSums.refundedRevenue * CENTS_TO_DOLLARS;

    const response = {
      processedData,
      totalVisitors: metrics.visitors,
      totalSessions: metrics.sessions,
      totalPageViews: metrics.pageViews,
      totalCustomers,
      totalSales,
      totalRevenue: totalRevenueDollars,
      totalNewRevenue: totalNewRevenueDollars,
      totalRenewalRevenue: totalRenewalRevenueDollars,
      totalRefundedRevenue: totalRefundedRevenueDollars,
      totalGoal,
      revenuePerVisitor: metrics.revenuePerVisitor * CENTS_TO_DOLLARS,
      conversionRate: metrics.conversionRate,
      goalConversionRate,
      goalVisitors,
      bounceRate: metrics.bounceRate,
      sessionDuration: metrics.sessionTime,
      currency,
      percentageChange,
      range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        timezone,
      },
      previousRange: {
        start: prevStart.toISOString(),
        end: prevEnd.toISOString(),
        timezone,
      },
      includeRenewalRevenue: true,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
