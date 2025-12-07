"use client";

interface WaitingForEventsBannerProps {
  chartData: Array<{ visitors: number }>;
  loading: boolean;
  domain?: string;
}

export function WaitingForEventsBanner({
  chartData,
  loading,
  domain,
}: WaitingForEventsBannerProps) {
  const hasEvents = chartData.some((point) => point.visitors > 0);
  const shouldShowBanner = !loading && chartData.length > 0 && !hasEvents;

  if (!shouldShowBanner) {
    return null;
  }

  return (
    <div className="relative mx-2 mb-0 z-0">
      <div className="bg-[#E16540] rounded-t-md px-2 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="shrink-0">
              <svg
                className="h-3 w-3 text-white animate-[spin_5s_linear_infinite]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xs font-medium text-white">
              Waiting for your first event from this website...
            </p>
          </div>
          {domain && (
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white hover:opacity-80 transition-opacity shrink-0"
            >
              <span className="text-xs font-medium">{domain}</span>
              <svg
                className="h-3 w-3 -rotate-45"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
