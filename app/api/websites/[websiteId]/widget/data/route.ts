import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { getVisitorsNow } from "@/utils/analytics/aggregations/getVisitorsNow.aggregation";
import { getVisitorsOverTime } from "@/utils/analytics/aggregations/getVisitorsOverTime.aggregation";
import { getLocationBreakdown } from "@/utils/analytics/aggregations/getLocationBreakdown.aggregation";
import { subDays, subHours, eachHourOfInterval, format } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  try {
    const { websiteId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const shareId = searchParams.get("shareId");
    const type = searchParams.get("type") || "visitors-now";

    await connectDB();

    const website = await Website.findById(websiteId);

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (
      !website.settings?.publicDashboard?.enabled ||
      website.settings.publicDashboard.shareId !== shareId
    ) {
      return NextResponse.json(
        { error: "Widget not available" },
        { status: 403 },
      );
    }

    const timezone = (website.settings?.timezone as string) || "UTC";

    if (type === "visitors-over-time") {
      const endDate = new Date();
      const startDate = subDays(endDate, 7);
      const data = await getVisitorsOverTime(
        websiteId,
        startDate,
        endDate,
        "daily",
        timezone,
      );
      return NextResponse.json({
        data: data.map((d) => ({
          date: d.date,
          visitors: d.visitors,
        })),
      });
    }

    if (type === "visitors-by-country") {
      const endDate = new Date();
      const startDate = subDays(endDate, 7);
      const breakdown = await getLocationBreakdown(
        websiteId,
        startDate,
        endDate,
        "country",
      );
      const data = breakdown.slice(0, 5).map((b) => ({
        country: b.name || "Unknown",
        flag: b.flag,
        visitors: b.uv,
      }));
      return NextResponse.json({ data });
    }

    if (type === "visitors-last-30-min") {
      const endDate = new Date();
      const startDate = subHours(endDate, 6);
      const rawData = await getVisitorsOverTime(
        websiteId,
        startDate,
        endDate,
        "hourly",
        timezone,
      );
      const byHour = new Map<string, number>();
      for (const d of rawData) {
        const dt = typeof d.date === "string" ? new Date(d.date) : d.date;
        byHour.set(format(dt, "yyyy-MM-dd'T'HH"), d.visitors);
      }
      const hours = eachHourOfInterval({ start: startDate, end: endDate });
      const data = hours.map((h) => ({
        date: h.toISOString(),
        visitors: byHour.get(format(h, "yyyy-MM-dd'T'HH")) ?? 0,
      }));
      const visitorsNow = await getVisitorsNow(websiteId);
      return NextResponse.json({
        visitorsNow,
        data,
      });
    }

    const visitorsNow = await getVisitorsNow(websiteId);
    return NextResponse.json({ visitorsNow });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch widget data" },
      { status: 500 },
    );
  }
}
