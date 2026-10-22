import connectDB from "@/db";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { bucketKeyExpr, bucketKeyToDate } from "../pipelines";

/** Goal events per time bucket (local website-timezone bucket keys). */
export async function getGoalsOverTime(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  granularity: Granularity = "daily",
  timezone?: string,
): Promise<{ key: string; date: Date; goalCount: number }[]> {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const tz = timezone || "UTC";

  const pipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: bucketKeyExpr(granularity, tz),
        goalCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 as const } },
  ];

  const results = await GoalEvent.aggregate(pipeline);
  return results.map((r) => ({
    key: r._id as string,
    date: bucketKeyToDate(r._id, tz),
    goalCount: r.goalCount as number,
  }));
}

/**
 * Number of unique visitors with at least one goal event in the window
 * (numerator of the overview goal conversion rate).
 */
export async function getGoalConvertedVisitors(
  websiteId: string,
  startDate: Date,
  endDate: Date,
): Promise<number> {
  await connectDB();
  const res = await GoalEvent.aggregate([
    {
      $match: {
        websiteId: new Types.ObjectId(websiteId),
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    { $group: { _id: "$visitorId" } },
    { $count: "count" },
  ]);
  return res[0]?.count ?? 0;
}
