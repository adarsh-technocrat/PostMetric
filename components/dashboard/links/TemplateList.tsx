"use client";

import { useState, useEffect, useCallback } from "react";
import { buildUtmUrl } from "@/utils/tracking/utm";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Trash2,
  Link2,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowUpCircle,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LinkTemplate {
  _id: string;
  name: string;
  baseUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

interface TemplateListProps {
  websiteId: string;
  defaultBaseUrl: string;
  refreshKey?: number;
  onUseTemplate?: (template: LinkTemplate) => void;
  /** Custom empty state when no templates - e.g. for links page with Create dialog */
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyCreateClick?: () => void;
  emptyCreateLabel?: string;
  showEmptyLearnMore?: boolean;
  onTemplatesLoad?: (templates: LinkTemplate[]) => void;
  /** Title for the list card (e.g. "Your links" vs "Saved templates") */
  listTitle?: string;
  /** Description for the list card */
  listDescription?: string;
}

function LinksListShimmer() {
  return (
    <Card className="custom-card overflow-hidden">
      <CardHeader className="px-4 py-3 border-b border-borderColor bg-muted/30">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-48 mt-1" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-borderColor">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
              <Skeleton className="h-4 flex-1 max-w-[200px]" />
              <div className="flex gap-1 shrink-0">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplateList({
  websiteId,
  defaultBaseUrl,
  refreshKey = 0,
  onUseTemplate,
  emptyTitle = "No templates yet",
  emptyDescription = "Build a link above and save it as a template to reuse",
  onEmptyCreateClick,
  emptyCreateLabel = "Create link",
  showEmptyLearnMore = false,
  onTemplatesLoad,
  listTitle = "Saved templates",
  listDescription = "Click to expand and copy your UTM links",
}: TemplateListProps) {
  const [templates, setTemplates] = useState<LinkTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LinkTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`/api/websites/${websiteId}/link-templates`);
      if (res.ok) {
        const data = await res.json();
        const list = data.templates || [];
        setTemplates(list);
        onTemplatesLoad?.(list);
      }
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [websiteId, onTemplatesLoad]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates, refreshKey]);

  const getBuiltUrl = (t: LinkTemplate) => {
    const base = t.baseUrl || defaultBaseUrl;
    return buildUtmUrl(base, {
      utm_source: t.utmSource,
      utm_medium: t.utmMedium,
      utm_campaign: t.utmCampaign,
      utm_term: t.utmTerm,
      utm_content: t.utmContent,
    });
  };

  const handleCopy = async (t: LinkTemplate) => {
    const url = getBuiltUrl(t);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(t._id);
      toast.success("Link copied");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/websites/${websiteId}/link-templates/${deleteTarget._id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t._id !== deleteTarget._id));
        toast.success("Template deleted");
        setDeleteTarget(null);
      } else {
        throw new Error("Delete failed");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LinksListShimmer />;
  }

  if (templates.length === 0) {
    return (
      <Card className="custom-card min-h-[420px] flex flex-col">
        <CardContent className="p-8 text-center flex flex-1 flex-col items-center justify-center">
          <Link2 className="h-10 w-10 text-textSecondary mx-auto mb-3" />
          <p className="text-textPrimary font-semibold text-sm mb-1">
            {emptyTitle}
          </p>
          <p className="text-textSecondary text-sm mb-4">{emptyDescription}</p>
          {(onEmptyCreateClick || showEmptyLearnMore) && (
            <div className="flex items-center justify-center gap-2">
              {onEmptyCreateClick && (
                <Button
                  variant="stone"
                  size="sm"
                  className="normal-case"
                  onClick={onEmptyCreateClick}
                >
                  <Link2 className="h-4 w-4 mr-1" />
                  {emptyCreateLabel}
                </Button>
              )}
              {showEmptyLearnMore && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://docs.postmetric.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="custom-card overflow-hidden">
        <CardHeader className="px-4 py-3 border-b border-borderColor bg-muted/30">
          <CardTitle className="text-sm">{listTitle}</CardTitle>
          <CardDescription className="text-xs mt-0.5">
            {listDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-borderColor">
            {templates.map((t) => {
              const isExpanded = expandedId === t._id;
              const url = getBuiltUrl(t);

              return (
                <div key={t._id} className="bg-white">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : t._id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="h-4 w-4 text-textSecondary shrink-0" />
                      <span className="font-medium text-textPrimary truncate">
                        {t.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {onUseTemplate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUseTemplate(t);
                          }}
                          title="Use in builder"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(t);
                        }}
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-textSecondary hover:text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(t);
                        }}
                        title="Delete link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-textSecondary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-textSecondary" />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-borderColor">
                      <div className="mt-2 p-3 rounded-lg bg-muted/30 font-mono text-xs text-textPrimary break-all">
                        {url || "—"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {t.utmSource && (
                          <span className="inline-flex px-2 py-0.5 rounded bg-muted text-textSecondary text-xs">
                            source: {t.utmSource}
                          </span>
                        )}
                        {t.utmMedium && (
                          <span className="inline-flex px-2 py-0.5 rounded bg-muted text-textSecondary text-xs">
                            medium: {t.utmMedium}
                          </span>
                        )}
                        {t.utmCampaign && (
                          <span className="inline-flex px-2 py-0.5 rounded bg-muted text-textSecondary text-xs">
                            campaign: {t.utmCampaign}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
          </DialogHeader>
          <p className="text-textSecondary text-sm">
            "{deleteTarget?.name}" will be permanently deleted.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
