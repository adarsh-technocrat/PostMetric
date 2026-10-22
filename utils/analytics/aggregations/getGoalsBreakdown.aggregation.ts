import connectDB from "@/db";
import GoalEvent from "@/db/models/GoalEvent";
import PageView from "@/db/models/PageView";
import { Types } from "mongoose";
import { COUNTABLE_PAGEVIEW_FILTER } from "../pipelines";

/**
 * Per-goal stats for the period: completions, unique converting visitors and
 * the share of the period's visitors who converted (0-100).
 */
export async function getGoalsBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const timestamp = { $gte: startDate, $lte: endDate };

  const [goals, visitors] = await Promise.all([
    GoalEvent.aggregate([
      { $match: { websiteId: websiteObjectId, timestamp } },
      {
        $group: {
          _id: "$goalId",
          completions: { $sum: 1 },
          // Events from before goals carried visitor ids were stored as
          // "unknown"; they count as completions but not as converters.
          converters: {
            $addToSet: {
              $cond: [
                { $in: ["$visitorId", [null, "", "unknown"]] },
                "$$REMOVE",
                "$visitorId",
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "goals",
          localField: "_id",
          foreignField: "_id",
          as: "goal",
        },
      },
      {
        $project: {
          _id: 0,
          goalId: "$_id",
          name: {
            $ifNull: [
              { $first: "$goal.name" },
              { $ifNull: [{ $first: "$goal.event" }, "Unknown"] },
            ],
          },
          event: { $first: "$goal.event" },
          completions: 1,
          uniqueConverters: { $size: "$converters" },
        },
      },
      { $sort: { completions: -1 } },
    ]),
    PageView.aggregate([
      {
        $match: {
          websiteId: websiteObjectId,
          timestamp,
          ...COUNTABLE_PAGEVIEW_FILTER,
        },
      },
      { $group: { _id: "$visitorId" } },
      { $count: "count" },
    ]),
  ]);

  const visitorCount = visitors[0]?.count ?? 0;
  return goals.map((goal) => ({
    ...goal,
    conversionRate:
      visitorCount > 0
        ? Math.min(100, (goal.uniqueConverters / visitorCount) * 100)
        : null,
  }));
}
