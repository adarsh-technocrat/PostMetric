import type { Granularity } from "./types";

export function getDateTruncUnit(granularity: Granularity): string {
  switch (granularity) {
    case "hourly":
      return "hour";
    case "daily":
      return "day";
    case "weekly":
      return "week";
    case "monthly":
      return "month";
    default:
      return "day";
  }
}
