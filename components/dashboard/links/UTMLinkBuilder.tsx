"use client";

import { useState, useMemo, useEffect } from "react";
import { buildUtmUrl } from "@/utils/tracking/utm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, Save } from "lucide-react";
import { toast } from "@/lib/toast";

interface UTMLinkBuilderProps {
  websiteId: string;
  defaultBaseUrl: string;
  onTemplateCreated?: () => void;
  initialValues?: {
    baseUrl?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

const UTM_FIELDS = [
  {
    key: "utm_source",
    label: "Source",
    placeholder: "e.g. google, newsletter",
  },
  {
    key: "utm_medium",
    label: "Medium",
    placeholder: "e.g. cpc, email, social",
  },
  { key: "utm_campaign", label: "Campaign", placeholder: "e.g. summer_sale" },
  { key: "utm_term", label: "Term (optional)", placeholder: "e.g. keyword" },
  {
    key: "utm_content",
    label: "Content (optional)",
    placeholder: "e.g. ad_variant_a",
  },
] as const;

export function UTMLinkBuilder({
  websiteId,
  defaultBaseUrl,
  onTemplateCreated,
  initialValues,
}: UTMLinkBuilderProps) {
  const [baseUrl, setBaseUrl] = useState(
    initialValues?.baseUrl || defaultBaseUrl,
  );
  const [utmParams, setUtmParams] = useState<Record<string, string>>({
    utm_source: initialValues?.utm_source || "",
    utm_medium: initialValues?.utm_medium || "",
    utm_campaign: initialValues?.utm_campaign || "",
    utm_term: initialValues?.utm_term || "",
    utm_content: initialValues?.utm_content || "",
  });

  // Update when user selects a template (initialValues set from parent)
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setBaseUrl(initialValues.baseUrl || defaultBaseUrl);
      setUtmParams({
        utm_source: initialValues.utm_source || "",
        utm_medium: initialValues.utm_medium || "",
        utm_campaign: initialValues.utm_campaign || "",
        utm_term: initialValues.utm_term || "",
        utm_content: initialValues.utm_content || "",
      });
    }
  }, [initialValues, defaultBaseUrl]);
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const builtUrl = useMemo(() => {
    return buildUtmUrl(baseUrl, utmParams);
  }, [baseUrl, utmParams]);

  const updateParam = (key: string, value: string) => {
    setUtmParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleCopy = async () => {
    if (!builtUrl) return;
    try {
      await navigator.clipboard.writeText(builtUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSaveTemplate = async () => {
    const name = templateName.trim();
    if (!name) {
      toast.error("Enter a template name");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/link-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          baseUrl: baseUrl || undefined,
          utmSource: utmParams.utm_source || undefined,
          utmMedium: utmParams.utm_medium || undefined,
          utmCampaign: utmParams.utm_campaign || undefined,
          utmTerm: utmParams.utm_term || undefined,
          utmContent: utmParams.utm_content || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save template");
      }

      toast.success("Template saved");
      setTemplateName("");
      onTemplateCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="custom-card">
      <CardContent className="p-6 flex flex-col gap-6">
        <div className="space-y-2">
          <Label
            htmlFor="base-url"
            className="text-sm font-medium text-textPrimary"
          >
            Destination URL
          </Label>
          <Input
            id="base-url"
            type="url"
            placeholder="https://example.com/page"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="font-mono text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {UTM_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <Label
                htmlFor={key}
                className="text-sm font-medium text-textPrimary"
              >
                {label}
              </Label>
              <Input
                id={key}
                placeholder={placeholder}
                value={utmParams[key] || ""}
                onChange={(e) => updateParam(key, e.target.value)}
                className="font-mono text-sm lowercase"
              />
            </div>
          ))}
        </div>

        {builtUrl && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-textPrimary">
              Generated link
            </Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={builtUrl}
                className="font-mono text-sm bg-muted/50"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
                title="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-borderColor">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Save as template (e.g. Newsletter CTA)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveTemplate}
              disabled={saving || !templateName.trim()}
            >
              <Save className="h-4 w-4" />
              Save template
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
