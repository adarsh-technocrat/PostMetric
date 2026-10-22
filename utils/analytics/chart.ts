interface ChartDataPoint {
  date: string;
  fullDate?: string;
  timestamp?: string;
  granularity?: "hourly" | "daily" | "weekly" | "monthly";
  timezone?: string;
}

const HOUR_MS = 60 * 60 * 1000;

/** `yyyy-MM-dd` and 0-23 hour of `date` in `timezone` (browser tz if unset). */
function getZonedParts(
  date: Date,
  timezone?: string,
): { ymd: string; hour: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      ...(timezone ? { timeZone: timezone } : {}),
    }).formatToParts(date);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";
    const hour = parseInt(get("hour"), 10);
    return {
      ymd: `${get("year")}-${get("month")}-${get("day")}`,
      hour: Number.isNaN(hour) ? 0 : hour % 24,
    };
  } catch {
    return null;
  }
}

function formatHour(hour: number): string {
  const hour12 = hour % 12 || 12;
  return `${hour12} ${hour < 12 ? "AM" : "PM"}`;
}

/**
 * Tooltip date for a chart point. Only hourly buckets carry a time
 * ("Today 3 PM" / "Monday, October 20, 2026, 3 PM"); daily, weekly and
 * monthly buckets show the date only. "Today" is evaluated in the website
 * timezone carried on the point (falls back to the browser timezone).
 */
export function formatDateDisplay(data: ChartDataPoint): string {
  const fallback = data.fullDate || data.date;
  if (!data.timestamp || data.granularity !== "hourly") {
    return fallback;
  }

  const bucket = new Date(data.timestamp);
  if (Number.isNaN(bucket.getTime())) return fallback;

  const bucketParts = getZonedParts(bucket, data.timezone);
  const nowParts = getZonedParts(new Date(), data.timezone);
  if (!bucketParts || !nowParts) return fallback;

  const hourLabel = formatHour(bucketParts.hour);
  if (bucketParts.ymd === nowParts.ymd) {
    return `Today ${hourLabel}`;
  }
  return `${fallback}, ${hourLabel}`;
}

const HOURLY_LABEL_RE = /^\s*(\d{1,2})(?::\d{2})?\s*(am|pm)\s*$/i;

/**
 * Index of the bucket containing "now" for hourly charts (used for the
 * current-hour marker / forecast), or null for non-hourly data or when the
 * chart does not include the current hour.
 */
export function getCurrentTimeIndex(data: ChartDataPoint[]): number | null {
  if (!data || data.length === 0) return null;

  const first = data[0];
  const isHourly =
    first?.granularity === "hourly" ||
    (first?.granularity === undefined && HOURLY_LABEL_RE.test(first?.date ?? ""));
  if (!isHourly) return null;

  // Preferred: match by absolute bucket time (timezone-independent).
  const now = Date.now();
  if (data.every((d) => d.timestamp)) {
    const idx = data.findIndex((d) => {
      const start = new Date(d.timestamp as string).getTime();
      return !Number.isNaN(start) && now >= start && now < start + HOUR_MS;
    });
    return idx === -1 ? null : idx;
  }

  // Fallback: compare labels like "1:00 PM" / "1pm" by hour, case-insensitively.
  const currentHour = new Date().getHours();
  const idx = data.findIndex((d) => {
    const m = HOURLY_LABEL_RE.exec(d.date ?? "");
    if (!m) return false;
    const h = parseInt(m[1], 10) % 12;
    const hour24 = m[2].toLowerCase() === "pm" ? h + 12 : h;
    return hour24 === currentHour;
  });
  return idx === -1 ? null : idx;
}

export interface BarShapeProps {
  payload?: {
    revenueNew?: number;
    revenueRenewal?: number;
    revenueRefund?: number;
    [key: string]: any;
  };
  value?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  [key: string]: any;
}

/**
 * Determine if revenueNew bar should have rounded corners
 * @param props - Bar shape props from Recharts
 * @returns true if the bar should have rounded top corners
 */
export function shouldHaveRadiusForNew(props: BarShapeProps): boolean {
  const { payload, value } = props;
  if (!payload || value === undefined || value <= 0) return false;

  const hasRevenueNew = (payload.revenueNew || 0) > 0;
  const hasRevenueRenewal = (payload.revenueRenewal || 0) > 0;
  const hasRevenueRefund = (payload.revenueRefund || 0) > 0;

  const barCount = [hasRevenueNew, hasRevenueRenewal, hasRevenueRefund].filter(
    Boolean,
  ).length;

  // If only one bar exists, it should have radius
  if (barCount === 1 && hasRevenueNew) return true;

  // revenueNew is only topmost if it's the only bar
  return false;
}

/**
 * Determine if revenueRenewal bar should have rounded corners
 * @param props - Bar shape props from Recharts
 * @returns true if the bar should have rounded top corners
 */
export function shouldHaveRadiusForRenewal(props: BarShapeProps): boolean {
  const { payload, value } = props;
  if (!payload || value === undefined || value <= 0) return false;

  const hasRevenueNew = (payload.revenueNew || 0) > 0;
  const hasRevenueRenewal = (payload.revenueRenewal || 0) > 0;
  const hasRevenueRefund = (payload.revenueRefund || 0) > 0;

  const barCount = [hasRevenueNew, hasRevenueRenewal, hasRevenueRefund].filter(
    Boolean,
  ).length;

  // If only one bar exists, it should have radius
  if (barCount === 1 && hasRevenueRenewal) return true;

  // revenueRenewal is topmost if refund doesn't exist
  if (barCount > 1 && hasRevenueRenewal && !hasRevenueRefund) return true;

  return false;
}

/**
 * Determine if revenueRefund bar should have rounded corners
 * @param props - Bar shape props from Recharts
 * @returns true if the bar should have rounded top corners
 */
export function shouldHaveRadiusForRefund(props: BarShapeProps): boolean {
  const { payload, value } = props;
  if (!payload || value === undefined || value <= 0) return false;

  const hasRevenueNew = (payload.revenueNew || 0) > 0;
  const hasRevenueRenewal = (payload.revenueRenewal || 0) > 0;
  const hasRevenueRefund = (payload.revenueRefund || 0) > 0;

  const barCount = [hasRevenueNew, hasRevenueRenewal, hasRevenueRefund].filter(
    Boolean,
  ).length;

  // If only one bar exists, it should have radius
  if (barCount === 1 && hasRevenueRefund) return true;

  // revenueRefund is always topmost if it exists
  if (barCount > 1 && hasRevenueRefund) return true;

  return false;
}

/**
 * Create an SVG path for a rectangle with only the top corners rounded
 * @param x - X coordinate of the rectangle
 * @param y - Y coordinate of the rectangle (top edge)
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @param radius - Radius for the rounded corners
 * @returns SVG path string
 */
export function createRoundedTopRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  // Clamp radius to not exceed half the width or height
  const r = Math.min(radius, width / 2, height);

  // If height is very small or width is too narrow, use a simple rect
  if (height <= r || width < r * 2) {
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${
      y + height
    } L ${x} ${y + height} Z`;
  }

  // Path for rectangle with only top corners rounded
  // Start from bottom-left, go clockwise: bottom-right, top-right (with rounded corner), top-left (with rounded corner), close
  // Q command: Q controlX controlY endX endY
  return `M ${x} ${y + height} 
          L ${x + width} ${y + height} 
          L ${x + width} ${y + r} 
          Q ${x + width} ${y} ${x + width - r} ${y} 
          L ${x + r} ${y} 
          Q ${x} ${y} ${x} ${y + r} 
          Z`;
}
