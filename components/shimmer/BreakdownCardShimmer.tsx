"use client";

export function BreakdownCardShimmer() {
  return (
    <section className="custom-card w-full max-w-full">
      <div className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-textPrimary/5 px-1 py-1">
          <div className="flex items-baseline gap-0">
            <div role="tablist" className="tabs tabs-sm ml-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-0">
            <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="relative h-96 w-full max-w-full overflow-hidden">
          <div className="w-full h-full flex flex-col gap-4 p-4">
            {/* Chart area shimmer */}
            <div className="flex-1 space-y-3">
              {/* Bars/Lines shimmer */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  style={{
                    width: `${Math.random() * 40 + 30}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            {/* X-axis labels shimmer */}
            <div className="flex justify-between gap-2 h-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
