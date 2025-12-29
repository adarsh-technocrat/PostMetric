import connectDB from "@/db";
import PageView from "@/db/models/PageView";
import Payment from "@/db/models/Payment";
import Session from "@/db/models/Session";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

export async function getMetrics(
  websiteId: string,
  startDate: Date,
  endDate: Date
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  const uniqueVisitors = await PageView.distinct("visitorId", {
    websiteId: websiteObjectId,
    timestamp: { $gte: startDate, $lte: endDate },
  });

  const totalPageViews = await PageView.countDocuments({
    websiteId: websiteObjectId,
    timestamp: { $gte: startDate, $lte: endDate },
  });

  // Get raw revenue components (not net revenue)
  const revenueResult = await Payment.aggregate([
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $cond: [{ $eq: ["$refunded", false] }, "$amount", 0],
          },
        },
        totalRefunds: {
          $sum: {
            $cond: [{ $eq: ["$refunded", true] }, "$amount", 0],
          },
        },
      },
    },
  ]);

  const totalRevenue = revenueResult[0]?.totalRevenue || 0;
  const totalRefunds = revenueResult[0]?.totalRefunds || 0;

  // Get sessions
  const sessions = await Session.find({
    websiteId: websiteObjectId,
    firstVisitAt: { $gte: startDate, $lte: endDate },
  });

  const totalSessions = sessions.length;
  const bounceRate =
    totalSessions > 0
      ? (sessions.filter((s) => s.bounce).length / totalSessions) * 100
      : 0;

  const avgDuration =
    totalSessions > 0
      ? sessions.reduce((sum, s) => {
          let duration = s.duration;

          if (duration === 0 && s.firstVisitAt && s.lastSeenAt) {
            duration = Math.floor(
              (s.lastSeenAt.getTime() - s.firstVisitAt.getTime()) / 1000
            );
          }
          return sum + duration;
        }, 0) / totalSessions
      : 0;

  const sessionsWithPayments = await Payment.distinct("sessionId", {
    websiteId: websiteObjectId,
    timestamp: { $gte: startDate, $lte: endDate },
    refunded: false,
  });

  const conversionRate =
    totalSessions > 0 ? (sessionsWithPayments.length / totalSessions) * 100 : 0;

  // Revenue per visitor
  const revenuePerVisitor =
    uniqueVisitors.length > 0 ? totalRevenue / uniqueVisitors.length : 0;

  return {
    visitors: uniqueVisitors.length,
    pageViews: totalPageViews,
    revenue: totalRevenue,
    revenueRefund: totalRefunds,
    sessions: totalSessions,
    bounceRate,
    sessionTime: avgDuration,
    conversionRate,
    revenuePerVisitor,
  };
}
