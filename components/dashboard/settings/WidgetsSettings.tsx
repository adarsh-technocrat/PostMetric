"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodeBlock } from "@/components/ui/code-block";
import { toast } from "@/lib/toast";
import { useAppDispatch } from "@/store/hooks";
import { updateWebsiteSettingsAndConfiguration } from "@/store/slices/websitesSlice";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type WidgetTab = "realtime" | "trend" | "country" | "last30";

function WidgetPreviewArea({
  widgetUrl,
  updating,
}: {
  widgetUrl: string | null;
  updating: boolean;
}) {
  if (!widgetUrl) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-dashed border-base-content/20 bg-base-200/50 text-base-secondary text-sm">
        {updating ? "Saving..." : "Loading preview..."}
      </div>
    );
  }
  return (
    <iframe
      title="Postmetric Widget"
      className="h-[400px] w-full"
      src={widgetUrl}
    />
  );
}

interface WidgetsSettingsProps {
  website: {
    _id: string;
    domain: string;
    name: string;
    settings?: {
      publicDashboard?: {
        enabled: boolean;
        shareId?: string;
      };
      colorScheme?: string;
    };
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

export function WidgetsSettings({
  website,
  websiteId,
  onUpdate,
}: WidgetsSettingsProps) {
  const dispatch = useAppDispatch();
  const [enabled, setEnabled] = useState(
    website?.settings?.publicDashboard?.enabled ?? false,
  );
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<WidgetTab>("realtime");
  const [revenueColor, setRevenueColor] = useState("#e78468");
  const [visitorsColor, setVisitorsColor] = useState("#8dcdff");
  const [theme, setTheme] = useState("system");
  const [codeFormat, setCodeFormat] = useState<"html" | "jsx">("html");

  useEffect(() => {
    setEnabled(website?.settings?.publicDashboard?.enabled ?? false);
  }, [website?.settings?.publicDashboard?.enabled]);

  const shareId = website?.settings?.publicDashboard?.shareId;
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://postmetric.io";
  const buildWidgetUrl = (widget: WidgetTab) =>
    shareId
      ? `${baseUrl}/widgets/${websiteId}?shareId=${encodeURIComponent(shareId)}&widget=${widget}&mainTextSize=16&primaryColor=${encodeURIComponent(revenueColor)}&secondaryColor=${encodeURIComponent(visitorsColor)}`
      : null;
  const widgetUrl = buildWidgetUrl(activeTab);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    setUpdating(true);
    try {
      await dispatch(
        updateWebsiteSettingsAndConfiguration({
          websiteId,
          updates: {
            settings: {
              ...website?.settings,
              publicDashboard: {
                enabled: checked,
                shareId:
                  checked && !website?.settings?.publicDashboard?.shareId
                    ? `share_${websiteId}_${Date.now()}`
                    : website?.settings?.publicDashboard?.shareId,
              },
            },
          },
        }),
      ).unwrap();
      onUpdate();
    } catch (error) {
      setEnabled(!checked);
      toast.error("Failed to update widget settings");
    } finally {
      setUpdating(false);
    }
  };

  const generateEmbedCode = () => {
    const url =
      widgetUrl ||
      `${baseUrl}/widgets/${websiteId}?shareId=YOUR_SHARE_ID&widget=${activeTab}&mainTextSize=16&primaryColor=%23e78468&secondaryColor=%238dcdff`;
    const height = activeTab === "trend" || activeTab === "country" ? 280 : 180;
    const iframeCode = `<iframe
  src="${url}"
  style="background: transparent !important; border: none; width: 100%; height: ${height}px;"
  frameborder="0"
  allowtransparency="true"
  title="Postmetric Widget"
  loading="lazy"
></iframe>`;

    if (codeFormat === "jsx") {
      return iframeCode
        .replace(/frameborder/g, "frameBorder")
        .replace(/allowtransparency/g, "allowTransparency");
    }

    return iframeCode;
  };

  return (
    <section className="space-y-4 min-w-0 overflow-x-hidden">
      <div className="custom-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-1.5">
            <h2 className="font-medium">Widgets</h2>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={updating}
          />
        </div>
        {!enabled && (
          <p className="text-base-secondary px-4 pb-4 text-sm">
            Enable this to display public widgets showing aggregated metrics
            like total visitor count and page views. No sensitive or personal
            data will be shared.
          </p>
        )}
      </div>

      {enabled && (
        <>
          <div className="custom-card relative overflow-hidden bg-base-200 min-w-0 max-w-full">
            <div
              className="absolute inset-0 text-base-content opacity-[0.08]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='currentColor' fill-opacity='1' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as WidgetTab)}
                className="w-full"
              >
                <div className="w-full border-b border-stone-200 bg-transparent">
                  <TabsList className="inline-flex h-auto w-full flex-1 justify-start items-center gap-1 overflow-x-auto rounded-none border-0 bg-transparent p-0 text-sm shadow-none">
                    <TabsTrigger
                      value="realtime"
                      className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                    >
                      <span className="mb-1 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                        Realtime
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="trend"
                      className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                    >
                      <span className="mb-1 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                        Trend
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="country"
                      className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                    >
                      <span className="mb-1 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                        Countries
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="last30"
                      className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                    >
                      <span className="mb-1 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                        Live
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="realtime" className="mt-0">
                  <div className="flex items-center justify-center p-6 min-w-0">
                    <div
                      data-theme={theme}
                      className="w-full max-w-full bg-transparent! min-w-0"
                    >
                      <WidgetPreviewArea
                        widgetUrl={widgetUrl}
                        updating={updating}
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="trend" className="mt-0">
                  <div className="flex items-center justify-center p-6 min-w-0">
                    <div
                      data-theme={theme}
                      className="w-full max-w-full bg-transparent! min-w-0"
                    >
                      <WidgetPreviewArea
                        widgetUrl={widgetUrl}
                        updating={updating}
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="country" className="mt-0">
                  <div className="flex items-center justify-center p-6 min-w-0">
                    <div
                      data-theme={theme}
                      className="w-full max-w-full bg-transparent! min-w-0"
                    >
                      <WidgetPreviewArea
                        widgetUrl={widgetUrl}
                        updating={updating}
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="last30" className="mt-0">
                  <div className="flex items-center justify-center p-6 min-w-0">
                    <div
                      data-theme={theme}
                      className="w-full max-w-full bg-transparent! min-w-0"
                    >
                      <WidgetPreviewArea
                        widgetUrl={widgetUrl}
                        updating={updating}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <Card className="custom-card min-w-0 max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Embed code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 min-w-0 overflow-hidden">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 min-w-0">
                <div className="space-y-2 min-w-0">
                  <Label className="text-base-secondary text-xs font-medium">
                    Revenue color
                  </Label>
                  <Input
                    type="color"
                    value={revenueColor}
                    onChange={(e) => setRevenueColor(e.target.value)}
                    className="input input-sm h-8 w-full cursor-pointer rounded-md p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className="text-base-secondary text-xs font-medium">
                    Visitors color
                  </Label>
                  <Input
                    type="color"
                    value={visitorsColor}
                    onChange={(e) => setVisitorsColor(e.target.value)}
                    className="input input-sm h-8 w-full cursor-pointer rounded-md p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className="text-base-secondary text-xs font-medium">
                    Theme
                  </Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="h-9 w-full border-base-content/10 bg-background">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent className="border-base-content/10">
                      <SelectItem value="system">🤖 System</SelectItem>
                      <SelectItem value="light">🌞 Light</SelectItem>
                      <SelectItem value="dark">🌙 Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between min-w-0 gap-2">
                  <p className="text-base-secondary text-sm min-w-0 truncate">
                    Add this snippet to your website:
                  </p>
                  <Select
                    value={codeFormat}
                    onValueChange={(v) => setCodeFormat(v as "html" | "jsx")}
                  >
                    <SelectTrigger className="h-8 w-24 shrink-0 border-base-content/10 bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-base-content/10">
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="jsx">JSX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="code-editor-light relative min-w-0 max-w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                  <CodeBlock
                    code={generateEmbedCode()}
                    language={codeFormat === "jsx" ? "jsx" : "markup"}
                    showCopyButton={true}
                    onCopy={() => toast.success("Copied to clipboard")}
                    className="bg-transparent! border-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
