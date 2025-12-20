"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapData {
  name: string;
  uv?: number;
  value?: number;
  revenue?: number;
  flag?: string;
  countryCode?: string;
}

interface MapChartProps {
  data: MapData[];
  height?: string;
}

function getCountryCode(countryName: string): string | null {
  const code = countries.getAlpha2Code(countryName, "en");
  if (code) return code;
  if (countryName.length === 2) {
    return countryName.toUpperCase();
  }

  const nameVariations: Record<string, string> = {
    "United States": "US",
    "United States of America": "US",
    "United Kingdom": "GB",
    UK: "GB",
    Russia: "RU",
    "South Korea": "KR",
    "North Korea": "KP",
    "Czech Republic": "CZ",
    Czechia: "CZ",
  };

  if (nameVariations[countryName]) {
    return nameVariations[countryName];
  }

  return null;
}

export function MapChart({ data, height = "h-96" }: MapChartProps) {
  const countryDataMap = new Map<string, number>();

  data.forEach((item) => {
    const countryCode = item.countryCode || getCountryCode(item.name);
    if (countryCode) {
      const value = item.uv || item.value || 0;
      const existing = countryDataMap.get(countryCode.toUpperCase()) || 0;
      countryDataMap.set(countryCode.toUpperCase(), existing + value);
    }
  });

  const values = Array.from(countryDataMap.values());
  const maxValue = values.length > 0 ? Math.max(...values) : 0;

  const colorScale = scaleLinear<string>()
    .domain([0, maxValue])
    .range(["#e0f2fe", "#0ea5e9", "#0369a1"]);

  const [tooltipContent, setTooltipContent] = useState<string>("");
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className={`relative w-full ${height}`}>
      <ComposableMap
        projectionConfig={{
          scale: 147,
          center: [0, 20],
        }}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryCode =
                geo.properties.ISO_A2 || geo.properties.ISO_A2_EH;
              const value = countryDataMap.get(countryCode) || 0;
              const fillColor = value > 0 ? colorScale(value) : "#f1f5f9";
              const strokeColor = value > 0 ? "#0ea5e9" : "#cbd5e1";

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={0.5}
                  style={{
                    default: {
                      outline: "none",
                    },
                    hover: {
                      fill: value > 0 ? "#0284c7" : "#e2e8f0",
                      outline: "none",
                      cursor: "pointer",
                    },
                    pressed: {
                      fill: value > 0 ? "#0369a1" : "#cbd5e1",
                      outline: "none",
                    },
                  }}
                  onMouseEnter={(event) => {
                    const countryName =
                      countries.getName(countryCode, "en") || countryCode;
                    setTooltipContent(
                      `${countryName}: ${value.toLocaleString()} visitor${
                        value !== 1 ? "s" : ""
                      }`
                    );
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
      {maxValue > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Visitors</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colorScale(0) }}
              />
              <span className="text-xs text-gray-600">0</span>
            </div>
            <div className="flex-1 h-2 bg-gradient-to-r from-blue-100 via-blue-400 to-blue-700 rounded" />
            <div className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colorScale(maxValue) }}
              />
              <span className="text-xs text-gray-600">
                {maxValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
