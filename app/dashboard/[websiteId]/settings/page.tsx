"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import { GeneralSettings } from "@/components/dashboard/settings/GeneralSettings";
import { RevenueSettings } from "@/components/dashboard/settings/RevenueSettings";
import { TeamSettings } from "@/components/dashboard/settings/TeamSettings";
import { SecuritySettings } from "@/components/dashboard/settings/SecuritySettings";
import { ExclusionsSettings } from "@/components/dashboard/settings/ExclusionsSettings";
import { APISettings } from "@/components/dashboard/settings/APISettings";
import { IntegrationsSettings } from "@/components/dashboard/settings/IntegrationsSettings";
import { ReportsSettings } from "@/components/dashboard/settings/ReportsSettings";
import { ImportSettings } from "@/components/dashboard/settings/ImportSettings";
import { WidgetsSettings } from "@/components/dashboard/settings/WidgetsSettings";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SETTINGS_TABS = [
  { id: "general", label: "General" },
  { id: "revenue", label: "Revenue" },
  { id: "team", label: "Team" },
  { id: "import", label: "Import" },
  { id: "reports", label: "Reports" },
  { id: "widgets", label: "Widgets" },
  { id: "integrations", label: "Integrations" },
  { id: "api", label: "API" },
  { id: "exclusions", label: "Exclusions" },
  { id: "security", label: "Security" },
] as const;

const TAB_IDS = new Set(SETTINGS_TABS.map((t) => t.id));

export default function SettingsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const dispatch = useAppDispatch();
  const website = useAppSelector((state) => state.websites.currentWebsite) as {
    _id: string;
    domain: string;
    name: string;
    userId: string;
    iconUrl?: string;
    trackingCode?: string;
    settings?: {
      timezone?: string;
      colorScheme?: string;
      nickname?: string;
      additionalDomains?: string[];
      publicDashboard?: {
        enabled: boolean;
        shareId?: string;
      };
      attackMode?: {
        enabled: boolean;
        autoActivate: boolean;
        threshold?: number;
        activatedAt?: Date;
      };
      excludeIps?: string[];
      excludePaths?: string[];
      excludeHostnames?: string[];
      excludeCountries?: string[];
    };
    integrations?: {
      googleSearchConsole?: {
        enabled: boolean;
        propertyUrl?: string;
      };
      github?: {
        enabled: boolean;
        repositories?: Array<{ owner: string; name: string }>;
      };
      twitter?: {
        enabled: boolean;
        username?: string;
      };
    };
  } | null;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabFromUrl = searchParams.get("tab");
  const activeTab = useMemo(() => {
    if (
      tabFromUrl &&
      TAB_IDS.has(tabFromUrl as (typeof SETTINGS_TABS)[number]["id"])
    ) {
      return tabFromUrl as (typeof SETTINGS_TABS)[number]["id"];
    }
    return "general";
  }, [tabFromUrl]);

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "general") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  useEffect(() => {
    if (websiteId) {
      dispatch(fetchWebsiteDetailsById(websiteId));
    }
  }, [websiteId, dispatch]);

  const handleUpdate = () => {
    dispatch(fetchWebsiteDetailsById(websiteId));
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl h-full min-w-0 overflow-x-hidden">
      <p className="text-stone-800 font-semibold text-lg">
        Settings for {website?.domain || website?.name || "Loading..."}
      </p>
      <section className="w-full max-w-full min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-x-2 px-0 py-1">
          <div className="mr-px flex flex-1 min-w-0">
            <div className="flex w-full items-center border-b border-stone-200 bg-transparent">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v)}
                className="w-full"
              >
                <TabsList className="z-5 inline-flex h-auto w-full flex-1 justify-start items-center gap-1 overflow-x-auto rounded-none border-0 bg-transparent p-0 text-sm shadow-none">
                  {SETTINGS_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                    >
                      <span className="mb-1 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                        {tab.label}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 overflow-x-hidden pt-4">
          {activeTab === "general" && (
            <GeneralSettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab === "revenue" && (
            <RevenueSettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab === "team" && (
            <TeamSettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab === "security" && (
            <SecuritySettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab === "exclusions" && (
            <ExclusionsSettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab === "api" && (
            <APISettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab === "integrations" && (
            <IntegrationsSettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab === "reports" && (
            <ReportsSettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab === "import" && (
            <ImportSettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab === "widgets" && (
            <WidgetsSettings
              website={website}
              websiteId={websiteId}
              onUpdate={handleUpdate}
            />
          )}

          {activeTab !== "general" &&
            activeTab !== "revenue" &&
            activeTab !== "team" &&
            activeTab !== "security" &&
            activeTab !== "exclusions" &&
            activeTab !== "api" &&
            activeTab !== "integrations" &&
            activeTab !== "reports" &&
            activeTab !== "import" &&
            activeTab !== "widgets" && (
              <div className="text-stone-500 text-center py-8">
                This section is coming soon. Check back later for more features.
              </div>
            )}
        </div>
      </section>
    </div>
  );
}
