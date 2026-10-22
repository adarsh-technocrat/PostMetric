import connectDB from "@/db";
import Payment from "@/db/models/Payment";
import { Types } from "mongoose";
import type { Granularity } from "../types";
import { getDateTruncUnit } from "../utils";

/**
 * A customer is their provider customer id, else their lower-cased email.
 * Payments with neither aren't counted as a customer.
 */
const CUSTOMER_KEY = {
  $ifNull: [
    "$customerId",
    {
      $cond: [
        { $gt: [{ $strLenCP: { $ifNull: ["$customerEmail", ""] } }, 0] },
        { $toLower: "$customerEmail" },
        null,
      ],
    },
  ],
};

/**
 * Unique customers and sales over the whole period. Summing the per-bucket
 * `customers` of getCustomersAndSalesOverTime counts a returning customer
 * once per bucket; use this for the period total.
 */
export async function getCustomersAndSalesTotals(
  websiteId: string,
  startDate: Date,
  endDate: Date,
): Promise<{ customers: number; sales: number }> {
  await connectDB();
  const [row] = await Payment.aggregate([
    {
      $match: {
        websiteId: new Types.ObjectId(websiteId),
        timestamp: { $gte: startDate, $lte: endDate },
        refunded: false,
      },
    },
    {
      $group: {
        _id: null,
        customerIds: { $addToSet: CUSTOMER_KEY },
        sales: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        sales: 1,
        customers: {
          $size: {
            $filter: {
              input: "$customerIds",
              as: "customerId",
              cond: { $ne: ["$$customerId", null] },
            },
          },
        },
      },
    },
  ]);
  return { customers: row?.customers ?? 0, sales: row?.sales ?? 0 };
}

export async function getCustomersAndSalesOverTime(
  websiteId: string,
  startDate: Date,
  endDate: Date,
  granularity: Granularity = "daily",
  timezone?: string,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);
  const unit = getDateTruncUnit(granularity);
  const dateTrunc: { date: string; unit: string; timezone?: string } = {
    date: "$timestamp",
    unit,
  };
  if (timezone) dateTrunc.timezone = timezone;

  const pipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
        refunded: false,
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: dateTrunc,
        },
        customerIds: { $addToSet: CUSTOMER_KEY },
        sales: { $sum: 1 },
      },
    },
    {
      $project: {
        date: "$_id",
        customers: {
          $size: {
            $filter: {
              input: "$customerIds",
              as: "customerId",
              cond: { $ne: ["$$customerId", null] },
            },
          },
        },
        sales: 1,
        _id: 0,
      },
    },
    {
      $sort: { date: 1 as const },
    },
  ];

  return await Payment.aggregate(pipeline);
}
