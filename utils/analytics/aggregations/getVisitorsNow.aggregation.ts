import connectDB from "@/db";
import Session from "@/db/models/Session";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getVisitorsNow(websiteId: string) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const activeSessions = await Session.distinct("visitorId", {
    websiteId: websiteObjectId,
    lastSeenAt: { $gte: fiveMinutesAgo },
  });

  return activeSessions.length;
}
