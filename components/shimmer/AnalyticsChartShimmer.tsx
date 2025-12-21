"use client";

interface AnalyticsChartShimmerProps {
  height?: string;
}

export function AnalyticsChartShimmer({
  height = "h-72 md:h-96",
}: AnalyticsChartShimmerProps) {
  return (
    <div className={height}>
      <div className="w-full h-full flex flex-col gap-4 p-4">
        {/* Y-axis labels shimmer */}
        <div className="flex items-start justify-between h-full">
          <div className="flex flex-col justify-between h-full gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              />
            ))}
          </div>
          {/* Chart area shimmer */}
          <div className="flex-1 h-full flex flex-col justify-between gap-2 ml-4">
            {/* Grid lines shimmer */}
            <div className="flex-1 relative">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="absolute w-full h-px bg-gray-200 dark:bg-gray-700 opacity-30"
                  style={{
                    top: `${(i - 1) * 20}%`,
                  }}
                />
              ))}
              {/* Chart bars/lines shimmer */}
              <div className="absolute inset-0 flex items-end justify-between gap-1 px-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg animate-pulse"
                    style={{
                      height: `${Math.random() * 60 + 20}%`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            {/* X-axis labels shimmer */}
            <div className="flex justify-between gap-1 h-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
