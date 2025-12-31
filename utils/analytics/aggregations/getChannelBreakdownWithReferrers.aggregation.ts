import connectDB from "@/db";
import Session from "@/db/models/Session";
import Payment from "@/db/models/Payment";
import GoalEvent from "@/db/models/GoalEvent";
import { Types } from "mongoose";
import {
  resolveChannel,
  formatReferrerName,
  getReferrerImageUrl,
} from "@/utils/tracking/channel";

export async function getChannelBreakdownWithReferrers(
  websiteId: string,
  startDate: Date,
  endDate: Date
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  const sessionsPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        firstVisitAt: { $gte: startDate, $lte: endDate },
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
      $addFields: {
        firstPageView: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: "$pageViews",
                sortBy: { timestamp: 1 },
              },
            },
            0,
          ],
        },
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
            else: "direct",
          },
        },
        channel: {
          $ifNull: ["$utmMedium", "direct"],
        },
      },
    },
    {
      $project: {
        sessionId: "$_id",
        visitorId: 1,
        referrer: 1,
        referrerDomain: 1,
        channel: 1,
        utmSource: 1,
        utmMedium: 1,
        firstPageViewPath: "$firstPageView.path",
      },
    },
  ];

  const sessionsDataRaw = await Session.aggregate(sessionsPipeline);

  const sessionsData = sessionsDataRaw.map((session) => {
    let pathParamRef: string | null = null;
    let pathParamVia: string | null = null;

    if (session.firstPageViewPath) {
      try {
        let pathToParse = session.firstPageViewPath;
        if (!pathToParse.startsWith("http")) {
          if (!pathToParse.startsWith("/")) {
            pathToParse = `/${pathToParse}`;
          }
          pathToParse = `https://example.com${pathToParse}`;
        }
        const urlObj = new URL(pathToParse);
        pathParamRef =
          urlObj.searchParams.get("ref") ||
          urlObj.searchParams.get("param_ref") ||
          null;
        pathParamVia =
          urlObj.searchParams.get("via") ||
          urlObj.searchParams.get("param_via") ||
          null;
      } catch (error) {
        console.warn(
          `[getChannelBreakdownWithReferrers] Failed to parse path: ${session.firstPageViewPath}`,
          error
        );
      }
    }

    return {
      ...session,
      pathParamRef,
      pathParamVia,
    };
  });

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
      $lookup: {
        from: "pageviews",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "pageViews",
      },
    },
    {
      $addFields: {
        firstPageView: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: "$pageViews",
                sortBy: { timestamp: 1 },
              },
            },
            0,
          ],
        },
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
            else: "direct",
          },
        },
        channel: {
          $ifNull: ["$session.utmMedium", "direct"],
        },
      },
    },
    {
      $group: {
        _id: "$sessionId",
        sessionId: { $first: "$sessionId" },
        referrer: { $first: "$session.referrer" },
        referrerDomain: { $first: "$referrerDomain" },
        channel: { $first: "$channel" },
        utmSource: { $first: "$session.utmSource" },
        utmMedium: { $first: "$session.utmMedium" },
        firstPageViewPath: { $first: "$firstPageView.path" },
        revenue: { $sum: "$amount" },
        paymentCount: { $sum: 1 },
      },
    },
  ];

  const revenueData = await Payment.aggregate(revenuePipeline);

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
      $lookup: {
        from: "pageviews",
        localField: "sessionId",
        foreignField: "sessionId",
        as: "pageViews",
      },
    },
    {
      $addFields: {
        firstPageView: {
          $arrayElemAt: [
            {
              $sortArray: {
                input: "$pageViews",
                sortBy: { timestamp: 1 },
              },
            },
            0,
          ],
        },
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
            else: "direct",
          },
        },
        channel: {
          $ifNull: ["$session.utmMedium", "direct"],
        },
      },
    },
    {
      $group: {
        _id: "$sessionId",
        sessionId: { $first: "$sessionId" },
        visitorId: { $first: "$visitorId" },
        referrer: { $first: "$session.referrer" },
        referrerDomain: { $first: "$referrerDomain" },
        channel: { $first: "$channel" },
        utmSource: { $first: "$session.utmSource" },
        utmMedium: { $first: "$session.utmMedium" },
        firstPageViewPath: { $first: "$firstPageView.path" },
      },
    },
  ];

  const goalsData = await GoalEvent.aggregate(goalsPipeline);

  const referrerMap = new Map<string, any>();

  const isIPAddress = (domain: string): boolean => {
    if (!domain || domain === "direct") {
      return false;
    }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(domain);
  };

  sessionsData.forEach((session) => {
    const channelName = resolveChannel(session.referrer, session.utmMedium);
    const referrerDomain = session.referrerDomain || "direct";

    if (!isIPAddress(referrerDomain)) {
      const domainKey = `domain::${channelName}::${referrerDomain}`;
      if (!referrerMap.has(domainKey)) {
        referrerMap.set(domainKey, {
          key: domainKey,
          channel: channelName,
          referrerType: "referrer" as const,
          originalValue: referrerDomain,
          name: formatReferrerName(referrerDomain),
          image: getReferrerImageUrl(referrerDomain),
          isAlternativeSource: false,
          uniqueVisitors: new Set<string>(),
          sessionIds: new Set<string>(),
          utmSource: session.utmSource,
          utmMedium: session.utmMedium,
          paramRef: null,
          paramVia: null,
        });
      }
      const entry = referrerMap.get(domainKey);
      entry.uniqueVisitors.add(session.visitorId);
      entry.sessionIds.add(session.sessionId);
      if (session.utmSource && !entry.utmSource)
        entry.utmSource = session.utmSource;
      if (session.utmMedium && !entry.utmMedium)
        entry.utmMedium = session.utmMedium;
    }

    if (session.pathParamRef) {
      const refKey = `param_ref::${channelName}::${session.pathParamRef}`;
      if (!referrerMap.has(refKey)) {
        referrerMap.set(refKey, {
          key: refKey,
          channel: channelName,
          referrerType: "ref" as const,
          originalValue: session.pathParamRef,
          name: session.pathParamRef,
          image: null,
          isAlternativeSource: true,
          uniqueVisitors: new Set<string>(),
          sessionIds: new Set<string>(),
          utmSource: session.utmSource,
          utmMedium: session.utmMedium,
          paramRef: session.pathParamRef,
          paramVia: null,
        });
      }
      const entry = referrerMap.get(refKey);
      entry.uniqueVisitors.add(session.visitorId);
      entry.sessionIds.add(session.sessionId);
      if (session.utmSource && !entry.utmSource)
        entry.utmSource = session.utmSource;
      if (session.utmMedium && !entry.utmMedium)
        entry.utmMedium = session.utmMedium;
    }

    if (session.pathParamVia) {
      const viaKey = `param_via::${channelName}::${session.pathParamVia}`;
      if (!referrerMap.has(viaKey)) {
        let viaName = session.pathParamVia;
        if (viaName.includes(".") && !viaName.includes(" ")) {
          viaName = formatReferrerName(viaName);
          const viaImage = getReferrerImageUrl(session.pathParamVia);
          referrerMap.set(viaKey, {
            key: viaKey,
            channel: channelName,
            referrerType: "via" as const,
            originalValue: session.pathParamVia,
            name: viaName,
            image: viaImage,
            isAlternativeSource: true,
            uniqueVisitors: new Set<string>(),
            sessionIds: new Set<string>(),
            utmSource: session.utmSource,
            utmMedium: session.utmMedium,
            paramRef: null,
            paramVia: session.pathParamVia,
          });
        } else {
          referrerMap.set(viaKey, {
            key: viaKey,
            channel: channelName,
            referrerType: "via" as const,
            originalValue: session.pathParamVia,
            name: session.pathParamVia,
            image: null,
            isAlternativeSource: true,
            uniqueVisitors: new Set<string>(),
            sessionIds: new Set<string>(),
            utmSource: session.utmSource,
            utmMedium: session.utmMedium,
            paramRef: null,
            paramVia: session.pathParamVia,
          });
        }
      }
      const entry = referrerMap.get(viaKey);
      entry.uniqueVisitors.add(session.visitorId);
      entry.sessionIds.add(session.sessionId);
      if (session.utmSource && !entry.utmSource)
        entry.utmSource = session.utmSource;
      if (session.utmMedium && !entry.utmMedium)
        entry.utmMedium = session.utmMedium;
    }

    if (
      session.utmSource &&
      (referrerDomain === "direct" || isIPAddress(referrerDomain))
    ) {
      const utmKey = `utm_source::${channelName}::${session.utmSource}`;
      if (!referrerMap.has(utmKey)) {
        // Format utm_source name (e.g., "ig" -> "Instagram", "fb" -> "Facebook")
        let utmName = session.utmSource;
        const utmLower = session.utmSource.toLowerCase();
        if (utmLower === "ig" || utmLower === "instagram")
          utmName = "Instagram";
        else if (utmLower === "fb" || utmLower === "facebook")
          utmName = "Facebook";
        else if (utmLower === "x" || utmLower === "twitter") utmName = "X";
        else if (utmLower === "yt" || utmLower === "youtube")
          utmName = "YouTube";
        else {
          // Capitalize first letter
          utmName =
            session.utmSource.charAt(0).toUpperCase() +
            session.utmSource.slice(1);
        }

        referrerMap.set(utmKey, {
          key: utmKey,
          channel: channelName,
          referrerType: "utm_source" as const,
          originalValue: session.utmSource,
          name: utmName,
          image: null,
          isAlternativeSource: true,
          uniqueVisitors: new Set<string>(),
          sessionIds: new Set<string>(),
          utmSource: session.utmSource,
          utmMedium: session.utmMedium,
          paramRef: null,
          paramVia: null,
        });
      }
      const entry = referrerMap.get(utmKey);
      entry.uniqueVisitors.add(session.visitorId);
      entry.sessionIds.add(session.sessionId);
      if (session.utmMedium && !entry.utmMedium)
        entry.utmMedium = session.utmMedium;
    }
  });

  // Step 5: Process revenue and goals data to match referrer entries
  const revenueMap = new Map<string, any>();
  const goalsMap = new Map<string, any>();

  // Helper function to extract param_ref and param_via from path
  const extractParamsFromPath = (path: string | null | undefined) => {
    if (!path) return { paramRef: null, paramVia: null };
    try {
      const url = new URL(
        path.startsWith("http") ? path : `https://example.com${path}`
      );
      const paramRef =
        url.searchParams.get("ref") || url.searchParams.get("param_ref");
      const paramVia =
        url.searchParams.get("via") || url.searchParams.get("param_via");
      return { paramRef, paramVia };
    } catch {
      return { paramRef: null, paramVia: null };
    }
  };

  revenueData.forEach((item) => {
    const channelName = resolveChannel(item.referrer, item.utmMedium);
    const referrerDomain = item.referrerDomain || "direct";
    const { paramRef, paramVia } = extractParamsFromPath(
      item.firstPageViewPath
    );

    // Add revenue to domain entry
    if (!isIPAddress(referrerDomain)) {
      const domainKey = `domain::${channelName}::${referrerDomain}`;
      if (!revenueMap.has(domainKey)) {
        revenueMap.set(domainKey, {
          revenue: 0,
          paymentCount: 0,
          sessionIds: new Set(),
        });
      }
      const rev = revenueMap.get(domainKey);
      rev.revenue += item.revenue;
      rev.paymentCount += item.paymentCount;
      rev.sessionIds.add(item.sessionId);
    }

    if (paramRef) {
      const refKey = `param_ref::${channelName}::${paramRef}`;
      if (!revenueMap.has(refKey)) {
        revenueMap.set(refKey, {
          revenue: 0,
          paymentCount: 0,
          sessionIds: new Set(),
        });
      }
      const rev = revenueMap.get(refKey);
      rev.revenue += item.revenue;
      rev.paymentCount += item.paymentCount;
      rev.sessionIds.add(item.sessionId);
    }

    if (paramVia) {
      const viaKey = `param_via::${channelName}::${paramVia}`;
      if (!revenueMap.has(viaKey)) {
        revenueMap.set(viaKey, {
          revenue: 0,
          paymentCount: 0,
          sessionIds: new Set(),
        });
      }
      const rev = revenueMap.get(viaKey);
      rev.revenue += item.revenue;
      rev.paymentCount += item.paymentCount;
      rev.sessionIds.add(item.sessionId);
    }

    if (
      item.utmSource &&
      (referrerDomain === "direct" || isIPAddress(referrerDomain))
    ) {
      const utmKey = `utm_source::${channelName}::${item.utmSource}`;
      if (!revenueMap.has(utmKey)) {
        revenueMap.set(utmKey, {
          revenue: 0,
          paymentCount: 0,
          sessionIds: new Set(),
        });
      }
      const rev = revenueMap.get(utmKey);
      rev.revenue += item.revenue;
      rev.paymentCount += item.paymentCount;
      rev.sessionIds.add(item.sessionId);
    }
  });

  goalsData.forEach((item) => {
    const channelName = resolveChannel(item.referrer, item.utmMedium);
    const referrerDomain = item.referrerDomain || "direct";
    const { paramRef, paramVia } = extractParamsFromPath(
      item.firstPageViewPath
    );

    if (!isIPAddress(referrerDomain)) {
      const domainKey = `domain::${channelName}::${referrerDomain}`;
      if (!goalsMap.has(domainKey)) {
        goalsMap.set(domainKey, { goalCount: 0, uniqueVisitors: new Set() });
      }
      const goal = goalsMap.get(domainKey);
      goal.goalCount += 1;
      goal.uniqueVisitors.add(item.visitorId);
    }

    if (paramRef) {
      const refKey = `param_ref::${channelName}::${paramRef}`;
      if (!goalsMap.has(refKey)) {
        goalsMap.set(refKey, { goalCount: 0, uniqueVisitors: new Set() });
      }
      const goal = goalsMap.get(refKey);
      goal.goalCount += 1;
      goal.uniqueVisitors.add(item.visitorId);
    }

    // Add goals to param_via entry
    if (paramVia) {
      const viaKey = `param_via::${channelName}::${paramVia}`;
      if (!goalsMap.has(viaKey)) {
        goalsMap.set(viaKey, { goalCount: 0, uniqueVisitors: new Set() });
      }
      const goal = goalsMap.get(viaKey);
      goal.goalCount += 1;
      goal.uniqueVisitors.add(item.visitorId);
    }

    if (
      item.utmSource &&
      (referrerDomain === "direct" || isIPAddress(referrerDomain))
    ) {
      const utmKey = `utm_source::${channelName}::${item.utmSource}`;
      if (!goalsMap.has(utmKey)) {
        goalsMap.set(utmKey, { goalCount: 0, uniqueVisitors: new Set() });
      }
      const goal = goalsMap.get(utmKey);
      goal.goalCount += 1;
      goal.uniqueVisitors.add(item.visitorId);
    }
  });

  const channelMap = new Map<string, any>();

  referrerMap.forEach((entry) => {
    const channelName = entry.channel;
    const uv = entry.uniqueVisitors.size;
    const revenueInfo = revenueMap.get(entry.key);
    const goalsInfo = goalsMap.get(entry.key);

    const revenue = revenueInfo?.revenue || 0;
    const paymentCount = revenueInfo?.paymentCount || 0;
    const sessionsWithPayments = revenueInfo?.sessionIds?.size || 0;
    const conversionRate = uv > 0 ? sessionsWithPayments / uv : 0;
    const goalCount = goalsInfo?.goalCount || 0;
    const uniqueVisitorsWithGoals = goalsInfo?.uniqueVisitors?.size || 0;
    const goalConversionRate = uv > 0 ? uniqueVisitorsWithGoals / uv : 0;

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

    channel.uv += uv;
    channel.revenue += revenue;
    channel.goalCount += goalCount;
    channel.paymentCount += paymentCount;

    const referrerObj: any = {
      name: entry.name,
      channel: channelName,
      uv,
      image: entry.image,
      isAlternativeSource: entry.isAlternativeSource,
      referrerType: entry.referrerType,
      originalValue: entry.originalValue,
      hasPaidMedium: false,
      paidMediumHint: null,
      revenue,
      paymentCount,
      conversionRate,
      goalCount,
      goalConversionRate,
      source: "tinybird",
    };

    if (entry.paramRef) referrerObj.param_ref = entry.paramRef;
    if (entry.paramVia) referrerObj.param_via = entry.paramVia;
    if (entry.utmSource) referrerObj.utm_source = entry.utmSource;
    if (entry.utmMedium) referrerObj.utm_medium = entry.utmMedium;

    channel.referrers.push(referrerObj);
  });

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

    const totalRevenueFromReferrers = channel.referrers.reduce(
      (sum: number, ref: any) => sum + (ref.revenue || 0),
      0
    );
    channel.revenue = Math.max(channel.revenue, totalRevenueFromReferrers);

    channel.conversionRate =
      totalUv > 0 ? totalSessionsWithPayments / totalUv : 0;
    channel.goalConversionRate =
      totalUv > 0 ? totalUniqueVisitorsWithGoals / totalUv : 0;

    if (channel.referrers.length > 0 && channel.referrers[0].image) {
      channel.image = channel.referrers[0].image;
    }

    channel.referrers.sort((a: any, b: any) => b.uv - a.uv);

    return channel;
  });

  channels.sort((a, b) => b.uv - a.uv);

  return channels;
}
