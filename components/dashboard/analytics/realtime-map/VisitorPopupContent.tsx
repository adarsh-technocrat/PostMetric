"use client";

import {
  generateVisitorName,
  getAvatarUrl,
  getConversionLikelihood,
  formatDuration,
  type Visitor,
} from "@/utils/realtime-map";

interface VisitorPopupContentProps {
  visitor: Visitor;
}

export function VisitorPopupContent({ visitor }: VisitorPopupContentProps) {
  const visitorName = generateVisitorName(visitor.visitorId, visitor.userId);
  const avatarUrl = getAvatarUrl(visitor.visitorId, visitor.country);
  const conversion = getConversionLikelihood(visitor.conversionScore);
  const duration = formatDuration(visitor.duration);
  const location =
    visitor.city && visitor.region
      ? `${visitor.city}, ${visitor.country}`
      : visitor.region
      ? `${visitor.region}, ${visitor.country}`
      : visitor.country;

  const referrerDomain = visitor.referrerDomain || "Direct";
  const referrerIcon =
    referrerDomain !== "Direct"
      ? `https://icons.duckduckgo.com/ip3/${referrerDomain}.ico`
      : "";

  // Estimated value (simplified calculation)
  const estimatedValue = visitor.conversionScore
    ? `$${((Math.abs(visitor.conversionScore) / 100) * 232.94).toFixed(2)}`
    : "$0.00";

  return (
    <div className="w-full overflow-hidden p-3 text-sm duration-100 !max-w-[500px]">
      <img
        src={avatarUrl}
        alt={visitorName}
        className="absolute left-3 top-3 rounded-full bg-base-200 ring-1 ring-base-content/10 transition-all duration-100 size-14 object-cover"
      />
      <div className="mb-3 pl-18">
        <div className="mb-1.5 space-y-0.5">
          <div className="flex items-center">
            <h3 className="truncate text-sm font-semibold">{visitorName}</h3>
          </div>
        </div>
        <div className="text-base-secondary grid grid-cols-2 gap-x-1.5 gap-y-1 text-xs leading-tight">
          <div className="flex items-center gap-1.5">
            <div
              className="inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm h-[10px] w-[15px]"
              title={visitor.country}
            >
              <img
                src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${visitor.country}.svg`}
                alt={`${visitor.country} flag`}
                className="h-full w-full saturate-[0.9]"
              />
            </div>
            <span title={location} className="truncate capitalize">
              {location}
            </span>
          </div>
          <div title={visitor.os} className="flex items-center gap-1.5">
            <span className="truncate">{visitor.os}</span>
          </div>
          <div title={visitor.device} className="flex items-center gap-1.5">
            <span className="truncate capitalize">{visitor.device}</span>
          </div>
          <div title={visitor.browser} className="flex items-center gap-1.5">
            <span className="truncate">{visitor.browser}</span>
          </div>
        </div>
      </div>
      <div className="space-y-1 border-t-[0.5px] border-base-content/10 pt-3 text-xs">
        <p className="flex items-center justify-between">
          <span className="text-base-secondary">Referrer:</span>
          <span className="flex max-w-[65%] items-center gap-1.5 truncate text-right">
            {referrerIcon && (
              <img
                src={referrerIcon}
                alt={referrerDomain}
                className="size-3 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span>{referrerDomain}</span>
          </span>
        </p>
        <p className="flex items-center justify-between">
          <span className="text-base-secondary">Current URL:</span>
          <span
            title={visitor.currentPath || "/"}
            className="max-w-[65%] truncate text-right font-medium"
          >
            <span className="rounded bg-base-300 px-1.5 py-0.5 font-mono text-[0.68rem] text-xs text-base-content">
              {visitor.currentPath || "/"}
            </span>
          </span>
        </p>
        <p className="flex items-center justify-between">
          <span className="text-base-secondary">Session time:</span>
          <span>{duration}</span>
        </p>
        <div className="flex items-center justify-between">
          <span className="text-base-secondary">Total visits:</span>
          <span className="font-medium">{visitor.pageViews}</span>
        </div>
      </div>
      <div className="mt-2 space-y-1 border-t-[0.5px] border-base-content/10 pt-2 text-xs">
        <div className="cursor-help space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-base-secondary">Conversion likelihood:</span>
            <span className="flex cursor-help items-center gap-1 font-medium">
              <span className="font-medium text-base-content">
                {conversion.percentage}
              </span>
              <span className="text-[0.65rem] opacity-70">vs. avg</span>
            </span>
          </div>
          <div className="pb-0.5">
            <div className="relative h-[6px]">
              <div
                className="absolute inset-0 overflow-hidden rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgb(214, 211, 209) 0%, rgb(168, 162, 158) 35%, rgb(120, 113, 108) 50%, rgb(87, 83, 78) 65%, rgb(28, 25, 23) 100%)",
                }}
              />
              <div
                className="absolute -top-[3px] z-10 bg-transparent"
                style={{ left: `${conversion.position}%` }}
              >
                <div
                  className="h-[12px] w-[12px] rounded-full border-[3px] border-base-content/60 bg-transparent ring-1 ring-base-100/80 dark:border-base-content"
                  style={{ transform: "translateX(-50%)" }}
                >
                  <div className="absolute inset-0 rounded-full border border-base-100/30 bg-transparent transition-all duration-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex cursor-help items-center justify-between">
          <span className="text-base-secondary">Estimated value:</span>
          <span className="flex cursor-help items-center gap-1 font-medium">
            <span className="font-medium text-success">{estimatedValue}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
