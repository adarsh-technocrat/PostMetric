import connectDB from "@/db";
import Session from "@/db/models/Session";
import PageView from "@/db/models/PageView";
import { Types } from "mongoose";
import { COUNTABLE_PAGEVIEW_FILTER } from "../pipelines";

/**
 * Visitors active in the last 5 minutes: sessions whose `lastSeenAt` is
 * recent OR that recorded a page view recently (covers ingestion paths that
 * don't bump `lastSeenAt`). Both queries hit `{websiteId, lastSeenAt}` /
 * `{websiteId, timestamp}` indexes and only scan the last 5 minutes.
 */
export async function getVisitorsNow(websiteId: string) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [fromSessions, fromPageViews] = await Promise.all([
    Session.distinct("visitorId", {
      websiteId: websiteObjectId,
      lastSeenAt: { $gte: fiveMinutesAgo },
    }),
    PageView.distinct("visitorId", {
      websiteId: websiteObjectId,
      timestamp: { $gte: fiveMinutesAgo },
      ...COUNTABLE_PAGEVIEW_FILTER,
    }),
  ]);

  return new Set<string>([
    ...(fromSessions as string[]),
    ...(fromPageViews as string[]),
  ]).size;
}
