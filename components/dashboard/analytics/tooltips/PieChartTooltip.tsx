"use client";

export interface ReferrerData {
  name: string;
  channel?: string;
  uv?: number;
  image?: string | null;
  isAlternativeSource?: boolean;
  referrerType?: string;
  originalValue?: string;
  hasPaidMedium?: boolean;
  paidMediumHint?: string | null;
  revenue?: number;
  paymentCount?: number;
  conversionRate?: number;
  goalCount?: number;
  goalConversionRate?: number;
  [key: string]: any; // For additional fields like param_ref, param_via, utm_source, etc.
}

export interface BreakdownData {
  name: string;
  uv: number;
  revenue?: number;
  image?: string;
  flag?: string;
  conversionRate?: number;
  goalCount?: number;
  goalConversionRate?: number;
  hostname?: string;
  countryCode?: string;
  referrers?: ReferrerData[];
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: BreakdownData;
  }>;
  allData?: BreakdownData[];
}

const DEFAULT_COLORS = ["#8dcdff", "#7888b2", "#E16540", "#94a3b8", "#cbd5e1"];

export const PieChartTooltip = ({
  active,
  payload,
  allData,
}: PieTooltipProps) => {
  if (!active || !payload || !payload.length || !allData) {
    return null;
  }

  // Calculate totals
  const totalVisitors = allData.reduce((sum, item) => sum + (item.uv || 0), 0);
  const totalRevenue = allData.reduce(
    (sum, item) => sum + (item.revenue || 0),
    0
  );

  // Get top sources sorted by percentage
  const totalValue = allData.reduce((sum, item) => sum + (item.uv || 0), 0);
  const topSources = allData
    .map((item) => ({
      ...item,
      percent: totalValue > 0 ? (item.uv || 0) / totalValue : 0,
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5); // Top 5 sources

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toLocaleString("en-US");
  };

  const formatCurrency = (cents: number) => {
    const dollars = cents / 100;
    if (dollars >= 1000) {
      return `$${(dollars / 1000).toFixed(1)}k`;
    }
    return `$${dollars.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getIconUrl = (item: BreakdownData) => {
    if (item.image) return item.image;
    const cleanName = (item.name || "")
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "")
      .trim();
    if (cleanName.includes(".")) {
      return `https://icons.duckduckgo.com/ip3/${cleanName}.ico`;
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
      {/* Top Section - Overall Metrics */}
      <div className="space-y-2 text-xs mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: "#8dcdff",
              }}
            ></div>
            <span className="text-textSecondary">Visitors</span>
          </div>
          <span className="font-semibold text-textPrimary">
            {formatNumber(totalVisitors)}
          </span>
        </div>
        {totalRevenue > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: "#E16540",
                }}
              ></div>
              <span className="text-textSecondary">Revenue</span>
            </div>
            <span className="font-semibold text-textPrimary">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Section - Top Sources */}
      <div>
        <div className="text-textSecondary uppercase tracking-wide text-[0.7rem] opacity-75 mb-2">
          TOP SOURCES
        </div>
        <div className="space-y-2">
          {topSources.map((item, index) => {
            const iconUrl = getIconUrl(item);
            return (
              <div
                key={index}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={item.name}
                      className="w-4 h-4 rounded-full shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                      }}
                    />
                  )}
                  <span className="text-textPrimary truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-textPrimary ml-2">
                  {(item.percent * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
