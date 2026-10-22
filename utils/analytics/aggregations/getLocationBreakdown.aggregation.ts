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
import {
  getCountryNameFromCode,
  getFlagEmoji,
  getLocationImageUrlFromCode,
} from "@/utils/tracking/geolocation";
import { activeSessionsMatch, lookupSessionStage } from "../pipelines";

export async function getLocationBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  type: "country" | "region" | "city" = "country",
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  let sessionsGroupId: any;

  if (type === "country") {
    sessionsGroupId = { systemType: "$country", visitorId: "$visitorId" };
  } else if (type === "region") {
    sessionsGroupId = {
      systemType: "$region",
      country: "$country",
      visitorId: "$visitorId",
    };
  } else {
    sessionsGroupId = {
      systemType: "$city",
      country: "$country",
      visitorId: "$visitorId",
    };
  }

  // Visitors from sessions ACTIVE in the window (consistent with the
  // overview visitors metric). No per-group sessionId arrays (16MB risk).
  const sessionsPipeline = [
    { $match: activeSessionsMatch(websiteObjectId, startDate, endDate) },
    { $group: { _id: sessionsGroupId } },
    {
      $group: {
        _id: {
          systemType: "$_id.systemType",
          country:
            type === "country"
              ? "$_id.systemType"
              : { $ifNull: ["$_id.country", ""] },
        },
        uniqueVisitors: { $sum: 1 },
      },
    },
  ];

  const sessionsData =
    await Session.aggregate(sessionsPipeline).allowDiskUse(true);

  // Step 2: Get revenue per location type from Payment (via Session)
  let revenueGroupId: any;
  let goalsGroupId: any;

  if (type === "country") {
    revenueGroupId = "$session.country";
    goalsGroupId = "$session.country";
  } else if (type === "region") {
    revenueGroupId = "$session.region";
    // Region/city names are not unique across countries.
    goalsGroupId = {
      systemType: "$session.region",
      country: { $ifNull: ["$session.country", ""] },
    };
  } else {
    revenueGroupId = "$session.city";
    goalsGroupId = {
      systemType: "$session.city",
      country: { $ifNull: ["$session.country", ""] },
    };
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

  // Step 3: Get goal count per location type from GoalEvent (via Session)
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
  const goalKey = (code: unknown, country: unknown) =>
    type === "country"
      ? String(code || "Unknown")
      : `${code || "Unknown"}::${country || ""}`;
  const goalsMap = new Map(
    goalsData.map((item) => [
      type === "country"
        ? goalKey(item._id, null)
        : goalKey(item._id?.systemType, item._id?.country),
      item,
    ]),
  );

  const result = sessionsData.map((item) => {
    const locationId = item._id || {};
    const locationCode =
      typeof locationId === "string"
        ? locationId
        : locationId.systemType || "Unknown";
    const countryCode =
      typeof locationId === "string" ? locationId : locationId.country || "";

    const revenueInfo = revenueMap.get(locationCode);
    const goalsInfo = goalsMap.get(goalKey(locationCode, countryCode));

    const uv = item.uniqueVisitors || 0;
    const revenue = revenueInfo?.revenue || 0;
    const sessionsWithPayments = revenueInfo?.sessionsWithPayments?.length || 0;
    // Conversion rate: sessions with payments / unique visitors
    const conversionRate = uv > 0 ? Math.min(1, sessionsWithPayments / uv) : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    // Goal conversion rate: unique visitors with goals / unique visitors
    const goalConversionRate =
      uv > 0 ? (goalsInfo?.uniqueVisitorsWithGoals?.length || 0) / uv : 0;

    // For countries, convert code to full name and get flag emoji
    // For regions and cities, use the country code to get the flag
    let displayName = locationCode;
    let flag = "";
    let flagCountryCode = countryCode;

    if (type === "country") {
      displayName = getCountryNameFromCode(locationCode);
      flagCountryCode = locationCode;
      flag = getFlagEmoji(locationCode);
    } else if (countryCode) {
      // For regions and cities, show the country flag
      flag = getFlagEmoji(countryCode);
    }

    return {
      name: displayName,
      uv,
      flag: flag || undefined,
      image:
        type === "country"
          ? getLocationImageUrlFromCode(locationCode, type)
          : flagCountryCode
            ? getLocationImageUrlFromCode(flagCountryCode, "country")
            : "",
      revenue,
      conversionRate,
      goalCount,
      goalConversionRate,
      countryCode:
        type === "country" ? locationCode : flagCountryCode || undefined,
    };
  });

  result.sort((a, b) => b.uv - a.uv);

  return result;
}
