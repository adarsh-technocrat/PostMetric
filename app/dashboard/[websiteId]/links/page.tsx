"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isValidObjectId } from "@/utils/validation";
import { TemplateList } from "@/components/dashboard/links/TemplateList";
import { CreateLinkDialog } from "@/components/dashboard/links/CreateLinkDialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Link2,
  ChevronsUpDown,
  SlidersHorizontal,
  LayoutGrid,
  Search,
  MoreHorizontal,
} from "lucide-react";

export default function LinkBuilderPage({
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
  } | null;

  const [loading, setLoading] = useState(true);
  const [templatesVersion, setTemplatesVersion] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    baseUrl?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [linkCount, setLinkCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !websiteId) return;
    try {
      const key = `postmetric_template_${websiteId}`;
      const stored = sessionStorage.getItem(key);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      sessionStorage.removeItem(key);
      setSelectedTemplate(parsed);
      setCreateDialogOpen(true);
    } catch {
      // ignore
    }
  }, [websiteId]);

  const refreshTemplates = useCallback(
    () => setTemplatesVersion((v) => v + 1),
    [],
  );

  const handleTemplatesLoad = useCallback((templates: unknown[]) => {
    setLinkCount(templates.length);
  }, []);

  useEffect(() => {
    if (!isValidObjectId(websiteId)) {
      router.push("/dashboard");
      return;
    }
    dispatch(fetchWebsiteDetailsById(websiteId)).finally(() =>
      setLoading(false),
    );
  }, [websiteId, router, dispatch]);

  const defaultBaseUrl = website?.domain
    ? `https://${website.domain.replace(/^https?:\/\//, "")}`
    : "";

  const openCreateDialog = () => {
    setSelectedTemplate(null);
    setCreateDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-4xl">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-textPrimary font-bold text-xl">Links</h1>
          <button
            type="button"
            className="p-1 rounded text-textSecondary hover:text-textPrimary hover:bg-muted/50 transition-colors"
            title="Sort"
          >
            <ChevronsUpDown className="h-4 w-4" />
          </button>
        </div>
        <Button
          variant="stone"
          size="sm"
          className="h-9 px-4 normal-case shrink-0"
          onClick={openCreateDialog}
          data-postmetric-goal="create_link"
        >
          <Link2 className="h-4 w-4" />
          Create link
        </Button>
      </div>

      {createDialogOpen ? (
        <CreateLinkDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          websiteId={websiteId}
          defaultBaseUrl={defaultBaseUrl}
          onLinkCreated={refreshTemplates}
          initialValues={selectedTemplate || undefined}
        />
      ) : null}

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-textSecondary border-borderColor"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            <ChevronsUpDown className="h-4 w-4 ml-0.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-textSecondary border-borderColor"
          >
            <LayoutGrid className="h-4 w-4" />
            Display
            <ChevronsUpDown className="h-4 w-4 ml-0.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
            <Input
              placeholder="Search by short link or URL"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-textSecondary"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[480px]">
        <TemplateList
          websiteId={websiteId}
          defaultBaseUrl={defaultBaseUrl}
          refreshKey={templatesVersion}
          onTemplatesLoad={handleTemplatesLoad}
          listTitle="Your links"
          listDescription="Click to expand and copy your UTM links"
          emptyTitle="No links yet"
          emptyDescription="Start creating short links for your marketing campaigns, referral programs, and more."
          onEmptyCreateClick={openCreateDialog}
          emptyCreateLabel="Create link"
          showEmptyLearnMore
          onUseTemplate={(t: {
            baseUrl?: string;
            utmSource?: string;
            utmMedium?: string;
            utmCampaign?: string;
            utmTerm?: string;
            utmContent?: string;
          }) => {
            setSelectedTemplate({
              baseUrl: t.baseUrl,
              utm_source: t.utmSource,
              utm_medium: t.utmMedium,
              utm_campaign: t.utmCampaign,
              utm_term: t.utmTerm,
              utm_content: t.utmContent,
            });
            setCreateDialogOpen(true);
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between py-2 border-t border-borderColor">
        <p className="text-textSecondary text-sm">
          Viewing{" "}
          <span className="font-medium text-textPrimary">
            {linkCount} links
          </span>
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-textSecondary border-borderColor"
            disabled
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-textSecondary border-borderColor"
            disabled
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
