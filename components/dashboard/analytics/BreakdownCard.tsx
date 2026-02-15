"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HorizontalStackedBarChart,
  MapChart,
  PieChart,
} from "@/components/chart";
import type { HorizontalStackedBarChartData } from "@/components/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { BreakdownData } from "./tooltips/PieChartTooltip";

interface BreakdownCardProps {
  title: string;
  tabs: readonly string[];
  selectedTab: string;
  data: BreakdownData[];
  onTabChange: (tab: string) => void;
  chartType?: "bar" | "pie" | "horizontalBar";
  colors?: string[];
  /** Website color scheme for revenue in breakdown charts (hex). Defaults to #E78468. */
  colorScheme?: string;
}

const DEFAULT_COLORS = ["#4f6d85", "#4a6880", "#6b8aa7", "#7a99b5", "#2d3d4d"];

const generateStackedData = (
  baseData: BreakdownData[],
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

const getChartConfig = (colorScheme: string): ChartConfig => ({
  visitors: {
    label: "Visitors",
    color: "#8dcdff",
  },
  revenue: {
    label: "Revenue",
    color: colorScheme,
  },
});

export function BreakdownCard({
  title,
  tabs,
  selectedTab,
  data,
  onTabChange,
  chartType = "bar",
  colors = DEFAULT_COLORS,
  colorScheme = "#E78468",
}: BreakdownCardProps) {
  const chartConfig = getChartConfig(colorScheme);
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
      return (
        <PieChart
          data={sanitizedData}
          colors={colors}
          height="h-96"
          colorScheme={colorScheme}
        />
      );
    }

    if (chartType === "horizontalBar") {
      const dataToUse = sanitizedData.length > 0 ? sanitizedData : [];
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
        <div className="flex flex-wrap items-start justify-between gap-x-2 px-0 py-1">
          <div className="mr-px flex flex-1 min-w-0">
            <div className="flex w-full items-center border-b border-stone-200">
              <Tabs
                value={selectedTab}
                onValueChange={onTabChange}
                className="w-full"
              >
                <TabsList className="z-5 inline-flex h-auto w-full flex-1 justify-start items-center gap-1 overflow-x-auto rounded-none border-0 bg-transparent p-0 text-sm shadow-none">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                    >
                      <span className="mb-1 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                        {tab}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex shrink-0 items-center gap-1 pb-1 pr-2">
                <button
                  type="button"
                  className="inline-flex h-auto flex-nowrap items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-medium text-textPrimary hover:bg-stone-100"
                >
                  <span className="-mr-0.5 inline-block max-w-20 truncate">
                    All
                  </span>
                  <ChevronDown className="size-3.5 opacity-60" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-auto flex-nowrap items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-medium text-textPrimary hover:bg-stone-100"
                >
                  <span className="inline-block truncate">Visitors</span>
                  <ArrowUpDown className="size-3.5 opacity-60" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="relative h-96 w-full max-w-full overflow-hidden">
          {(title === "Location" && selectedTab === "Map") ||
          chartType === "horizontalBar" ||
          chartType === "pie" ? (
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
