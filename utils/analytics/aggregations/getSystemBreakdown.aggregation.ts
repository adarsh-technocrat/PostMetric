import connectDB from "@/db";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import {
  getSiteCurrency,
  revenueAmountStage,
  sameSiteLookup,
} from "../revenueAmount";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";
import { getSystemImageUrl } from "@/utils/tracking/device";
import { activeSessionsMatch, lookupSessionStage } from "../pipelines";

export async function getSystemBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "browser" | "os" | "device" = "browser",
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get unique visitors and sessions per system type from Session
  // Build the group _id dynamically based on type
  let sessionsGroupId: any;

  if (type === "browser") {
    sessionsGroupId = { systemType: "$browser", visitorId: "$visitorId" };
  } else if (type === "os") {
    sessionsGroupId = { systemType: "$os", visitorId: "$visitorId" };
  } else {
    sessionsGroupId = { systemType: "$device", visitorId: "$visitorId" };
  }

  // Visitors from sessions ACTIVE in the window (consistent with the
  // overview visitors metric). No per-group sessionId arrays (16MB risk).
  const sessionsPipeline = [
    { $match: activeSessionsMatch(websiteObjectId, startDate, endDate) },
    { $group: { _id: sessionsGroupId } },
    {
      $group: {
        _id: "$_id.systemType",
        uniqueVisitors: { $sum: 1 },
      },
    },
  ];

  const sessionsData =
    await Session.aggregate(sessionsPipeline).allowDiskUse(true);

  // Step 2: Get revenue per system type from Payment (via Session)
  // Build the group _id dynamically based on type
  let revenueGroupId: any;
  let goalsGroupId: any;

  if (type === "browser") {
    revenueGroupId = "$session.browser";
    goalsGroupId = "$session.browser";
  } else if (type === "os") {
    revenueGroupId = "$session.os";
    goalsGroupId = "$session.os";
  } else {
    revenueGroupId = "$session.device";
    goalsGroupId = "$session.device";
  }

  // Net of refunds (refunds carry their payment's session), in the site
  // currency; sessions from this website only.
  const currency = await getSiteCurrency(websiteObjectId);
  const revenuePipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
        sessionId: { $nin: [null, ""] },
      },
    },
    revenueAmountStage(currency),
    sameSiteLookup("sessions", "session"),
    {
      $unwind: {
        path: "$session",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: revenueGroupId,
        revenue: { $sum: "$netRevenueAmount" },
        sessionsWithPayments: {
          $addToSet: { $cond: ["$isConversion", "$sessionId", "$$REMOVE"] },
        },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 3: Get goal count per system type from GoalEvent (via Session)
  const goalsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    lookupSessionStage(websiteObjectId),
    {
      $unwind: {
        path: "$session",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: goalsGroupId,
        goalCount: { $sum: 1 },
        uniqueVisitorsWithGoals: { $addToSet: "$visitorId" },
      },
    },
  ];

  const goalsData = await GoalEvent.aggregate(goalsPipeline);

  // Step 4: Combine all data
  const revenueMap = new Map(
    revenueData.map((item) => [item._id || "Unknown", item]),
  );
  const goalsMap = new Map(
    goalsData.map((item) => [item._id || "Unknown", item]),
  );

  const result = sessionsData.map((item) => {
    const systemName = item._id || "Unknown";
    const revenueInfo = revenueMap.get(systemName);
    const goalsInfo = goalsMap.get(systemName);

    const uv = item.uniqueVisitors || 0;
    const revenue = revenueInfo?.revenue || 0;
    const sessionsWithPayments = revenueInfo?.sessionsWithPayments?.length || 0;
    // Conversion rate: sessions with payments / unique visitors
    const conversionRate = uv > 0 ? Math.min(1, sessionsWithPayments / uv) : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    // Goal conversion rate: unique visitors with goals / unique visitors
    const goalConversionRate =
      uv > 0 ? (goalsInfo?.uniqueVisitorsWithGoals?.length || 0) / uv : 0;

    return {
      name: systemName,
      uv,
      image: getSystemImageUrl(systemName, type),
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
