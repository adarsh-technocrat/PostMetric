"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { HorizontalStackedBarChart, MapChart } from "@/components/chart";
import type { HorizontalStackedBarChartData } from "@/components/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  PieChartTooltip,
  type BreakdownData,
} from "./tooltips/PieChartTooltip";

interface BreakdownCardProps {
  title: string;
  tabs: readonly string[];
  selectedTab: string;
  data: BreakdownData[];
  onTabChange: (tab: string) => void;
  chartType?: "bar" | "pie" | "horizontalBar";
  colors?: string[];
}

const DEFAULT_COLORS = ["#8dcdff", "#7888b2", "#E16540", "#94a3b8", "#cbd5e1"];

const generateStackedData = (
  baseData: BreakdownData[]
): HorizontalStackedBarChartData[] => {
  return baseData.map((item) => {
    const itemName = item.name || "Unknown";
    const cleanName = itemName
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "")
      .trim();

    const iconUrl =
      item.image ||
      (cleanName.includes(".")
        ? `https://icons.duckduckgo.com/ip3/${cleanName}.ico`
        : undefined);

    return {
      name: itemName,
      icon: iconUrl,
      visitors: item.uv || 0,
      revenue: item.revenue ? Math.round(item.revenue / 100) : 0,
    };
  });
};

const chartConfig: ChartConfig = {
  visitors: {
    label: "Visitors",
    color: "#8dcdff",
  },
  revenue: {
    label: "Revenue",
    color: "#E16540",
  },
};

export function BreakdownCard({
  title,
  tabs,
  selectedTab,
  data,
  onTabChange,
  chartType = "bar",
  colors = DEFAULT_COLORS,
}: BreakdownCardProps) {
  const sanitizedData = data
    .map((item) => ({
      ...item,
      uv: typeof item.uv === "number" && !isNaN(item.uv) ? item.uv : 0,
      revenue:
        typeof item.revenue === "number" && !isNaN(item.revenue)
          ? item.revenue
          : 0,
    }))
    .filter((item) => item.uv >= 0);

  const renderChart = () => {
    if (title === "Location" && selectedTab === "Map") {
      return <MapChart data={sanitizedData} height="h-96" />;
    }

    if (chartType === "pie") {
      const pieData = sanitizedData.map((item) => ({
        name: item.name || "Unknown",
        value: item.uv || 0,
        payload: item, // Include full item data for tooltip
      }));

      const minPercentForLabel = 0.05;

      // Custom label component to render both text and referrer images
      const renderCustomLabel = (props: any) => {
        const {
          cx,
          cy,
          midAngle,
          innerRadius,
          outerRadius,
          name,
          percent,
          payload,
        } = props;

        // Calculate position for text label (outside the pie)
        const textRadius = outerRadius + 20;
        const textX = cx + textRadius * Math.cos(-midAngle * (Math.PI / 180));
        const textY = cy + textRadius * Math.sin(-midAngle * (Math.PI / 180));

        // Calculate position for referrer images (center of the slice)
        const imageRadius = (innerRadius + outerRadius) / 2;
        const imageX = cx + imageRadius * Math.cos(-midAngle * (Math.PI / 180));
        const imageY = cy + imageRadius * Math.sin(-midAngle * (Math.PI / 180));

        // Get top referrers with images (up to 3)
        const referrersWithImages = payload?.referrers
          ? payload.referrers.filter((ref: any) => ref.image).slice(0, 3)
          : [];

        return (
          <g>
            {/* Text label */}
            {percent >= minPercentForLabel && (
              <text
                x={textX}
                y={textY}
                fill="currentColor"
                textAnchor={textX > cx ? "start" : "end"}
                dominantBaseline="central"
                className="text-xs fill-textSecondary"
              >
                {`${name} ${(percent * 100).toFixed(0)}%`}
              </text>
            )}

            {/* Referrer images in center of slice */}
            {referrersWithImages.length > 0 && (
              <g>
                {referrersWithImages.map((referrer: any, index: number) => {
                  const iconSize = referrersWithImages.length === 1 ? 20 : 16;
                  const spacing = referrersWithImages.length === 1 ? 0 : 6;
                  const totalWidth =
                    referrersWithImages.length * iconSize +
                    (referrersWithImages.length - 1) * spacing;
                  const startX = imageX - totalWidth / 2;
                  const iconX = startX + index * (iconSize + spacing);

                  return (
                    <image
                      key={`referrer-${index}`}
                      x={iconX}
                      y={imageY - iconSize / 2}
                      width={iconSize}
                      height={iconSize}
                      href={referrer.image}
                      style={{
                        clipPath: "circle(50%)",
                      }}
                      onError={(e: any) => {
                        e.target.style.display = "none";
                      }}
                    />
                  );
                })}
              </g>
            )}
          </g>
        );
      };

      return (
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            cornerRadius="5%"
            innerRadius="30%"
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<PieChartTooltip allData={sanitizedData} />} />
        </PieChart>
      );
    }

    if (chartType === "horizontalBar") {
      const dataToUse =
        sanitizedData.length > 0
          ? sanitizedData
          : [
              { name: "Sample 1", uv: 100, revenue: 0 },
              { name: "Sample 2", uv: 80, revenue: 0 },
              { name: "Sample 3", uv: 60, revenue: 0 },
            ];
      const stackedData = generateStackedData(dataToUse);
      return (
        <HorizontalStackedBarChart
          data={stackedData}
          config={chartConfig}
          height="h-96"
          maxItems={10}
          showCard={false}
        />
      );
    }

    const barData = sanitizedData.map((item) => ({
      name: item.name || "Unknown",
      value: item.uv || 0,
    }));

    return (
      <BarChart data={barData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.3} />
        <XAxis
          dataKey="name"
          stroke="#666"
          angle={title === "Location" ? -45 : 0}
          textAnchor={title === "Location" ? "end" : "middle"}
          height={title === "Location" ? 80 : undefined}
        />
        <YAxis stroke="#666" />
        <Tooltip />
        <Bar dataKey="value" fill="#8dcdff" />
      </BarChart>
    );
  };

  return (
    <section className="custom-card w-full max-w-full" id={title}>
      <div className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-x-2 border-b border-textPrimary/5 px-1 py-1">
          <div className="flex items-baseline gap-0">
            <div role="tablist" className="tabs tabs-sm ml-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  className={`tab h-8! px-2! font-medium duration-100 ${
                    selectedTab === tab
                      ? "tab-active text-textPrimary"
                      : "text-textSecondary opacity-50 hover:text-textPrimary hover:opacity-80"
                  }`}
                  onClick={() => onTabChange(tab)}
                >
                  <div className="flex items-center gap-1.5">{tab}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-0">
            <Button
              variant="ghost"
              size="sm"
              className="inline-flex flex-nowrap items-center gap-0.5 px-1.5 text-xs font-medium border-borderColor bg-white text-textPrimary hover:bg-gray-50 h-auto py-1"
            >
              <span className="-mr-0.5 inline-block max-w-20 truncate">
                All
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-3.5 opacity-50 duration-200 group-hover:opacity-100"
              >
                <path
                  fillRule="evenodd"
                  d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>
          </div>
        </div>
        <div className="relative h-96 w-full max-w-full overflow-hidden">
          {title === "Location" && selectedTab === "Map" ? (
            <div className="w-full h-full max-w-full">{renderChart()}</div>
          ) : chartType === "horizontalBar" ? (
            <div className="w-full h-full max-w-full">{renderChart()}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
