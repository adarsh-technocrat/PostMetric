import { type TimeZone } from "timezones-list";
import {
  toZonedTime,
  fromZonedTime,
  formatInTimeZone,
  getTimezoneOffset as getTzOffsetMs,
} from "date-fns-tz";
import { startOfDay, endOfDay } from "date-fns";

export function convertUTCTimezoneToLocal(
  datetime_in_utc: Date,
  local_timezone: TimeZone,
): Date {
  if (!(datetime_in_utc instanceof Date) || isNaN(datetime_in_utc.getTime()))
    throw new Error("Invalid date");
  if (!local_timezone?.tzCode) throw new Error("Invalid timezone");
  return toZonedTime(datetime_in_utc, local_timezone.tzCode);
}

export function utcToZonedTime(date: Date, timeZone: string): Date {
  if (!(date instanceof Date) || isNaN(date.getTime()))
    throw new Error("Invalid date");
  return toZonedTime(date, timeZone);
}

export function getTimezoneOffset(timezone: string, date: Date): number {
  return getTzOffsetMs(timezone, date);
}

export function getTimezoneComponents(
  utcDate: Date,
  timezone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const zoned = toZonedTime(utcDate, timezone);
  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
    hour: zoned.getHours(),
    minute: zoned.getMinutes(),
  };
}

export function startOfDayInTimezone(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  const start = startOfDay(zoned);
  return fromZonedTime(start, timezone);
}

export function endOfDayInTimezone(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  const end = endOfDay(zoned);
  return fromZonedTime(end, timezone);
}

export function createUTCDateFromTimezoneComponents(
  year: number,
  month: number,
  day: number,
  hour: number,
  timezone: string,
): Date {
  const arbitrary = new Date(0);
  const zoned = toZonedTime(arbitrary, timezone);
  zoned.setFullYear(year);
  zoned.setMonth(month - 1);
  zoned.setDate(day);
  zoned.setHours(hour, 0, 0, 0);
  return fromZonedTime(zoned, timezone);
}

export function getTimezoneOffsetString(timezone: string, date: Date): string {
  const offsetMs = getTimezoneOffset(timezone, date);
  const offsetHours = Math.floor(Math.abs(offsetMs) / (60 * 60 * 1000));
  const offsetMinutes = Math.floor(
    (Math.abs(offsetMs) % (60 * 60 * 1000)) / (60 * 1000),
  );
  const sign = offsetMs >= 0 ? "+" : "-";
  return `${sign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Period resolution (website-timezone aware)
//
// All calendar maths below is done on plain local Y/M/D components and turned
// into instants with `fromZonedTime("yyyy-MM-ddTHH:mm:ss", tz)`, so neither the
// server clock's timezone nor DST transitions can shift a boundary.
// ---------------------------------------------------------------------------

export type LocalYMD = { y: number; m: number; d: number };

const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatYMD({ y, m, d }: LocalYMD): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** Local calendar date of an instant in `timezone`. */
export function localYMD(date: Date, timezone: string): LocalYMD {
  const [y, m, d] = formatInTimeZone(date, timezone, "yyyy-MM-dd")
    .split("-")
    .map((p) => parseInt(p, 10));
  return { y, m, d };
}

/** Normalised calendar arithmetic (handles month/year overflow). */
export function addLocalDays(ymd: LocalYMD, days: number): LocalYMD {
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d + days));
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
  };
}

export function addLocalMonths(ymd: LocalYMD, months: number): LocalYMD {
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: Math.min(ymd.d, lastDay),
  };
}

/** ISO weekday of a local date: 1 = Monday ... 7 = Sunday. */
export function isoWeekday(ymd: LocalYMD): number {
  const dow = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d)).getUTCDay();
  return dow === 0 ? 7 : dow;
}

/** Instant of local midnight (00:00) of `ymd` in `timezone`. */
export function zonedStartOfDay(ymd: LocalYMD, timezone: string): Date {
  return fromZonedTime(`${formatYMD(ymd)}T00:00:00`, timezone);
}

/** Last millisecond of local day `ymd` (= next local midnight - 1ms). */
export function zonedEndOfDay(ymd: LocalYMD, timezone: string): Date {
  return new Date(
    zonedStartOfDay(addLocalDays(ymd, 1), timezone).getTime() - 1,
  );
}

export type ResolvedPeriodRange = {
  /** Inclusive start instant. */
  startDate: Date;
  /** Inclusive end instant (may lie in the future for in-progress periods). */
  endDate: Date;
  /** Comparison window (same length, ending at the same relative time). */
  previousStartDate: Date;
  previousEndDate: Date;
  timezone: string;
};

type PeriodKey =
  | "today"
  | "yesterday"
  | "last24h"
  | "last7d"
  | "last30d"
  | "last12m"
  | "wtd"
  | "mtd"
  | "ytd"
  | "all";

function normalizePeriod(period: string): PeriodKey | null {
  switch (period.trim().toLowerCase()) {
    case "today":
      return "today";
    case "yesterday":
      return "yesterday";
    case "last24h":
    case "last 24 hours":
      return "last24h";
    case "last7d":
    case "last7days":
    case "last 7 days":
      return "last7d";
    case "last30d":
    case "last30days":
    case "last 30 days":
      return "last30d";
    case "last12m":
    case "last12months":
    case "last 12 months":
      return "last12m";
    case "week":
    case "week to date":
      return "wtd";
    case "month":
    case "month to date":
      return "mtd";
    case "year":
    case "year to date":
      return "ytd";
    case "all":
    case "all time":
      return "all";
    default:
      return null;
  }
}

const CUSTOM_RE = /^custom:(\d{4})-(\d{2})-(\d{2}):(\d{4})-(\d{2})-(\d{2})$/i;

function parseCustom(period: string): { from: LocalYMD; to: LocalYMD } | null {
  const m = CUSTOM_RE.exec(period.trim());
  if (!m) return null;
  const n = m.slice(1).map((p) => parseInt(p, 10));
  let from: LocalYMD = { y: n[0], m: n[1], d: n[2] };
  let to: LocalYMD = { y: n[3], m: n[4], d: n[5] };
  if (formatYMD(from) > formatYMD(to)) [from, to] = [to, from];
  return { from, to };
}

function dayDiff(a: LocalYMD, b: LocalYMD): number {
  return Math.round(
    (Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000,
  );
}

/**
 * Resolve the [start, end] range of a period at a given offset (offset <= 0,
 * "shift the whole range back by |offset| period lengths").
 * For to-date presets a non-zero offset yields the full calendar unit
 * (e.g. Month to date, offset -1 = the whole previous month).
 */
function rangeAtOffset(
  key: PeriodKey | "custom",
  offset: number,
  timezone: string,
  now: Date,
  custom: { from: LocalYMD; to: LocalYMD } | null,
  earliestDataPoint?: Date | null,
): { startDate: Date; endDate: Date } {
  const today = localYMD(now, timezone);
  const n = -offset; // number of period lengths to go back (>= 0)
  const days = (from: LocalYMD, to: LocalYMD) => ({
    startDate: zonedStartOfDay(from, timezone),
    endDate: zonedEndOfDay(to, timezone),
  });

  switch (key) {
    case "custom": {
      const len = dayDiff(custom!.from, custom!.to) + 1;
      return days(
        addLocalDays(custom!.from, -len * n),
        addLocalDays(custom!.to, -len * n),
      );
    }
    case "today": {
      const d = addLocalDays(today, -n);
      return days(d, d);
    }
    case "yesterday": {
      const d = addLocalDays(today, -1 - n);
      return days(d, d);
    }
    case "last24h": {
      const end = now.getTime() - n * 86_400_000;
      return { startDate: new Date(end - 86_400_000), endDate: new Date(end) };
    }
    case "last7d":
    case "last30d": {
      const len = key === "last7d" ? 7 : 30;
      const last = addLocalDays(today, -len * n);
      return days(addLocalDays(last, -(len - 1)), last);
    }
    case "last12m": {
      // 12 calendar months including the current (partial) one.
      const start = addLocalMonths({ ...today, d: 1 }, -11 - 12 * n);
      if (n === 0) return days(start, today);
      return days(start, addLocalDays(addLocalMonths(start, 12), -1));
    }
    case "wtd": {
      const monday = addLocalDays(today, -(isoWeekday(today) - 1) - 7 * n);
      return days(monday, n === 0 ? today : addLocalDays(monday, 6));
    }
    case "mtd": {
      const first = addLocalMonths({ ...today, d: 1 }, -n);
      return days(
        first,
        n === 0 ? today : addLocalDays(addLocalMonths(first, 1), -1),
      );
    }
    case "ytd": {
      const first = { y: today.y - n, m: 1, d: 1 };
      return days(first, n === 0 ? today : { y: first.y, m: 12, d: 31 });
    }
    case "all":
    default: {
      // "All time": capped at 3 years back, starting on the 1st of a month.
      const cap = addLocalMonths({ ...today, d: 1 }, -36);
      let start = cap;
      if (earliestDataPoint) {
        const e = localYMD(new Date(earliestDataPoint), timezone);
        const eFirst = { ...e, d: 1 };
        if (formatYMD(eFirst) > formatYMD(cap)) start = eFirst;
      }
      return days(start, today);
    }
  }
}

/**
 * Resolve a period (preset or `custom:YYYY-MM-DD:YYYY-MM-DD`, inclusive local
 * dates) into a concrete range plus its comparison range, in the website's
 * timezone. `offset` (integer <= 0) shifts the whole range back by |offset|
 * period lengths.
 *
 * Previous period = the same preset one period length earlier. When the
 * current range is still in progress (ends after `now`) the previous range is
 * truncated to the same elapsed duration ("today so far" vs "yesterday up to
 * the same time").
 */
export function resolvePeriodRange(
  period: string | null | undefined,
  timezone: string = "UTC",
  options: {
    offset?: number | string | null;
    now?: Date;
    earliestDataPoint?: Date | null;
  } = {},
): ResolvedPeriodRange {
  const tz = timezone || "UTC";
  const now = options.now ?? new Date();
  const rawOffset = Math.trunc(Number(options.offset ?? 0));
  const offset = Number.isFinite(rawOffset) && rawOffset < 0 ? rawOffset : 0;

  const p = (period || "today").trim();
  const custom = parseCustom(p);
  const key: PeriodKey | "custom" = custom
    ? "custom"
    : (normalizePeriod(p) ?? "today");

  const current = rangeAtOffset(
    key,
    key === "all" ? 0 : offset,
    tz,
    now,
    custom,
    options.earliestDataPoint,
  );

  let previous: { startDate: Date; endDate: Date };
  if (key === "all") {
    const span = current.endDate.getTime() - current.startDate.getTime();
    previous = {
      startDate: new Date(current.startDate.getTime() - span - 1),
      endDate: new Date(current.startDate.getTime() - 1),
    };
  } else {
    previous = rangeAtOffset(key, offset - 1, tz, now, custom);
  }

  // In-progress period: compare like-for-like elapsed time.
  if (current.endDate.getTime() > now.getTime() && now >= current.startDate) {
    const elapsed = now.getTime() - current.startDate.getTime();
    const cappedEnd = previous.startDate.getTime() + elapsed;
    if (cappedEnd < previous.endDate.getTime()) {
      previous = { ...previous, endDate: new Date(cappedEnd) };
    }
  }

  return {
    startDate: current.startDate,
    endDate: current.endDate,
    previousStartDate: previous.startDate,
    previousEndDate: previous.endDate,
    timezone: tz,
  };
}

/** Backwards-compatible wrapper around {@link resolvePeriodRange}. */
export function getDateRangeForPeriod(
  period: string,
  timezone: TimeZone["tzCode"] | string,
  _website?: { createdAt?: Date },
  earliestDataPoint?: Date | null,
  offset: number = 0,
): { startDate: Date; endDate: Date } {
  const r = resolvePeriodRange(period, timezone || "UTC", {
    offset,
    earliestDataPoint,
  });
  return { startDate: r.startDate, endDate: r.endDate };
}
