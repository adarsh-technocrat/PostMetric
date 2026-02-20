"use client";

import { useRef, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  setShowMentionsOnChart,
  setShowRevenueOnChart,
  setShowVisitorsOnChart,
} from "@/store/slices/uiSlice";
import { AnalyticsChart } from "@/components/chart";
import { PeriodSelector } from "@/components/dashboard/analytics/PeriodSelector";
import { GranularitySelector } from "@/components/dashboard/analytics/GranularitySelector";
import { MetricsList } from "@/components/dashboard/analytics/MetricsList";
import { BreakdownCard } from "@/components/dashboard/analytics/BreakdownCard";
import { GoalsCard } from "@/components/dashboard/analytics/GoalsCard";
import { FloatingActionButtons } from "@/components/dashboard/analytics/FloatingActionButtons";
import { RealtimeMapDialog } from "@/components/dashboard/analytics/RealtimeMapDialog";
import { InsightsDialog } from "@/components/dashboard/analytics/InsightsDialog";
import { MentionsDialog } from "@/components/dashboard/analytics/MentionsDialog";
import { Button } from "@/components/ui/button";
import {
  useWebsiteAnalytics,
  type WebsiteSettings,
} from "@/hooks/use-website-analytics";
import { DEMO_WEBSITE_ID } from "@/lib/demo-website";

export default function DemoPage() {
  const dispatch = useAppDispatch();
  const locationCardRef = useRef<HTMLDivElement>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [insightsDialogOpen, setInsightsDialogOpen] = useState(false);

  const {
    ui,
    website,
    periodOffset,
    customDateRange,
    mentionDialogOpen,
    selectedMentionData,
    canGoNext,
    availableGranularities,
    analytics,
    refetch,
    chartData,
    metricsData,
    revenueBreakdown,
    sourceData,
    pathData,
    locationData,
    systemData,
    visitorsNow,
    isConnected,
    handlePreviousPeriod,
    handleNextPeriod,
    handlePeriodSelect,
    setCustomDateRange,
    setMentionDialogOpen,
    setSelectedMentionData,
    setSelectedSourceTab,
    setSelectedPathTab,
    setSelectedLocationTab,
    setSelectedSystemTab,
    setSelectedGoalTab,
    setSelectedGranularity,
  } = useWebsiteAnalytics({ websiteId: DEMO_WEBSITE_ID });

  const colorScheme =
    (website?.settings as WebsiteSettings)?.colorScheme || "#E78468";

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6">
      <main className="mx-auto max-w-7xl pb-32">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mt-2 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector
              selectedPeriod={ui.selectedPeriod}
              periodOffset={periodOffset}
              customDateRange={customDateRange}
              onPeriodChange={handlePeriodSelect}
              onPreviousPeriod={handlePreviousPeriod}
              onNextPeriod={handleNextPeriod}
              onCustomDateRangeChange={setCustomDateRange}
              canGoNext={canGoNext}
            />
            <GranularitySelector
              selectedGranularity={ui.selectedGranularity}
              availableGranularities={availableGranularities}
              onGranularityChange={setSelectedGranularity}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border border-stone-200 bg-white rounded-md"
              title="Refresh"
              onClick={() => refetch()}
              disabled={analytics.loading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className={`size-4 ${analytics.loading ? "animate-spin" : ""}`}
              >
                <path
                  fillRule="evenodd"
                  d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 10a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V8.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2 min-w-0">
            <section className="custom-card group rounded-lg border border-stone-200 bg-white shadow-sm overflow-hidden">
              <MetricsList
                visitors={metricsData.visitors}
                revenue={metricsData.revenue}
                conversionRate={metricsData.conversionRate}
                revenuePerVisitor={metricsData.revenuePerVisitor}
                bounceRate={metricsData.bounceRate}
                sessionTime={metricsData.sessionTime}
                visitorsNow={{ value: visitorsNow }}
                showRevenueOnChart={ui.showRevenueOnChart}
                showMentionsOnChart={ui.showMentionsOnChart}
                showVisitorsOnChart={ui.showVisitorsOnChart}
                isConnected={isConnected}
                currency={
                  (website?.settings as WebsiteSettings)?.currency || "USD"
                }
                colorScheme={colorScheme}
                revenueBreakdown={revenueBreakdown}
                onShowRevenueChange={(checked) =>
                  dispatch(setShowRevenueOnChart(checked))
                }
                onShowMentionsChange={(checked) =>
                  dispatch(setShowMentionsOnChart(checked))
                }
                onShowVisitorsChange={(checked) =>
                  dispatch(setShowVisitorsOnChart(checked))
                }
              />
              <div className="pb-4 px-4">
                <AnalyticsChart
                  data={chartData}
                  showMentions={ui.showMentionsOnChart}
                  showRevenue={ui.showRevenueOnChart}
                  showVisitors={ui.showVisitorsOnChart}
                  currency={
                    (website?.settings as WebsiteSettings)?.currency || "USD"
                  }
                  colorScheme={colorScheme}
                  onMentionClick={(data) => {
                    setSelectedMentionData(data);
                    setMentionDialogOpen(true);
                  }}
                  height="h-64 md:h-80"
                  loading={analytics.loading}
                />
              </div>
            </section>
          </div>

          <div className="min-w-0">
            <BreakdownCard
              title="Source"
              tabs={["Channel", "Referrer", "Campaign", "Keyword"] as const}
              selectedTab={ui.selectedSourceTab}
              data={sourceData}
              onTabChange={setSelectedSourceTab}
              chartType={
                ui.selectedSourceTab === "Channel" ? "pie" : "horizontalBar"
              }
              colorScheme={colorScheme}
            />
          </div>

          <div className="min-w-0">
            <BreakdownCard
              title="Path"
              tabs={["Hostname", "Page", "Entry page", "Exit link"] as const}
              selectedTab={ui.selectedPathTab}
              data={pathData}
              onTabChange={setSelectedPathTab}
              chartType="horizontalBar"
              colorScheme={colorScheme}
            />
          </div>

          <div ref={locationCardRef} className="min-w-0">
            <BreakdownCard
              title="Location"
              tabs={["Map", "Country", "Region", "City"] as const}
              selectedTab={ui.selectedLocationTab}
              data={locationData}
              onTabChange={setSelectedLocationTab}
              chartType={
                ui.selectedLocationTab === "Map" ? "bar" : "horizontalBar"
              }
              colorScheme={colorScheme}
            />
          </div>

          <div className="min-w-0">
            <BreakdownCard
              title="System"
              tabs={["Browser", "OS", "Device"] as const}
              selectedTab={ui.selectedSystemTab}
              data={systemData}
              onTabChange={setSelectedSystemTab}
              chartType="horizontalBar"
              colorScheme={colorScheme}
            />
          </div>

          <div className="md:col-span-2">
            <GoalsCard
              selectedTab={ui.selectedGoalTab}
              onTabChange={setSelectedGoalTab}
              readOnly
            />
          </div>
        </div>
      </main>

      <MentionsDialog
        open={mentionDialogOpen}
        onOpenChange={setMentionDialogOpen}
        mentionData={selectedMentionData}
        showMentionsOnChart={ui.showMentionsOnChart}
        onShowMentionsChange={(checked) =>
          dispatch(setShowMentionsOnChart(checked))
        }
      />

      <RealtimeMapDialog
        open={mapDialogOpen}
        onOpenChange={setMapDialogOpen}
        websiteId={DEMO_WEBSITE_ID}
        websiteName={website?.name || "Postmetric"}
        websiteDomain={website?.domain}
        websiteIconUrl={website?.iconUrl}
        readOnly
      />

      <InsightsDialog
        open={insightsDialogOpen}
        onOpenChange={setInsightsDialogOpen}
        websiteId={DEMO_WEBSITE_ID}
      />

      <FloatingActionButtons
        onOpenMap={() => setMapDialogOpen(true)}
        onOpenInsights={() => setInsightsDialogOpen(true)}
        onOpenAlerts={() => {}}
        showAlerts={false}
        showFeedback={false}
      />
    </div>
  );
}
