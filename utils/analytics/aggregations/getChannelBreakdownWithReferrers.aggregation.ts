import connectDB from "@/db";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import PageView from "@/db/models/PageView";
import { Types } from "mongoose";
import {
  resolveChannel,
  formatReferrerName,
  getReferrerImageUrl,
} from "@/utils/tracking/channel";
import { extractUrlParams } from "@/utils/tracking/utm";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getChannelBreakdownWithReferrers(
  websiteId: string,
  startDate: Date,
  endDate: Date
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  // Step 1: Get unique visitors per channel and referrer from Session
  const sessionsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        firstVisitAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $addFields: {
        referrerDomain: {
          $cond: {
            if: { $ne: ["$referrer", null] },
            then: {
              $let: {
                vars: {
                  noHttps: {
                    $cond: {
                      if: {
                        $eq: [{ $substr: ["$referrer", 0, 8] }, "https://"],
                      },
                      then: { $substr: ["$referrer", 8, -1] },
                      else: "$referrer",
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      noHttp: {
                        $cond: {
                          if: {
                            $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                          },
                          then: { $substr: ["$$noHttps", 7, -1] },
                          else: "$$noHttps",
                        },
                      },
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $split: ["$$noHttp", "/"],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            else: "Direct/None",
          },
        },
        channel: {
          $ifNull: ["$utmMedium", "Direct"],
        },
      },
    },
    {
      $group: {
        _id: {
          channel: "$channel",
          referrerDomain: "$referrerDomain",
          referrer: "$referrer",
          utmSource: "$utmSource",
          utmMedium: "$utmMedium",
        },
        uniqueVisitors: { $addToSet: "$visitorId" },
        sessionIds: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        channel: "$_id.channel",
        referrerDomain: "$_id.referrerDomain",
        referrer: "$_id.referrer",
        utmSource: "$_id.utmSource",
        utmMedium: "$_id.utmMedium",
        uniqueVisitors: 1,
        sessionIds: 1,
        _id: 0,
      },
    },
  ];

  const sessionsData = await Session.aggregate(sessionsPipeline);

  // Step 2: Get revenue per channel and referrer from Payment (via Session)
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
        from: "sessions",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "session",
      },
    },
    {
      $unwind: {
        path: "$session",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $addFields: {
        referrerDomain: {
          $cond: {
            if: { $ne: ["$session.referrer", null] },
            then: {
              $let: {
                vars: {
                  noHttps: {
                    $cond: {
                      if: {
                        $eq: [
                          { $substr: ["$session.referrer", 0, 8] },
                          "https://",
                        ],
                      },
                      then: { $substr: ["$session.referrer", 8, -1] },
                      else: "$session.referrer",
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      noHttp: {
                        $cond: {
                          if: {
                            $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                          },
                          then: { $substr: ["$$noHttps", 7, -1] },
                          else: "$$noHttps",
                        },
                      },
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $split: ["$$noHttp", "/"],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            else: "Direct/None",
          },
        },
        channel: {
          $ifNull: ["$session.utmMedium", "Direct"],
        },
      },
    },
    {
      $group: {
        _id: {
          channel: "$channel",
          referrerDomain: "$referrerDomain",
        },
        revenue: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
        sessionsWithPayments: { $addToSet: "$sessionId" },
        referrer: { $first: "$session.referrer" },
        utmMedium: { $first: "$session.utmMedium" },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

  // Step 3: Get goal count per channel and referrer from GoalEvent (via Session)
  const goalsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "sessions",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "session",
      },
    },
    {
      $unwind: {
        path: "$session",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $addFields: {
        referrerDomain: {
          $cond: {
            if: { $ne: ["$session.referrer", null] },
            then: {
              $let: {
                vars: {
                  noHttps: {
                    $cond: {
                      if: {
                        $eq: [
                          { $substr: ["$session.referrer", 0, 8] },
                          "https://",
                        ],
                      },
                      then: { $substr: ["$session.referrer", 8, -1] },
                      else: "$session.referrer",
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      noHttp: {
                        $cond: {
                          if: {
                            $eq: [{ $substr: ["$$noHttps", 0, 7] }, "http://"],
                          },
                          then: { $substr: ["$$noHttps", 7, -1] },
                          else: "$$noHttps",
                        },
                      },
                    },
                    in: {
                      $arrayElemAt: [
                        {
                          $split: ["$$noHttp", "/"],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            else: "Direct/None",
          },
        },
        channel: {
          $ifNull: ["$session.utmMedium", "Direct"],
        },
      },
    },
    {
      $group: {
        _id: {
          channel: "$channel",
          referrerDomain: "$referrerDomain",
        },
        goalCount: { $sum: 1 },
        uniqueVisitorsWithGoals: { $addToSet: "$visitorId" },
        referrer: { $first: "$session.referrer" },
        utmMedium: { $first: "$session.utmMedium" },
      },
    },
  ];

  const goalsData = await GoalEvent.aggregate(goalsPipeline);

  // Step 4: Combine all data and structure as channels with referrers
  // First, we need to resolve channels for revenue and goals data
  const revenueMap = new Map<string, any>();
  revenueData.forEach((item) => {
    // Resolve channel from referrer and utmMedium for revenue data
    const sessionReferrer = item.referrer || null;
    const sessionUtmMedium = item.utmMedium || null;
    const resolvedChannel = resolveChannel(sessionReferrer, sessionUtmMedium);
    const referrerDomain = item._id.referrerDomain || "Direct/None";
    const key = `${resolvedChannel}::${referrerDomain}`;

    if (!revenueMap.has(key)) {
      revenueMap.set(key, {
        revenue: 0,
        paymentCount: 0,
        sessionsWithPayments: new Set(),
      });
    }
    const rev = revenueMap.get(key);
    rev.revenue += item.revenue || 0;
    rev.paymentCount += item.paymentCount || 0;
    if (item.sessionsWithPayments) {
      item.sessionsWithPayments.forEach((sid: string) =>
        rev.sessionsWithPayments.add(sid)
      );
    }
  });

  const goalsMap = new Map<string, any>();
  goalsData.forEach((item) => {
    // Resolve channel from referrer and utmMedium for goals data
    const sessionReferrer = item.referrer || null;
    const sessionUtmMedium = item.utmMedium || null;
    const resolvedChannel = resolveChannel(sessionReferrer, sessionUtmMedium);
    const referrerDomain = item._id.referrerDomain || "Direct/None";
    const key = `${resolvedChannel}::${referrerDomain}`;

    if (!goalsMap.has(key)) {
      goalsMap.set(key, {
        goalCount: 0,
        uniqueVisitorsWithGoals: new Set(),
      });
    }
    const goal = goalsMap.get(key);
    goal.goalCount += item.goalCount || 0;
    if (item.uniqueVisitorsWithGoals) {
      item.uniqueVisitorsWithGoals.forEach((vid: string) =>
        goal.uniqueVisitorsWithGoals.add(vid)
      );
    }
  });

  // Group sessions data by channel, then by referrer
  const channelMap = new Map<string, any>();

  sessionsData.forEach((item) => {
    const channelName = resolveChannel(item.referrer, item.utmMedium);
    const referrerDomain = item.referrerDomain || "Direct/None";
    const key = `${channelName}::${referrerDomain}`;

    const revenueInfo = revenueMap.get(key);
    const goalsInfo = goalsMap.get(key);

    const uv = item.uniqueVisitors?.length || 0;
    const revenue = revenueInfo?.revenue || 0;
    const paymentCount = revenueInfo?.paymentCount || 0;
    const sessionsWithPayments = revenueInfo?.sessionsWithPayments?.size || 0;
    const conversionRate = uv > 0 ? sessionsWithPayments / uv : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    const uniqueVisitorsWithGoals =
      goalsInfo?.uniqueVisitorsWithGoals?.length || 0;
    const goalConversionRate = uv > 0 ? uniqueVisitorsWithGoals / uv : 0;

    // Extract URL parameters from referrer (we don't have path in sessions, so just use referrer)
    const urlParams = extractUrlParams(item.referrer);

    // Determine referrer name and type
    let referrerName = formatReferrerName(referrerDomain);
    let referrerType: "referrer" | "ref" = "referrer";
    let isAlternativeSource = false;
    let originalValue = referrerDomain;

    if (referrerDomain === "Direct/None" || referrerDomain === "Direct") {
      referrerName = "Direct/None";
      originalValue = "Direct/None";
    } else {
      // Check if it's an alternative source (like producthunt)
      const domainLower = referrerDomain.toLowerCase();
      if (
        domainLower.includes("producthunt") ||
        domainLower.includes("hackernews") ||
        domainLower.includes("reddit") ||
        domainLower.includes("indiehackers")
      ) {
        isAlternativeSource = true;
        referrerType = "ref";
      }
    }

    // Get referrer image
    const referrerImage = getReferrerImageUrl(referrerDomain);

    // Initialize channel if not exists
    if (!channelMap.has(channelName)) {
      channelMap.set(channelName, {
        name: channelName,
        uv: 0,
        revenue: 0,
        goalCount: 0,
        paymentCount: 0,
        conversionRate: 0,
        goalConversionRate: 0,
        image: null,
        isAlternativeSource: false,
        referrers: [],
      });
    }

    const channel = channelMap.get(channelName);

    // Add to channel totals
    channel.uv += uv;
    channel.revenue += revenue;
    channel.goalCount += goalCount;
    channel.paymentCount += paymentCount;

    // Create referrer object
    const referrerObj: any = {
      name: referrerName,
      channel: channelName,
      uv,
      image: referrerImage,
      isAlternativeSource,
      referrerType,
      originalValue,
      hasPaidMedium: false,
      paidMediumHint: null,
      revenue,
      paymentCount,
      conversionRate,
      goalCount,
      goalConversionRate,
    };

    // Add optional URL parameters if they exist
    if (urlParams.param_ref) referrerObj.param_ref = urlParams.param_ref;
    if (urlParams.param_via) referrerObj.param_via = urlParams.param_via;
    if (urlParams.utm_source) referrerObj.utm_source = urlParams.utm_source;
    if (urlParams.utm_medium) referrerObj.utm_medium = urlParams.utm_medium;

    // Also add utm_source and utm_medium from session if available
    if (item.utmSource) referrerObj.utm_source = item.utmSource;
    if (item.utmMedium) referrerObj.utm_medium = item.utmMedium;

    channel.referrers.push(referrerObj);
  });

  // Calculate channel-level metrics
  const channels = Array.from(channelMap.values()).map((channel) => {
    const totalUv = channel.uv;
    const totalSessionsWithPayments = channel.referrers.reduce(
      (sum: number, ref: any) => sum + (ref.paymentCount || 0),
      0
    );
    const totalUniqueVisitorsWithGoals = channel.referrers.reduce(
      (sum: number, ref: any) => sum + (ref.goalCount || 0),
      0
    );

    channel.conversionRate =
      totalUv > 0 ? totalSessionsWithPayments / totalUv : 0;
    channel.goalConversionRate =
      totalUv > 0 ? totalUniqueVisitorsWithGoals / totalUv : 0;

    // Get channel image (use first referrer's image or default)
    if (channel.referrers.length > 0 && channel.referrers[0].image) {
      channel.image = channel.referrers[0].image;
    }

    // Sort referrers by UV descending
    channel.referrers.sort((a: any, b: any) => b.uv - a.uv);

    return channel;
  });

  // Sort channels by UV descending
  channels.sort((a, b) => b.uv - a.uv);

  return channels;
}
