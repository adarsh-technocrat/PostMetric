import connectDB from "@/db";
import Session from "@/db/models/Session";
import { Types } from "mongoose";
import {
  formatReferrerName,
  getReferrerImageUrl,
} from "@/utils/tracking/channel";
import { activeSessionsMatch } from "../pipelines";

export async function getChannelBreakdownWithReferrers(
  websiteId: string,
  startDate: Date,
  endDate: Date,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const pipeline = [
    // Stage 1: Sessions of this website ACTIVE in the window (consistent
    // with the overview visitors metric)
    { $match: activeSessionsMatch(websiteObjectId, startDate, endDate) },

    // Stage 2: Add computed fields for channel resolution
    {
      $addFields: {
        // Normalize referrer for channel detection
        referrerLower: {
          $toLower: { $ifNull: ["$referrer", "direct"] },
        },
        utmMediumLower: {
          $toLower: { $ifNull: ["$utmMedium", ""] },
        },

        // Determine if it's direct traffic
        isDirect: {
          $or: [
            { $eq: ["$referrer", null] },
            { $eq: ["$referrer", ""] },
            { $eq: [{ $toLower: { $ifNull: ["$referrer", ""] } }, "direct"] },
          ],
        },

        // Extract referrer domain
        referrerDomain: {
          $cond: {
            if: {
              $or: [{ $eq: ["$referrer", null] }, { $eq: ["$referrer", ""] }],
            },
            then: "direct",
            else: {
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
          },
        },
      },
    },

    // Stage 3: Determine channel using conditional logic
    {
      $addFields: {
        channel: {
          $switch: {
            branches: [
              // Direct traffic
              {
                case: "$isDirect",
                then: "Direct",
              },

              // Paid traffic
              {
                case: {
                  $in: [
                    "$utmMediumLower",
                    ["paid", "cpc", "ppc", "ad", "ads", "sponsored", "display"],
                  ],
                },
                then: {
                  $cond: {
                    if: {
                      $or: [
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "facebook",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "instagram",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "twitter",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "^x\\.",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "linkedin",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "tiktok",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "pinterest",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "snapchat",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "youtube",
                          },
                        },
                      ],
                    },
                    then: "Paid social",
                    else: "Display",
                  },
                },
              },

              // Newsletter
              {
                case: {
                  $or: [
                    {
                      $in: ["$utmMediumLower", ["newsletter", "email"]],
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "beehiiv",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "substack",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "mailchimp",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "convertkit",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "ghost",
                      },
                    },
                  ],
                },
                then: "Newsletter",
              },

              // A.I.
              {
                case: {
                  $or: [
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "chatgpt",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "openai",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "perplexity",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "gemini",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "claude",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "anthropic",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "bard",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "copilot",
                      },
                    },
                  ],
                },
                then: "A.I.",
              },

              // Organic search
              {
                case: {
                  $or: [
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "google",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "bing",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "duckduckgo",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "brave",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "yandex",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "kagi",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "ecosia",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "baidu",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "yahoo",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "ask\\.com",
                      },
                    },
                  ],
                },
                then: "Organic search",
              },

              // Organic social
              {
                case: {
                  $or: [
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "twitter",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "^x\\.",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "facebook",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "instagram",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "linkedin",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "reddit",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "youtube",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "medium",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "producthunt",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "tiktok",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "pinterest",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "snapchat",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "telegram",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "discord",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "slack",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "whatsapp",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "hackernews",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "news\\.ycombinator",
                      },
                    },
                  ],
                },
                then: "Organic social",
              },

              // Affiliate (via/ref links or short referrers without dots)
              {
                case: {
                  $or: [
                    {
                      $in: ["$utmMediumLower", ["affiliate", "referral"]],
                    },
                    {
                      $and: [
                        {
                          $lt: [
                            { $strLenCP: { $ifNull: ["$referrerLower", ""] } },
                            30,
                          ],
                        },
                        {
                          $not: {
                            $regexMatch: {
                              input: { $ifNull: ["$referrerLower", ""] },
                              regex: "\\.",
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
                then: "Affiliate",
              },
            ],
            default: "Referral",
          },
        },
      },
    },

    // Stage 4: Normalize referrer name for grouping
    {
      $addFields: {
        referrerName: {
          $cond: {
            if: "$isDirect",
            then: "Direct/None",
            else: {
              $switch: {
                branches: [
                  {
                    case: {
                      $or: [
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "^x\\.",
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$referrerLower",
                            regex: "twitter",
                          },
                        },
                      ],
                    },
                    then: "X",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "google",
                      },
                    },
                    then: "Google",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "youtube",
                      },
                    },
                    then: "YouTube",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "facebook",
                      },
                    },
                    then: "Facebook",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "instagram",
                      },
                    },
                    then: "Instagram",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$referrerLower",
                        regex: "linkedin",
                      },
                    },
                    then: "LinkedIn",
                  },
                ],
                default: "$referrerDomain",
              },
            },
          },
        },
      },
    },

    // Stage 5: Lookup payments for each session
    {
      $lookup: {
        from: "payments",
        let: { sessionId: "$sessionId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$sessionId", "$$sessionId"] },
                  { $eq: ["$refunded", false] },
                  {
                    $gte: ["$timestamp", startDate],
                  },
                  {
                    $lte: ["$timestamp", endDate],
                  },
                ],
              },
            },
          },
        ],
        as: "payments",
      },
    },

    // Stage 6: Lookup goal events for each session
    {
      $lookup: {
        from: "goalevents",
        localField: "sessionId",
        foreignField: "sessionId",
        pipeline: [
          {
            $match: {
              websiteId: websiteObjectId,
              timestamp: { $gte: startDate, $lte: endDate },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: "goalEvents",
      },
    },

    // Stage 7: Calculate payment and goal metrics per session
    {
      $addFields: {
        sessionRevenue: {
          $sum: {
            $map: {
              input: "$payments",
              as: "payment",
              in: { $divide: ["$$payment.amount", 100] }, // Convert cents to dollars
            },
          },
        },
        sessionPaymentCount: { $size: "$payments" },
        sessionGoalCount: { $size: "$goalEvents" },
      },
    },

    // Stage 8: Unique visitors. A visitor can have several sessions, so we
    // first collapse to one row per (channel, referrer, visitor) and then
    // count rows; channel totals are computed separately (a visitor may come
    // through several referrers of the same channel).
    {
      $facet: {
        referrers: [
          {
            $group: {
              _id: {
                channel: "$channel",
                referrer: "$referrerName",
                visitorId: "$visitorId",
              },
              revenue: { $sum: "$sessionRevenue" },
              paymentCount: { $sum: "$sessionPaymentCount" },
              sessionsWithPaymentsCount: {
                $sum: { $cond: [{ $gt: ["$sessionPaymentCount", 0] }, 1, 0] },
              },
              goalCount: { $sum: "$sessionGoalCount" },
              hasGoal: { $max: { $gt: ["$sessionGoalCount", 0] } },
              utmSource: { $first: "$utmSource" },
              utmMedium: { $first: "$utmMedium" },
              referrerDomain: { $first: "$referrerDomain" },
              referrer: { $first: "$referrer" },
            },
          },
          {
            $group: {
              _id: { channel: "$_id.channel", referrer: "$_id.referrer" },
              uv: { $sum: 1 },
              revenue: { $sum: "$revenue" },
              paymentCount: { $sum: "$paymentCount" },
              sessionsWithPaymentsCount: { $sum: "$sessionsWithPaymentsCount" },
              goalCount: { $sum: "$goalCount" },
              uniqueVisitorsWithGoalsCount: {
                $sum: { $cond: ["$hasGoal", 1, 0] },
              },
              utmSource: { $first: "$utmSource" },
              utmMedium: { $first: "$utmMedium" },
              referrerDomain: { $first: "$referrerDomain" },
              referrer: { $first: "$referrer" },
            },
          },
          {
            $addFields: {
              conversionRate: {
                $cond: {
                  if: { $gt: ["$uv", 0] },
                  then: { $divide: ["$sessionsWithPaymentsCount", "$uv"] },
                  else: 0,
                },
              },
              goalConversionRate: {
                $cond: {
                  if: { $gt: ["$uv", 0] },
                  then: { $divide: ["$uniqueVisitorsWithGoalsCount", "$uv"] },
                  else: 0,
                },
              },
            },
          },
        ],
        channels: [
          {
            $group: {
              _id: { channel: "$channel", visitorId: "$visitorId" },
              hasGoal: { $max: { $gt: ["$sessionGoalCount", 0] } },
            },
          },
          {
            $group: {
              _id: "$_id.channel",
              uv: { $sum: 1 },
              visitorsWithGoals: { $sum: { $cond: ["$hasGoal", 1, 0] } },
            },
          },
        ],
      },
    },
  ];

  const [facet] = await Session.aggregate(pipeline).allowDiskUse(true);
  const referrerRows: any[] = facet?.referrers ?? [];
  const channelRows: any[] = facet?.channels ?? [];

  // Group referrers under channels (channel totals: revenue/payments/goals are
  // sums over referrers; visitors are unique per channel).
  const channelUv = new Map<string, { uv: number; visitorsWithGoals: number }>(
    channelRows.map((c) => [
      c._id,
      { uv: c.uv, visitorsWithGoals: c.visitorsWithGoals },
    ]),
  );
  const grouped = new Map<string, any>();
  for (const r of referrerRows) {
    const name = r._id.channel;
    if (!grouped.has(name)) {
      grouped.set(name, {
        name,
        uv: channelUv.get(name)?.uv ?? 0,
        revenue: 0,
        goalCount: 0,
        paymentCount: 0,
        referrers: [] as any[],
      });
    }
    const ch = grouped.get(name);
    ch.revenue += r.revenue;
    ch.paymentCount += r.paymentCount;
    ch.goalCount += r.goalCount;
    ch.referrers.push({
      name: r._id.referrer,
      channel: name,
      uv: r.uv,
      revenue: r.revenue,
      paymentCount: r.paymentCount,
      conversionRate: r.conversionRate,
      goalCount: r.goalCount,
      goalConversionRate: r.goalConversionRate,
      utmSource: r.utmSource,
      utmMedium: r.utmMedium,
      referrerDomain: r.referrerDomain,
      referrer: r.referrer,
    });
  }
  const result = Array.from(grouped.values())
    .map((ch) => {
      const totalUv = ch.uv;
      return {
        ...ch,
        conversionRate: totalUv > 0 ? ch.paymentCount / totalUv : 0,
        // Unique visitors with >= 1 goal / unique visitors (<= 1).
        goalConversionRate:
          totalUv > 0
            ? (channelUv.get(ch.name)?.visitorsWithGoals ?? 0) / totalUv
            : 0,
        referrers: ch.referrers.sort((a: any, b: any) => b.uv - a.uv),
      };
    })
    .sort((a, b) => b.uv - a.uv);


  // Post-process to add formatting, images, and handle referrer names
  const channels = result.map((channel) => {
    // Format referrer names and add images
    const referrers = channel.referrers.map((ref: any) => {
      const referrerDomain = ref.referrerDomain || ref.referrer || "direct";
      const formattedName =
        ref.name === "Direct/None"
          ? "Direct/None"
          : formatReferrerName(referrerDomain);
      const image = getReferrerImageUrl(referrerDomain);

      return {
        name: formattedName,
        channel: ref.channel,
        uv: ref.uv,
        revenue: ref.revenue,
        paymentCount: ref.paymentCount,
        conversionRate: ref.conversionRate,
        goalCount: ref.goalCount,
        goalConversionRate: ref.goalConversionRate,
        image: image,
        isAlternativeSource: false,
        referrerType: "referrer" as const,
        originalValue: referrerDomain,
        hasPaidMedium: false,
        paidMediumHint: null,
        ...(ref.utmSource && { utm_source: ref.utmSource }),
        ...(ref.utmMedium && { utm_medium: ref.utmMedium }),
      };
    });

    // Get channel image from first referrer if available
    const channelImage =
      referrers.length > 0 && referrers[0].image ? referrers[0].image : null;

    return {
      name: channel.name,
      uv: channel.uv,
      revenue: channel.revenue,
      goalCount: channel.goalCount,
      paymentCount: channel.paymentCount,
      conversionRate: channel.conversionRate,
      goalConversionRate: channel.goalConversionRate,
      image: channelImage,
      isAlternativeSource: false,
      referrers: referrers,
    };
  });

  return channels;
}
