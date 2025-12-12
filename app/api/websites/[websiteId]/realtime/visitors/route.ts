import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import Session from "@/db/models/Session";
import PageView from "@/db/models/PageView";
import { Types } from "mongoose";

interface VisitorLocation {
  visitorId: string;
  sessionId: string;
  country: string;
  region?: string;
  city?: string;
  device: string;
  browser: string;
  os: string;
  referrer?: string;
  referrerDomain?: string;
  currentPath?: string;
  lastSeenAt: string;
  pageViews: number;
  duration: number;
  conversionScore?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Verify user owns this website
    const website = await Website.findOne({
      _id: websiteId,
      userId: session.user.id,
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Get active sessions (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const websiteObjectId = new Types.ObjectId(websiteId);

    const activeSessions = await Session.find({
      websiteId: websiteObjectId,
      lastSeenAt: { $gte: fiveMinutesAgo },
    })
      .sort({ lastSeenAt: -1 })
      .limit(100);

    // Get latest page view for each session to get current path
    const sessionIds = activeSessions.map((s) => s.sessionId);
    const latestPageViews = await PageView.aggregate([
      {
        $match: {
          websiteId: websiteObjectId,
          sessionId: { $in: sessionIds },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$sessionId",
          path: { $first: "$path" },
          timestamp: { $first: "$timestamp" },
        },
      },
    ]);

    const pathMap = new Map(latestPageViews.map((pv) => [pv._id, pv.path]));

    // Format visitor data
    const visitors: VisitorLocation[] = activeSessions.map((session) => {
      // Generate a simple conversion score based on page views and duration
      const conversionScore = Math.min(
        100,
        Math.round(
          (session.pageViews * 10 + Math.min(session.duration / 60, 30) * 2) / 2
        )
      );

      return {
        visitorId: session.visitorId,
        sessionId: session.sessionId,
        country: session.country,
        region: session.region,
        city: session.city,
        device: session.device,
        browser: session.browser,
        os: session.os,
        referrer: session.referrer,
        referrerDomain: session.referrerDomain,
        currentPath: pathMap.get(session.sessionId) || "/",
        lastSeenAt: session.lastSeenAt.toISOString(),
        pageViews: session.pageViews,
        duration: session.duration,
        conversionScore,
      };
    });

    return NextResponse.json({ visitors });
  } catch (error: any) {
    console.error("Error fetching real-time visitors:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch visitors" },
      { status: 500 }
    );
  }
}
