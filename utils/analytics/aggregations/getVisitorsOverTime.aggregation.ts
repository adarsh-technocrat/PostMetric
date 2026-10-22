import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import {
  COUNTABLE_PAGEVIEW_FILTER,
  bucketKeyExpr,
  bucketKeyToDate,
} from "../pipelines";

/**
 * Unique visitors per time bucket. Buckets are keyed by the local
 * (website-timezone) bucket key, see `bucketKeyExpr`.
 */
export async function getVisitorsOverTime(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  granularity: Granularity = "daily",
  timezone?: string,
): Promise<{ key: string; date: Date; visitors: number }[]> {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const tz = timezone || "UTC";

  const pipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
        ...COUNTABLE_PAGEVIEW_FILTER,
      },
    },
    {
      $group: {
        _id: {
          bucket: bucketKeyExpr(granularity, tz),
          visitorId: "$visitorId",
        },
      },
    },
    { $group: { _id: "$_id.bucket", count: { $sum: 1 } } },
    { $sort: { _id: 1 as const } },
  ];

  const results = await PageView.aggregate(pipeline).allowDiskUse(true);
  return results.map((r) => ({
    key: r._id as string,
    date: bucketKeyToDate(r._id, tz),
    visitors: r.count as number,
  }));
}
