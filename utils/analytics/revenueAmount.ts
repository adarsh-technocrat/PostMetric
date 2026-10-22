import Website from "@/db/models/Website";
import { Types, type PipelineStage } from "mongoose";

/**
 * Shared pieces for every aggregation that sums Payment amounts.
 *
 * Payment.amount is the amount ×100 in major units (see db/models/Payment.ts),
 * in the payment's own currency. Summing payments in different currencies is
 * meaningless, so each payment is valued in the website's reporting currency:
 *   - payment.currency is the site currency            → amount
 *   - else the Stripe settlement currency matches it    → settlementAmount
 *   - else the payment cannot be valued                 → excluded (null)
 *
 * Refunds are their own Payment documents (refunded: true, amount = refund
 * amount), so net revenue is Σ non-refunds − Σ refunds.
 */

const CURRENCY_CACHE_TTL_MS = 30_000;
const currencyCache = new Map<string, { currency: string; at: number }>();

/** The website's reporting currency, upper-cased (default USD). */
export async function getSiteCurrency(
  websiteId: string | Types.ObjectId,
): Promise<string> {
  const key = websiteId.toString();
  const cached = currencyCache.get(key);
  if (cached && Date.now() - cached.at < CURRENCY_CACHE_TTL_MS) {
    return cached.currency;
  }
  const website = await Website.findById(key)
    .select("settings.currency")
    .lean<{ settings?: { currency?: string } }>();
  const currency = (website?.settings?.currency || "USD").toUpperCase();
  currencyCache.set(key, { currency, at: Date.now() });
  return currency;
}

/** Expression: the payment's amount in `currency`, or null if it has none. */
export function revenueAmountExpr(currency: string, prefix = "$") {
  const cur = currency.toUpperCase();
  const f = (name: string) => `${prefix}${name}`;
  return {
    $switch: {
      branches: [
        {
          case: { $eq: [{ $toUpper: { $ifNull: [f("currency"), ""] } }, cur] },
          then: { $ifNull: [f("amount"), 0] },
        },
        {
          case: {
            $and: [
              {
                $eq: [
                  { $toUpper: { $ifNull: [f("settlementCurrency"), ""] } },
                  cur,
                ],
              },
              { $isNumber: f("settlementAmount") },
            ],
          },
          then: f("settlementAmount"),
        },
      ],
      default: null,
    },
  };
}

/**
 * Expressions for a payment document. `prefix` is "$" for the current
 * document or e.g. "$$payment." inside a $map.
 */
export function revenueFieldExprs(currency: string, prefix = "$") {
  const amount = revenueAmountExpr(currency, prefix);
  const refunded = { $eq: [`${prefix}refunded`, true] };
  return {
    /** Amount in the site currency (×100), null when it can't be valued. */
    revenueAmount: amount,
    /** Signed contribution to net revenue: refunds negative, unvalued 0. */
    netRevenueAmount: {
      $let: {
        vars: { a: amount },
        in: {
          $cond: [
            { $eq: ["$$a", null] },
            0,
            { $cond: [refunded, { $multiply: ["$$a", -1] }, "$$a"] },
          ],
        },
      },
    },
    /** First (non-renewal, non-refund) payment tied to a session. */
    isConversion: {
      $and: [
        { $ne: [`${prefix}refunded`, true] },
        { $ne: [`${prefix}renewal`, true] },
        { $ne: [{ $ifNull: [`${prefix}sessionId`, null] }, null] },
      ],
    },
  };
}

/**
 * `$addFields` stage adding `revenueAmount`, `netRevenueAmount` and
 * `isConversion` (see revenueFieldExprs) to Payment documents.
 */
export function revenueAmountStage(currency: string): PipelineStage.AddFields {
  return { $addFields: revenueFieldExprs(currency) };
}

/**
 * `$lookup` from Payment to sessions/pageviews on sessionId, restricted to the
 * payment's own website (session ids are not unique across websites).
 */
export function sameSiteLookup(
  from: "sessions" | "pageviews",
  as: string,
  extraPipeline: any[] = [],
): PipelineStage.Lookup {
  return {
    $lookup: {
      from,
      localField: "sessionId",
      foreignField: "sessionId",
      let: { paymentWebsiteId: "$websiteId" },
      pipeline: [
        { $match: { $expr: { $eq: ["$websiteId", "$$paymentWebsiteId"] } } },
        ...extraPipeline,
      ],
      as,
    },
  };
}
