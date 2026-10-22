import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";
import { COUNTABLE_PAGEVIEW_FILTER, lookupOnePageViewStage } from "../pipelines";

export async function getEntryPagesBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get first page view per session
  const entryPagesPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
        ...COUNTABLE_PAGEVIEW_FILTER,
      },
    },
    {
      $addFields: {
        cleanPath: {
          $arrayElemAt: [
            {
              $split: ["$path", "?"],
            },
            0,
          ],
        },
      },
    },
    {
      $sort: { timestamp: 1 as const },
    },
    {
      $group: {
        _id: "$sessionId",
        firstPath: { $first: "$cleanPath" },
        firstHostname: { $first: "$hostname" },
        visitorId: { $first: "$visitorId" },
      },
    },
    {
      $group: {
        _id: {
          path: "$firstPath",
          hostname: "$firstHostname",
        },
        uniqueVisitors: { $addToSet: "$visitorId" },
      },
    },
    {
      $project: {
        _id: 1,
        uniqueVisitors: { $size: "$uniqueVisitors" },
      },
    },
  ];

  const entryPagesData =
    await PageView.aggregate(entryPagesPipeline).allowDiskUse(true);

  // Step 2: Get revenue per entry page from Payment (via Session)
  // For entry pages, we need to match payments to sessions and get their first page
  const revenuePipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
        refunded: false,
      },
    },
    {
      $lookup: {
        from: "pageviews",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "pageViews",
      },
    },
    {
      $unwind: {
        path: "$pageViews",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $addFields: {
        cleanPath: {
          $arrayElemAt: [
            {
              $split: ["$pageViews.path", "?"],
            },
            0,
          ],
        },
      },
    },
    {
      $sort: { "pageViews.timestamp": 1 as const },
    },
    {
      $group: {
        _id: "$sessionId",
        firstPath: { $first: "$cleanPath" },
        firstHostname: { $first: "$pageViews.hostname" },
        revenue: { $sum: "$amount" },
      },
    },
    {
      $group: {
        _id: {
          path: "$firstPath",
          hostname: "$firstHostname",
        },
        revenue: { $sum: "$revenue" },
        sessionsWithPayments: { $addToSet: "$_id" },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 3: Goal count per entry page. Goals are grouped per session first,
  // then joined to that session's first page view only (website-scoped,
  // sorted + limited in the lookup instead of loading every page view).
  const goalsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$sessionId",
        sessionId: { $first: "$sessionId" },
        visitorId: { $first: "$visitorId" },
        goalCount: { $sum: 1 },
      },
    },
    lookupOnePageViewStage(websiteObjectId, "firstPageView", {
      direction: 1,
      project: { _id: 0, path: 1, hostname: 1 },
    }),
    {
      $unwind: {
        path: "$firstPageView",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: {
          path: {
            $arrayElemAt: [{ $split: ["$firstPageView.path", "?"] }, 0],
          },
          hostname: "$firstPageView.hostname",
        },
        goalCount: { $sum: "$goalCount" },
        uniqueVisitorsWithGoals: { $addToSet: "$visitorId" },
      },
    },
  ];

  const goalsData = await GoalEvent.aggregate(goalsPipeline);

  // Step 4: Combine all data
  const revenueMap = new Map(
    revenueData.map((item) => [
      `${item._id.path || "Unknown"}::${item._id.hostname || "Unknown"}`,
      item,
    ]),
  );
  const goalsMap = new Map(
    goalsData.map((item) => [
      `${item._id.path || "Unknown"}::${item._id.hostname || "Unknown"}`,
      item,
    ]),
  );

  const result = entryPagesData.map((item) => {
    const path = item._id.path || "Unknown";
    const hostname = item._id.hostname || "Unknown";
    const key = `${path}::${hostname}`;

    const revenueInfo = revenueMap.get(key);
    const goalsInfo = goalsMap.get(key);

    const uv = item.uniqueVisitors || 0;
    const revenue = revenueInfo?.revenue || 0;
    const sessionsWithPayments = revenueInfo?.sessionsWithPayments?.length || 0;
    const conversionRate = uv > 0 ? sessionsWithPayments / uv : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    const goalConversionRate =
      uv > 0 ? (goalsInfo?.uniqueVisitorsWithGoals?.length || 0) / uv : 0;

    return {
      name: path,
      hostname,
      uv,
      revenue,
      conversionRate,
      goalCount,
      goalConversionRate,
    };
  });

  // Sort by unique visitors descending
  result.sort((a, b) => b.uv - a.uv);

  return result;
}
