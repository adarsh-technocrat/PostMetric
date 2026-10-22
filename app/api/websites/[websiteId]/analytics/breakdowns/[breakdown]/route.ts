import { NextRequest, NextResponse } from "next/server";
import { getWebsiteById } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isDemoWebsite } from "@/lib/demo-website";
import { resolvePeriodRange } from "@/lib/date-time-conversion";
import { getSourceBreakdown } from "@/utils/analytics/aggregations/getSourceBreakdown.aggregation";
import { getReferrersBreakdown } from "@/utils/analytics/aggregations/getReferrersBreakdown.aggregation";
import { getCampaignBreakdown } from "@/utils/analytics/aggregations/getCampaignBreakdown.aggregation";
import { getChannelBreakdownWithReferrers } from "@/utils/analytics/aggregations/getChannelBreakdownWithReferrers.aggregation";
import { getPagesBreakdown } from "@/utils/analytics/aggregations/getPagesBreakdown.aggregation";
import { getHostnamesBreakdown } from "@/utils/analytics/aggregations/getHostnamesBreakdown.aggregation";
import { getEntryPagesBreakdown } from "@/utils/analytics/aggregations/getEntryPagesBreakdown.aggregation";
import { getExitLinksBreakdown } from "@/utils/analytics/aggregations/getExitLinksBreakdown.aggregation";
import { getLocationBreakdown } from "@/utils/analytics/aggregations/getLocationBreakdown.aggregation";
import { getSystemBreakdown } from "@/utils/analytics/aggregations/getSystemBreakdown.aggregation";
import { getGoalsBreakdown } from "@/utils/analytics/aggregations/getGoalsBreakdown.aggregation";
import {
  BREAKDOWN_KEYS,
  isBreakdownKey,
} from "@/lib/constants/analytics-breakdowns";
import { TimeZone } from "timezones-list";

// Served here rather than listed in BREAKDOWN_KEYS, which the client uses to
// lay out its breakdown cards.
const GOALS_BREAKDOWN = "goals";

/**
 * Payments are stored ×100; every breakdown reports `revenue` in major units
 * like the overview. The channels breakdown already converts.
 */
function revenueInMajorUnits(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(revenueInMajorUnits);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, v]) => [
        key,
        key === "revenue" && typeof v === "number"
          ? v / 100
          : revenueInMajorUnits(v),
      ]),
    );
  }
  return value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string; breakdown: string }> },
) {
  try {
    const { websiteId, breakdown } = await params;

    if (breakdown !== GOALS_BREAKDOWN && !isBreakdownKey(breakdown)) {
      return NextResponse.json(
        {
          error: "Invalid breakdown",
          validBreakdowns: BREAKDOWN_KEYS,
        },
        { status: 400 },
      );
    }

    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const isDemo = isDemoWebsite(websiteId);
    if (!isDemo) {
      const userId = await getUserId();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (website.userId.toString() !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const periodParam = searchParams.get("period");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const timezone: string =
      (website.settings?.timezone as TimeZone["tzCode"]) || "UTC";

    let startDate: Date;
    let endDate: Date;

    // `period` (preset or custom:YYYY-MM-DD:YYYY-MM-DD in the website
    // timezone, plus optional `offset`) is authoritative. Raw ISO
    // startDate/endDate are only a legacy fallback when no period is sent.
    const legacyStart = startDateStr ? new Date(startDateStr) : null;
    const legacyEnd = endDateStr ? new Date(endDateStr) : null;
    if (
      !periodParam &&
      legacyStart &&
      legacyEnd &&
      !isNaN(legacyStart.getTime()) &&
      !isNaN(legacyEnd.getTime())
    ) {
      startDate = legacyStart;
      endDate = legacyEnd;
    } else {
      const range = resolvePeriodRange(periodParam || "today", timezone, {
        offset: searchParams.get("offset"),
      });
      startDate = range.startDate;
      endDate = range.endDate;
    }

    let data: unknown;

    switch (breakdown) {
      case GOALS_BREAKDOWN:
        data = await getGoalsBreakdown(websiteId, startDate, endDate);
        break;
      case "source-channel":
        data = await getSourceBreakdown(
          websiteId,
          startDate,
          endDate,
          "channel",
        );
        break;
      case "source-referrer":
        data = await getReferrersBreakdown(websiteId, startDate, endDate);
        break;
      case "source-campaign":
        data = await getCampaignBreakdown(websiteId, startDate, endDate);
        break;
      case "source-keyword":
        data = await getSourceBreakdown(
          websiteId,
          startDate,
          endDate,
          "keyword",
        );
        break;
      case "source-channels":
        data = await getChannelBreakdownWithReferrers(
          websiteId,
          startDate,
          endDate,
        );
        break;
      case "path-pages":
        data = await getPagesBreakdown(websiteId, startDate, endDate);
        break;
      case "path-hostnames":
        data = await getHostnamesBreakdown(websiteId, startDate, endDate);
        break;
      case "path-entry-pages":
        data = await getEntryPagesBreakdown(websiteId, startDate, endDate);
        break;
      case "path-exit-links":
        data = await getExitLinksBreakdown(websiteId, startDate, endDate);
        break;
      case "location-country":
        data = await getLocationBreakdown(
          websiteId,
          startDate,
          endDate,
          "country",
        );
        break;
      case "location-region":
        data = await getLocationBreakdown(
          websiteId,
          startDate,
          endDate,
          "region",
        );
        break;
      case "location-city":
        data = await getLocationBreakdown(
          websiteId,
          startDate,
          endDate,
          "city",
        );
        break;
      case "system-browser":
        data = await getSystemBreakdown(
          websiteId,
          startDate,
          endDate,
          "browser",
        );
        break;
      case "system-os":
        data = await getSystemBreakdown(websiteId, startDate, endDate, "os");
        break;
      case "system-device":
        data = await getSystemBreakdown(
          websiteId,
          startDate,
          endDate,
          "device",
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid breakdown" },
          { status: 400 },
        );
    }

    return NextResponse.json(
      {
        breakdown,
        startDate,
        endDate,
        timezone,
        range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          timezone,
        },
        data:
          breakdown === "source-channels" ? data : revenueInMajorUnits(data),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch breakdown" },
      { status: 500 },
    );
  }
}
