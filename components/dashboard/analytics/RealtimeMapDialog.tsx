"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  Share2,
  Music,
  Maximize,
  Eye,
  Target,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";

interface Visitor {
  visitorId: string;
  sessionId: string;
  country: string;
  region?: string;
  city?: string;
  device: string;
  browser: string;
  os: string;
  referrer?: string;
  referrerDomain?: string;
  currentPath?: string;
  lastSeenAt: string;
  pageViews: number;
  duration: number;
  conversionScore?: number;
}

interface RealtimeMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
  websiteName?: string;
}

// Country to coordinates mapping (approximate centers)
const countryCoordinates: Record<string, [number, number]> = {
  US: [-95.7129, 37.0902],
  GB: [-3.436, 55.3781],
  CA: [-106.3468, 56.1304],
  AU: [133.7751, -25.2744],
  DE: [10.4515, 51.1657],
  FR: [2.2137, 46.2276],
  IT: [12.5674, 41.8719],
  ES: [-3.7492, 40.4637],
  NL: [5.2913, 52.1326],
  BE: [4.4699, 50.5039],
  CH: [8.2275, 46.8182],
  AT: [14.5501, 47.5162],
  SE: [18.6435, 60.1282],
  NO: [8.4689, 60.472],
  DK: [9.5018, 56.2639],
  FI: [25.7482, 61.9241],
  PL: [19.1451, 51.9194],
  IE: [-8.2439, 53.4129],
  PT: [-8.2245, 39.3999],
  GR: [21.8243, 39.0742],
  BR: [-51.9253, -14.235],
  MX: [-102.5528, 23.6345],
  AR: [-63.6167, -38.4161],
  CL: [-71.543, -35.6751],
  CO: [-74.2973, 4.5709],
  PE: [-75.0152, -9.19],
  IN: [78.9629, 20.5937],
  CN: [104.1954, 35.8617],
  JP: [138.2529, 36.2048],
  KR: [127.7669, 35.9078],
  SG: [103.8198, 1.3521],
  MY: [101.9758, 4.2105],
  TH: [100.9925, 15.87],
  ID: [113.9213, -0.7893],
  PH: [121.774, 12.8797],
  VN: [108.2772, 14.0583],
  TR: [35.2433, 38.9637],
  SA: [45.0792, 23.8859],
  AE: [53.8478, 23.4241],
  IL: [34.8516, 31.0461],
  ZA: [22.9375, -30.5595],
  NG: [8.6753, 9.082],
  EG: [30.8025, 26.8206],
  KE: [37.9062, -0.0236],
  RO: [24.9668, 45.9432],
};

function getCountryCoordinates(country: string): [number, number] {
  // Try to get coordinates for the country
  const coords = countryCoordinates[country.toUpperCase()];
  if (coords) return coords;

  // Default fallback (center of world map)
  return [0, 20];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }
}

function getConversionScoreColor(score?: number): string {
  if (!score) return "rgb(209, 213, 219)"; // gray
  if (score >= 80) return "rgb(239, 68, 68)"; // red
  if (score >= 60) return "rgb(253, 186, 116)"; // orange
  return "rgb(209, 213, 219)"; // gray
}

function generateVisitorName(visitorId: string): string {
  const adjectives = [
    "blue",
    "red",
    "green",
    "yellow",
    "purple",
    "orange",
    "pink",
    "cyan",
    "teal",
    "silver",
    "gold",
    "tan",
    "salmon",
    "coral",
    "lime",
    "navy",
  ];
  const nouns = [
    "quail",
    "peacock",
    "mink",
    "opossum",
    "lamprey",
    "stingray",
    "shark",
    "dolphin",
    "whale",
    "eagle",
    "hawk",
    "owl",
    "raven",
    "crow",
    "swan",
  ];

  const hash = visitorId.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  const adj = adjectives[hash % adjectives.length];
  const noun = nouns[(hash * 7) % nouns.length];

  return `${adj} ${noun}`;
}

export function RealtimeMapDialog({
  open,
  onOpenChange,
  websiteId,
  websiteName = "PostMetric",
}: RealtimeMapDialogProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!open || !mapContainer.current || map.current) return;

    // Get Mapbox token from environment variable
    // Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file
    const mapboxToken =
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      "pk.eyJ1IjoibWFyY2xvdSIsImEiOiJjbThmaGFuaG4wZm4xMmpxdHFzdW5hOW0wIn0.1dJSv-8xLT8GxVPR7nEIuw";

    if (!mapboxToken) {
      console.error("Mapbox token is not configured");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 2,
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [open]);

  // Fetch visitors
  useEffect(() => {
    if (!open || !websiteId) return;

    const fetchVisitors = async () => {
      try {
        const response = await fetch(
          `/api/websites/${websiteId}/realtime/visitors`
        );
        if (response.ok) {
          const data = await response.json();
          setVisitors(data.visitors || []);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching visitors:", error);
        setIsLoading(false);
      }
    };

    fetchVisitors();
    const interval = setInterval(fetchVisitors, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [open, websiteId]);

  // Update map markers
  useEffect(() => {
    if (!map.current || !visitors.length) return;

    // Remove old markers
    markers.current.forEach((marker) => marker.remove());
    markers.current.clear();

    // Add new markers
    visitors.forEach((visitor) => {
      const [lng, lat] = getCountryCoordinates(visitor.country);

      // Create marker element
      const el = document.createElement("div");
      el.className = "marker-container";
      el.innerHTML = `
        <div class="relative">
          <img 
            src="data:image/svg+xml;utf8,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 704 704" fill="none">
                <circle cx="352" cy="352" r="350" fill="#${visitor.visitorId
                  .slice(0, 6)
                  .padEnd(6, "0")}" />
              </svg>`
            )}" 
            alt="${generateVisitorName(visitor.visitorId)}"
            class="rounded-full ring-1 transition-all duration-100 bg-base-200 shadow-lg ring-base-content/10 dark:ring-base-content/20 size-14"
          />
          <div 
            class="absolute right-px top-px z-10 flex h-[13px] w-[13px] items-center justify-center rounded-full"
            style="background: ${getConversionScoreColor(
              visitor.conversionScore
            )};"
          >
            <div 
              class="absolute -inset-px rounded-full opacity-30"
              style="background: ${getConversionScoreColor(
                visitor.conversionScore
              )};"
            ></div>
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current!);

      markers.current.set(visitor.visitorId, marker);
    });
  }, [visitors]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 max-w-none w-screen h-screen p-0 m-0 rounded-none border-0 bg-gray-700">
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center">
            {/* Close button */}
            <div className="fixed right-2 top-2 z-50 md:right-4 md:top-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-transparent hover:bg-gray-600"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Map container */}
            <div className="h-dvh w-screen overflow-hidden relative">
              {/* Header card */}
              <div className="absolute left-0 top-0 z-10 w-full max-w-full md:left-4 md:top-4 md:w-96 md:rounded-box custom-card border border-base-content/10 bg-base-100 p-4 pb-0 shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-start gap-2 text-base-secondary">
                  <div className="flex items-center gap-1.5">
                    <Image
                      src="/icon.svg"
                      alt={`${websiteName} logo`}
                      width={28}
                      height={28}
                      className="size-4 md:size-6"
                    />
                    <a
                      href="/"
                      className="text-sm font-bold text-base-content hover:underline md:text-base"
                    >
                      {websiteName}
                    </a>
                  </div>
                  <div className="text-xs opacity-30 md:text-sm">|</div>
                  <div className="mt-0.5 text-xs font-medium uppercase tracking-wide md:text-sm">
                    Real-time
                  </div>
                  <div className="ml-auto flex items-center gap-1 max-md:hidden">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Music className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Maximize className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="mt-3 grid grid-cols-[65px_1fr] gap-2 border-t border-base-content/5 pb-1.5 pt-2 md:mt-3 md:pt-3">
                  <div className="my-0.5 py-0.5">
                    <div className="text-xs text-base-content/60">
                      Referrers
                    </div>
                  </div>
                  <div className="hide-scrollbar flex max-h-[54px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 pr-3 md:pb-1">
                    {Array.from(
                      new Set(visitors.map((v) => v.referrerDomain || "Direct"))
                    )
                      .slice(0, 5)
                      .map((ref) => (
                        <div
                          key={ref}
                          className="my-0.5 mr-1 flex flex-none animate-opacity cursor-pointer select-none items-center gap-1.5 rounded px-1.5 py-0.5 transition-all duration-200 bg-base-300 hover:bg-primary/10"
                        >
                          <span className="max-w-[100px] truncate text-xs">
                            {ref}
                          </span>
                          <span className="text-xs opacity-60">
                            (
                            {
                              visitors.filter(
                                (v) => (v.referrerDomain || "Direct") === ref
                              ).length
                            }
                            )
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="my-0.5 py-0.5">
                    <div className="text-xs text-base-content/60">
                      Countries
                    </div>
                  </div>
                  <div className="hide-scrollbar flex max-h-[54px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 pr-3 md:pb-1">
                    {Array.from(new Set(visitors.map((v) => v.country)))
                      .slice(0, 5)
                      .map((country) => (
                        <div
                          key={country}
                          className="my-0.5 mr-1 flex flex-none animate-opacity cursor-pointer select-none items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-200 bg-base-300 hover:bg-primary/10"
                        >
                          <div className="inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm h-[10px] w-[15px]">
                            <img
                              src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${country}.svg`}
                              alt={`${country} flag`}
                              className="h-full w-full saturate-[0.9]"
                            />
                          </div>
                          <span className="whitespace-nowrap text-xs">
                            {country}{" "}
                            <span className="text-xs opacity-60">
                              (
                              {
                                visitors.filter((v) => v.country === country)
                                  .length
                              }
                              )
                            </span>
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="my-0.5 py-0.5">
                    <div className="text-xs text-base-content/60">Devices</div>
                  </div>
                  <div className="hide-scrollbar flex max-h-[54px] overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 pr-3 md:pb-1">
                    {Array.from(new Set(visitors.map((v) => v.device))).map(
                      (device) => (
                        <div
                          key={device}
                          className="my-0.5 mr-1 flex flex-none animate-opacity cursor-pointer select-none items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-200 bg-base-300 hover:bg-primary/10"
                        >
                          <span className="text-xs capitalize">{device}</span>
                          <span className="text-xs opacity-60">
                            (
                            {visitors.filter((v) => v.device === device).length}
                            )
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Map */}
              <div ref={mapContainer} className="h-full w-full" />

              {/* Activity feed */}
              <div className="absolute bottom-0 left-0 z-10 max-h-[20vh] w-full max-w-full overflow-hidden bg-zinc-900/60 py-3 text-gray-400 ring-1 ring-base-content/10 backdrop-blur-sm dark:bg-zinc-900/40 md:bottom-4 md:left-4 md:max-h-[30vh] md:w-96 md:rounded-box">
                <div className="hide-scrollbar max-h-[calc(20vh-40px)] overflow-y-auto md:mt-2 md:max-h-[calc(30vh-40px)]">
                  <div className="space-y-1">
                    {visitors.slice(0, 10).map((visitor) => (
                      <div
                        key={visitor.visitorId}
                        className="flex items-start gap-1.5 py-1 text-xs cursor-pointer px-3 duration-100 hover:bg-zinc-600/20"
                      >
                        <div className="mt-0.5 shrink-0">
                          <Eye className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-100">
                            {generateVisitorName(visitor.visitorId)}
                          </span>
                          <span> from </span>
                          <span className="inline-flex items-baseline gap-1 truncate font-medium text-gray-100">
                            <div className="inline-flex shrink-0 overflow-hidden rounded-sm shadow-sm h-[10px] w-[15px]">
                              <img
                                src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${visitor.country}.svg`}
                                alt={`${visitor.country} flag`}
                                className="h-full w-full saturate-[0.9]"
                              />
                            </div>
                            <span className="font-medium text-gray-100">
                              {visitor.country}
                            </span>
                          </span>
                          <span> visited </span>
                          <span className="-mx-1 -my-0.5 ml-0 rounded bg-zinc-900/70 px-1 py-0.5 font-mono !text-[11px] font-medium text-gray-100 backdrop-blur-sm">
                            {visitor.currentPath || "/"}
                          </span>
                          <div className="mt-0 text-[10px] opacity-60">
                            {formatTimeAgo(visitor.lastSeenAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
