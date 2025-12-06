"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebsiteById } from "@/store/slices/websitesSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: "⚙️" },
  { id: "revenue", label: "Revenue", icon: "💰" },
  { id: "team", label: "Team", icon: "👥" },
  { id: "import", label: "Import", icon: "📥" },
  { id: "reports", label: "Reports", icon: "📊" },
  { id: "widgets", label: "Widgets", icon: "📱" },
  { id: "integrations", label: "Integrations", icon: "🔗" },
  { id: "api", label: "API", icon: "🔌" },
  { id: "exclusions", label: "Exclusions", icon: "🚫" },
  { id: "security", label: "Security", icon: "🔒" },
] as const;

const COLOR_OPTIONS = [
  "#EF4444", // red
  "#E78468", // orange (primary)
  "#EC4899", // pink
  "#F59E0B", // amber
  "#10B981", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#8B5CF6", // purple
  "#64748B", // slate
];

export default function SettingsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const website = useAppSelector((state) => state.websites.currentWebsite) as {
    _id: string;
    domain: string;
    name: string;
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
    };
  } | null;

  const [activeTab, setActiveTab] = useState("general");
  const [domain, setDomain] = useState("");
  const [nickname, setNickname] = useState("");
  const [timezone, setTimezone] = useState("Asia/Calcutta");
  const [colorScheme, setColorScheme] = useState("#E78468");
  const [publicDashboard, setPublicDashboard] = useState(false);
  const [allowLocalhost, setAllowLocalhost] = useState(false);
  const [additionalDomain, setAdditionalDomain] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (websiteId) {
      dispatch(fetchWebsiteById(websiteId));
    }
  }, [websiteId, dispatch]);

  useEffect(() => {
    if (website) {
      setDomain(website.domain || "");
      setNickname(website.settings?.nickname || "");
      setTimezone(website.settings?.timezone || "Asia/Calcutta");
      setColorScheme(website.settings?.colorScheme || "#E78468");
      setPublicDashboard(website.settings?.publicDashboard?.enabled || false);
    }
  }, [website]);

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (response.ok) {
        dispatch(fetchWebsiteById(websiteId));
      }
    } catch (error) {
      console.error("Error updating domain:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...website?.settings,
            nickname,
          },
        }),
      });
      if (response.ok) {
        dispatch(fetchWebsiteById(websiteId));
      }
    } catch (error) {
      console.error("Error updating nickname:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTimezone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...website?.settings,
            timezone,
          },
        }),
      });
      if (response.ok) {
        dispatch(fetchWebsiteById(websiteId));
      }
    } catch (error) {
      console.error("Error updating timezone:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveColorScheme = async (color: string) => {
    setColorScheme(color);
    setLoading(true);
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...website?.settings,
            colorScheme: color,
          },
        }),
      });
      if (response.ok) {
        dispatch(fetchWebsiteById(websiteId));
      }
    } catch (error) {
      console.error("Error updating color scheme:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublicDashboard = async (checked: boolean) => {
    setPublicDashboard(checked);
    try {
      const response = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      if (response.ok) {
        dispatch(fetchWebsiteById(websiteId));
      }
    } catch (error) {
      console.error("Error updating public dashboard:", error);
    }
  };

  const handleCopyScript = () => {
    const script = `<script
  defer
  data-website-id="${websiteId}"
  data-domain="${domain}"
  src="${
    typeof window !== "undefined" ? window.location.origin : ""
  }/js/script.js"
></script>`;
    navigator.clipboard.writeText(script);
  };

  const trackingCode =
    website?.trackingCode || websiteId || "dfid_" + websiteId?.slice(0, 20);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-32 md:px-8 bg-background">
      {/* Header */}
      <section className="mb-8 space-y-2">
        <Link
          href={`/dashboard/${websiteId}`}
          className="btn btn-ghost btn-sm inline-flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M14 8a.75.75 0 0 1-.75.75H4.56l1.22 1.22a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-2xl font-bold text-textPrimary">
          Settings for {website?.domain || website?.name || "Loading..."}
        </h1>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Navigation */}
        <nav className="overflow-x-auto lg:w-52 lg:overflow-x-visible">
          <ul className="flex gap-2 lg:flex-col">
            {SETTINGS_TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full select-none items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 duration-200 ${
                    activeTab === tab.id
                      ? "bg-neutral text-neutral-content shadow"
                      : "bg-base-300 hover:bg-neutral hover:text-neutral-content"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="max-w-lg flex-1">
          {activeTab === "general" && (
            <section className="space-y-4">
              {/* Analytics Script */}
              <Card className="custom-card">
                <CardHeader>
                  <CardTitle>Analytics script</CardTitle>
                  <CardDescription>
                    Paste this snippet in the &lt;head&gt; of your website. If
                    you need more help, see our{" "}
                    <Link
                      href="/docs/installation-tutorials"
                      className="link hover:text-base-content"
                      target="_blank"
                    >
                      installation guides
                    </Link>
                    . If you need to customize the script, see the{" "}
                    <Link
                      href="/docs/script-configuration"
                      className="link hover:text-base-content"
                      target="_blank"
                    >
                      script configuration reference
                    </Link>
                    .
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs rounded"
                      checked={allowLocalhost}
                      onChange={(e) => setAllowLocalhost(e.target.checked)}
                    />
                    <label className="text-sm text-textSecondary cursor-pointer">
                      Allow localhost debugging{" "}
                      <span
                        className="group -m-1 cursor-pointer p-1 inline-flex items-center"
                        title="DataFast does not set the cookie on localhost to avoid polluting your own data. To override this for debugging, check this box."
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="size-3 opacity-60 duration-100 group-hover:opacity-100"
                        >
                          <path
                            fillRule="evenodd"
                            d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </label>
                  </div>
                  <div className="relative overflow-hidden rounded-lg bg-neutral">
                    <pre className="text-xs p-4 overflow-x-auto">
                      <code className="language-htmlbars whitespace-pre-wrap">
                        {`<script
  defer
  data-website-id="${trackingCode}"
  data-domain="${domain}"
  src="${
    typeof window !== "undefined" ? window.location.origin : ""
  }/js/script.js"
></script>`}
                      </code>
                    </pre>
                    <div className="absolute right-2 top-2 z-50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="btn-square"
                        onClick={handleCopyScript}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-5 opacity-80 transition-opacity duration-200 hover:opacity-100"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-textSecondary">
                    Tip:{" "}
                    <Link
                      href="/docs/proxy-guide"
                      target="_blank"
                      className="link hover:text-base-content"
                    >
                      proxy the script through your own domain
                    </Link>{" "}
                    to avoid ad blockers.
                  </p>
                </CardContent>
              </Card>

              {/* Domain */}
              <Card className="custom-card">
                <form onSubmit={handleSaveDomain}>
                  <CardHeader>
                    <CardTitle>Domain</CardTitle>
                    <CardDescription>
                      Your main website domain for analytics tracking. All
                      subdomains will be tracked automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      required
                      className="input-sm w-full border-base-content/10 placeholder:opacity-60"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    />
                    <div className="flex justify-between items-top">
                      <p className="text-xs text-textSecondary">
                        Your public DataFast ID is{" "}
                        <span className="link-hover link font-medium text-base-content">
                          {trackingCode}
                        </span>
                        .
                      </p>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                      >
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Card>

              {/* Additional Domains */}
              <Card className="custom-card">
                <CardHeader>
                  <CardTitle>Additional domains</CardTitle>
                  <CardDescription>
                    Other domains than{" "}
                    <span className="font-medium text-base-content">
                      {domain}
                    </span>{" "}
                    that can send data to this website.{" "}
                    <Link
                      href="/docs/cross-domain-tracking"
                      target="_blank"
                      className="link"
                    >
                      Learn more.
                    </Link>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form className="flex gap-2">
                    <Input
                      placeholder="e.g., anotherdomain.com"
                      className="input-sm flex-1 border-base-content/10 placeholder:opacity-60"
                      value={additionalDomain}
                      onChange={(e) => setAdditionalDomain(e.target.value)}
                    />
                    <Button type="submit" variant="ghost" size="sm">
                      Add
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Timezone */}
              <Card className="custom-card overflow-visible">
                <form onSubmit={handleSaveTimezone}>
                  <CardHeader>
                    <CardTitle>Timezone</CardTitle>
                    <CardDescription>
                      This defines what "today" means in your reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="input-sm w-full border-base-content/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Calcutta">
                          Asia - Calcutta
                        </SelectItem>
                        <SelectItem value="America/New_York">
                          America - New York
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          America - Los Angeles
                        </SelectItem>
                        <SelectItem value="Europe/London">
                          Europe - London
                        </SelectItem>
                        <SelectItem value="Europe/Paris">
                          Europe - Paris
                        </SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia - Tokyo</SelectItem>
                        <SelectItem value="Australia/Sydney">
                          Australia - Sydney
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                      >
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Card>

              {/* Color Scheme */}
              <Card className="custom-card">
                <CardHeader>
                  <CardTitle>Color scheme</CardTitle>
                  <CardDescription>
                    Choose the main color for revenue/goal bars in your
                    analytics charts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2.5 p-4 md:grid-cols-6">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleSaveColorScheme(color)}
                        className="group relative flex h-8 w-full duration-150 ease-in-out"
                      >
                        <div
                          className={`flex h-8 w-full items-center justify-center rounded-lg duration-150 ${
                            colorScheme === color
                              ? "ring-2 ring-neutral ring-offset-2 ring-offset-base-100"
                              : "group-hover:ring-2 group-hover:ring-neutral/50 group-hover:ring-offset-2 group-hover:ring-offset-base-100"
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {colorScheme === color && (
                            <div className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-neutral text-neutral-content shadow-md">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                className="size-3"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* #1 KPI */}
              <Card className="custom-card overflow-visible">
                <form>
                  <CardHeader>
                    <CardTitle>#1 KPI</CardTitle>
                    <CardDescription>
                      What's your most important goal for {domain}?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Select defaultValue="revenue">
                      <SelectTrigger className="input-sm w-full border-base-content/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="visitors">Visitors</SelectItem>
                        <SelectItem value="conversions">Conversions</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex justify-between">
                      <Link
                        href="/docs/custom-goals"
                        target="_blank"
                        className="text-xs text-textSecondary opacity-80 duration-100 hover:link hover:text-base-content hover:opacity-100 inline-flex items-center gap-0.5"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="size-3"
                        >
                          <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                        </svg>
                        <span>Add goals</span>
                      </Link>
                      <Button type="submit" variant="ghost" size="sm">
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Card>

              {/* Website Nickname */}
              <Card className="custom-card">
                <form onSubmit={handleSaveNickname}>
                  <CardHeader>
                    <CardTitle>Website nickname</CardTitle>
                    <CardDescription>
                      Give your website a friendly nickname to easily identify
                      it!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input
                      className="input-sm w-full border-base-content/10 placeholder:opacity-60"
                      placeholder="e.g., Unicorn"
                      maxLength={32}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                      >
                        Save
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Card>

              {/* Public Dashboard */}
              <Card className="custom-card">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-textPrimary">
                        Public dashboard
                      </h3>
                      <p className="text-sm text-textSecondary mt-1">
                        Share your analytics with a public link
                      </p>
                    </div>
                    <Switch
                      checked={publicDashboard}
                      onCheckedChange={handleTogglePublicDashboard}
                    />
                  </div>
                </div>
              </Card>

              {/* Delete Button */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-error/20 hover:text-error"
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to delete this website? This action cannot be undone."
                      )
                    ) {
                      try {
                        const response = await fetch(
                          `/api/websites/${websiteId}`,
                          { method: "DELETE" }
                        );
                        if (response.ok) {
                          router.push("/dashboard");
                        }
                      } catch (error) {
                        console.error("Error deleting website:", error);
                      }
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </section>
          )}

          {activeTab !== "general" && (
            <section className="space-y-4">
              <Card className="custom-card">
                <CardHeader>
                  <CardTitle>
                    {SETTINGS_TABS.find((t) => t.id === activeTab)?.label}
                  </CardTitle>
                  <CardDescription>
                    This section is coming soon. Check back later for more
                    features.
                  </CardDescription>
                </CardHeader>
              </Card>
            </section>
          )}
        </main>
      </div>
    </main>
  );
}
