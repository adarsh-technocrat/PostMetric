import { NextRequest, NextResponse } from "next/server";
import { trackGoalEvent } from "@/utils/database/goal";

/**
 * Track a goal event
 * This endpoint is called by the tracking script
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trackingCode = searchParams.get("site");
    const event = searchParams.get("event");
    const value = searchParams.get("value");

    if (!trackingCode || !event) {
      return new NextResponse(null, { status: 204 });
    }

    // Get website by tracking code
    const { getWebsiteByTrackingCode } = await import(
      "@/utils/database/website"
    );
    const website = await getWebsiteByTrackingCode(trackingCode);

    if (!website) {
      return new NextResponse(null, { status: 204 });
    }

    // Get visitor/session from cookies
    const cookieHeader = request.headers.get("cookie");
    const visitorId =
      cookieHeader
        ?.split(";")
        .find((c) => c.trim().startsWith("_df_vid="))
        ?.split("=")[1] || undefined;
    const sessionId =
      cookieHeader
        ?.split(";")
        .find((c) => c.trim().startsWith("_df_sid="))
        ?.split("=")[1] || undefined;

    // Track the goal event
    await trackGoalEvent({
      websiteId: website._id.toString(),
      event,
      sessionId,
      visitorId,
      path: searchParams.get("path") || "/",
      value: value ? parseFloat(value) : undefined,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error tracking goal:", error);
    return new NextResponse(null, { status: 204 }); // Don't break client sites
  }
}
