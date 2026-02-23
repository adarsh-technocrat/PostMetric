import { notFound } from "next/navigation";
import connectDB from "@/db";
import Website from "@/db/models/Website";
import { getVisitorsNow } from "@/utils/analytics/aggregations/getVisitorsNow.aggregation";
import { VisitorCountWidget } from "@/components/widgets/VisitorCountWidget";
import { VisitorsTrendWidget } from "@/components/widgets/VisitorsTrendWidget";
import { VisitorsByCountryWidget } from "@/components/widgets/VisitorsByCountryWidget";
import { VisitorsInLast30MinWidget } from "@/components/widgets/VisitorsInLast30MinWidget";

type WidgetType = "realtime" | "trend" | "country" | "last30";

interface WidgetPageProps {
  params: Promise<{ websiteId: string }>;
  searchParams: Promise<{
    shareId?: string;
    widget?: string;
    mainTextSize?: string;
    primaryColor?: string;
  }>;
}

export default async function WidgetPage({
  params,
  searchParams,
}: WidgetPageProps) {
  const { websiteId } = await params;
  const {
    shareId,
    widget = "realtime",
    mainTextSize = "16",
    primaryColor,
  } = await searchParams;

  if (!shareId) {
    notFound();
  }

  await connectDB();

  const website = await Website.findById(websiteId);

  if (!website) {
    notFound();
  }

  if (
    !website.settings?.publicDashboard?.enabled ||
    website.settings.publicDashboard.shareId !== shareId
  ) {
    notFound();
  }

  const color =
    primaryColor || (website.settings?.colorScheme as string) || "#e78468";
  const widgetType = widget as WidgetType;

  if (widgetType === "trend") {
    return (
      <div className="min-h-screen bg-transparent p-4">
        <VisitorsTrendWidget
          websiteId={websiteId}
          shareId={shareId}
          mainTextSize={parseInt(mainTextSize, 10) || 16}
          primaryColor={color}
        />
      </div>
    );
  }

  if (widgetType === "country") {
    return (
      <div className="min-h-screen bg-transparent p-4">
        <VisitorsByCountryWidget
          websiteId={websiteId}
          shareId={shareId}
          primaryColor={color}
        />
      </div>
    );
  }

  if (widgetType === "last30") {
    return (
      <div className="min-h-screen bg-transparent p-4">
        <VisitorsInLast30MinWidget
          websiteId={websiteId}
          shareId={shareId}
          mainTextSize={parseInt(mainTextSize, 10) || 24}
          primaryColor={color}
        />
      </div>
    );
  }

  const visitorsNow = await getVisitorsNow(websiteId);
  return (
    <div className="min-h-screen bg-transparent">
      <VisitorCountWidget
        websiteId={websiteId}
        shareId={shareId}
        initialCount={visitorsNow}
        mainTextSize={parseInt(mainTextSize, 10) || 16}
        primaryColor={color}
      />
    </div>
  );
}
