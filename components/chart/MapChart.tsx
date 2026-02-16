"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapChartProps {
  data?: unknown[];
  height?: string;
}

const DEFAULT_FILL = "#f1f5f9";
const DEFAULT_STROKE = "#cbd5e1";
const HOVER_FILL = "#e2e8f0";

function isAntarctica(geo: { properties: Record<string, unknown> }): boolean {
  const p = geo.properties;
  const code = (p.ISO_A2 ??
    p.ISO_A2_EH ??
    p.iso_a2 ??
    p.iso_a2_eh ??
    "") as string;
  const code3 = (p.ISO_A3 ?? p.iso_a3 ?? "") as string;
  const name = (
    (p.name ?? p.NAME ?? p.NAME_LONG ?? "") as string
  ).toLowerCase();
  if (
    String(code).toUpperCase() === "AQ" ||
    String(code3).toUpperCase() === "ATA"
  )
    return true;
  if (name.includes("antarctica")) return true;
  return false;
}

export function MapChart({ height = "h-96" }: MapChartProps) {
  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  return (
    <div
      className={`relative w-full ${height} flex items-center justify-center p-4`}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 165,
          center: [0, 15],
        }}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies
              .filter((geo) => !isAntarctica(geo))
              .map((geo) => {
                const countryCode =
                  geo.properties.ISO_A2 || geo.properties.ISO_A2_EH;
                const countryName =
                  countries.getName(countryCode, "en") || countryCode;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={DEFAULT_FILL}
                    stroke={DEFAULT_STROKE}
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: HOVER_FILL,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill: "#cbd5e1",
                        outline: "none",
                      },
                    }}
                    onMouseEnter={(event) => {
                      setTooltipContent(countryName);
                      setTooltipPosition({
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                    onMouseMove={(event) => {
                      setTooltipPosition({
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("");
                      setTooltipPosition(null);
                    }}
                  />
                );
              })
          }
        </Geographies>
      </ComposableMap>
      {tooltipContent && tooltipPosition && (
        <div
          className="fixed z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded shadow-lg pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 10}px`,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
}
