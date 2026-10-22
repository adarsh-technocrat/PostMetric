import { Types } from "mongoose";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { Granularity } from "./types";
import {
  addLocalDays,
  addLocalMonths,
  formatYMD,
  isoWeekday,
  localYMD,
  type LocalYMD,
} from "@/lib/date-time-conversion";

/**
 * Shared aggregation building blocks for the (non-revenue) analytics
 * pipelines.
 */

/**
 * PageView rows that represent real page views. Legacy exit-link clicks were
 * stored as PageView rows with `exitUrl` set; those must not be counted as
 * page views / visitors (exit clicks now live in the `exitclicks` collection).
 */
export const COUNTABLE_PAGEVIEW_FILTER = {
  exitUrl: { $in: [null, ""] },
} as const;

/**
 * Sessions that were active in [startDate, endDate], i.e. had activity in the
 * window. This matches the overview "visitors" metric (unique visitors with a
 * page view in the window) much better than "session started in window".
 */
export function activeSessionsMatch(
  websiteObjectId: Types.ObjectId,
  startDate: Date,
  endDate: Date,
) {
  return {
    websiteId: websiteObjectId,
    lastSeenAt: { $gte: startDate },
    firstVisitAt: { $lte: endDate },
  };
}

/**
 * `$lookup` of the Session document for a `sessionId`, scoped to the website
 * (sessionIds are only unique per website).
 */
export function lookupSessionStage(
  websiteObjectId: Types.ObjectId,
  as: string = "session",
) {
  return {
    $lookup: {
      from: "sessions",
      localField: "sessionId",
      foreignField: "sessionId",
      pipeline: [{ $match: { websiteId: websiteObjectId } }, { $limit: 1 }],
      as,
    },
  };
}

/**
 * `$lookup` of a single PageView of the same session (website-scoped), sorted
 * by timestamp. Returns at most one document so we never materialise every
 * page view of a session.
 */
export function lookupOnePageViewStage(
  websiteObjectId: Types.ObjectId,
  as: string,
  options: {
    direction?: 1 | -1;
    project?: Record<string, 0 | 1>;
  } = {},
) {
  return {
    $lookup: {
      from: "pageviews",
      localField: "sessionId",
      foreignField: "sessionId",
      pipeline: [
        {
          $match: { websiteId: websiteObjectId, ...COUNTABLE_PAGEVIEW_FILTER },
        },
        { $sort: { timestamp: options.direction ?? 1 } },
        { $limit: 1 },
        { $project: options.project ?? { _id: 0, path: 1, hostname: 1 } },
      ],
      as,
    },
  };
}

/** `$split(path, "?")[0]` */
export function cleanPathExpr(field: string = "$path") {
  return { $arrayElemAt: [{ $split: [field, "?"] }, 0] };
}

// ---------------------------------------------------------------------------
// Time buckets
//
// Buckets are identified by a LOCAL (website timezone) string key on both the
// DB side and the gap-filling side:
//   hourly  -> "yyyy-MM-dd HH"
//   daily   -> "yyyy-MM-dd"
//   weekly  -> "yyyy-MM-dd" of the local Monday starting the ISO week
//   monthly -> "yyyy-MM-01"
// ---------------------------------------------------------------------------

/** MongoDB expression producing the bucket key of `field` in `timezone`. */
export function bucketKeyExpr(
  granularity: Granularity,
  timezone: string = "UTC",
  field: string = "$timestamp",
) {
  const tz = timezone || "UTC";
  switch (granularity) {
    case "hourly":
      return {
        $dateToString: { date: field, format: "%Y-%m-%d %H", timezone: tz },
      };
    case "weekly":
    case "monthly":
      return {
        $dateToString: {
          date: {
            $dateTrunc: {
              date: field,
              unit: granularity === "weekly" ? "week" : "month",
              timezone: tz,
              ...(granularity === "weekly" ? { startOfWeek: "monday" } : {}),
            },
          },
          format: "%Y-%m-%d",
          timezone: tz,
        },
      };
    case "daily":
    default:
      return {
        $dateToString: { date: field, format: "%Y-%m-%d", timezone: tz },
      };
  }
}

/** Bucket key of an instant, computed in JS (mirror of {@link bucketKeyExpr}). */
export function bucketKeyForDate(
  date: Date,
  granularity: Granularity,
  timezone: string = "UTC",
): string {
  const tz = timezone || "UTC";
  if (granularity === "hourly")
    return formatInTimeZone(date, tz, "yyyy-MM-dd HH");
  const ymd = localYMD(date, tz);
  if (granularity === "weekly")
    return formatYMD(addLocalDays(ymd, -(isoWeekday(ymd) - 1)));
  if (granularity === "monthly") return formatYMD({ ...ymd, d: 1 });
  return formatYMD(ymd);
}

/** Start instant of a bucket key in `timezone`. */
export function bucketKeyToDate(key: string, timezone: string = "UTC"): Date {
  const tz = timezone || "UTC";
  const [day, hour] = key.split(" ");
  return fromZonedTime(`${day}T${hour ?? "00"}:00:00`, tz);
}

function parseYMD(key: string): LocalYMD {
  const [y, m, d] = key.split("-").map((p) => parseInt(p, 10));
  return { y, m, d };
}

/**
 * Every bucket overlapping [startDate, endDate], stepping in local time so
 * DST transitions never shift or duplicate a bucket. Hourly buckets step in
 * real time (a 23h DST day has 23 buckets, a 25h day merges the repeated
 * local hour into one key, exactly like the DB-side key).
 */
export function getBucketKeys(
  startDate: Date,
  endDate: Date,
  granularity: Granularity,
  timezone: string = "UTC",
): { key: string; date: Date }[] {
  const tz = timezone || "UTC";
  const out: { key: string; date: Date }[] = [];
  if (endDate < startDate) return out;

  if (granularity === "hourly") {
    const seen = new Set<string>();
    // Start of the local hour containing startDate.
    let cursor = bucketKeyToDate(bucketKeyForDate(startDate, "hourly", tz), tz);
    // Guard against pathological ranges.
    for (let i = 0; cursor <= endDate && i < 24 * 400; i++) {
      const key = bucketKeyForDate(cursor, "hourly", tz);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ key, date: bucketKeyToDate(key, tz) });
      }
      cursor = new Date(cursor.getTime() + 3_600_000);
    }
    return out;
  }

  const lastKey = bucketKeyForDate(endDate, granularity, tz);
  let ymd = parseYMD(bucketKeyForDate(startDate, granularity, tz));
  for (let i = 0; i < 5000; i++) {
    const key = formatYMD(ymd);
    if (key > lastKey) break;
    out.push({ key, date: bucketKeyToDate(key, tz) });
    ymd =
      granularity === "weekly"
        ? addLocalDays(ymd, 7)
        : granularity === "monthly"
          ? addLocalMonths(ymd, 1)
          : addLocalDays(ymd, 1);
  }
  return out;
}
