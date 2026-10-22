import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Payment from "@/db/models/Payment";
import Session from "@/db/models/Session";
import { Types } from "mongoose";
import {
  getSiteCurrency,
  revenueAmountStage,
  sameSiteLookup,
} from "../revenueAmount";

export async function getMetrics(
  websiteId: string,
  startDate: Date,
  endDate: Date,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const match = {
    websiteId: websiteObjectId,
    timestamp: { $gte: startDate, $lte: endDate },
  };
  const sessionMatch = {
    websiteId: websiteObjectId,
    firstVisitAt: { $gte: startDate, $lte: endDate },
  };

  const currency = await getSiteCurrency(websiteObjectId);

  const [
    uniqueVisitorsResult,
    totalPageViews,
    revenueResult,
    sessionStatsResult,
    sessionsWithPaymentsResult,
  ] = await Promise.all([
    PageView.aggregate([
      { $match: match },
      { $group: { _id: "$visitorId" } },
      { $count: "count" },
    ]),
    PageView.countDocuments(match),
    // Amounts valued in the site currency; refunds are their own documents.
    Payment.aggregate([
      { $match: match },
      revenueAmountStage(currency),
      {
        $group: {
          _id: null,
          grossRevenue: {
            $sum: {
              $cond: [
                { $ne: ["$refunded", true] },
                { $ifNull: ["$revenueAmount", 0] },
                0,
              ],
            },
          },
          totalRefunds: {
            $sum: {
              $cond: [
                { $eq: ["$refunded", true] },
                { $ifNull: ["$revenueAmount", 0] },
                0,
              ],
            },
          },
          excludedPaymentCount: {
            $sum: { $cond: [{ $eq: ["$revenueAmount", null] }, 1, 0] },
          },
        },
      },
    ]),
    Session.aggregate([
      { $match: sessionMatch },
      {
        $project: {
          bounce: 1,
          duration: 1,
          firstVisitAt: 1,
          lastSeenAt: 1,
          computedDuration: {
            $cond: [
              { $gt: ["$duration", 0] },
              "$duration",
              {
                $floor: {
                  $divide: [
                    { $subtract: ["$lastSeenAt", "$firstVisitAt"] },
                    1000,
                  ],
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          bounceCount: { $sum: { $cond: ["$bounce", 1, 0] } },
          totalDuration: { $sum: "$computedDuration" },
        },
      },
    ]),
    // Conversions: distinct sessions counted in `sessions` below that made a
    // first (non-renewal, non-refund) payment, so the rate stays <= 100%.
    Payment.aggregate([
      {
        $match: {
          websiteId: websiteObjectId,
          // A payment follows its session; a day of slack covers sessions
          // that started just before the period.
          timestamp: {
            $gte: new Date(startDate.getTime() - 24 * 60 * 60 * 1000),
            $lte: endDate,
          },
          refunded: { $ne: true },
          renewal: { $ne: true },
          sessionId: { $nin: [null, ""] },
        },
      },
      {
        $group: {
          _id: "$sessionId",
          sessionId: { $first: "$sessionId" },
          websiteId: { $first: "$websiteId" },
        },
      },
      sameSiteLookup("sessions", "session", [
        { $match: sessionMatch },
        { $limit: 1 },
        { $project: { _id: 1 } },
      ]),
      { $match: { "session.0": { $exists: true } } },
      { $count: "count" },
    ]),
  ]);

  const uniqueVisitorsCount = uniqueVisitorsResult[0]?.count ?? 0;
  const totalRefunds = revenueResult[0]?.totalRefunds ?? 0;
  // Net of refunds (amounts ×100, site currency).
  const totalRevenue = (revenueResult[0]?.grossRevenue ?? 0) - totalRefunds;
  const excludedPaymentCount = revenueResult[0]?.excludedPaymentCount ?? 0;
  const sessionStats = sessionStatsResult[0];
  const totalSessions = sessionStats?.totalSessions ?? 0;
  const bounceCount = sessionStats?.bounceCount ?? 0;
  const totalDuration = sessionStats?.totalDuration ?? 0;
  const sessionsWithPaymentsCount = sessionsWithPaymentsResult[0]?.count ?? 0;

  const bounceRate =
    totalSessions > 0 ? (bounceCount / totalSessions) * 100 : 0;
  const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
  const conversionRate =
    totalSessions > 0
      ? Math.min(100, (sessionsWithPaymentsCount / totalSessions) * 100)
      : 0;
  const revenuePerVisitor =
    uniqueVisitorsCount > 0 ? totalRevenue / uniqueVisitorsCount : 0;

  return {
    visitors: uniqueVisitorsCount,
    pageViews: totalPageViews,
    revenue: totalRevenue,
    revenueRefund: totalRefunds,
    // Payments in a currency that couldn't be valued in the site currency.
    excludedPaymentCount,
    sessions: totalSessions,
    bounceRate,
    sessionTime: avgDuration,
    conversionRate,
    revenuePerVisitor,
  };
}
