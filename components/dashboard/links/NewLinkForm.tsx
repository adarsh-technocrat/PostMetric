"use client";

import { useState, useMemo, useEffect } from "react";
import { buildUtmUrl } from "@/utils/tracking/utm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Check,
  HelpCircle,
  Shuffle,
  Crosshair,
  Lock,
  Clock,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  LinkPreviewEditDialog,
  type LinkPreviewValues,
} from "./LinkPreviewEditDialog";

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
  { key: "utm_term", label: "Term", placeholder: "e.g. keyword" },
  { key: "utm_content", label: "Content", placeholder: "e.g. ad_variant_a" },
] as const;

interface NewLinkFormProps {
  websiteId: string;
  defaultBaseUrl: string;
  onLinkCreated?: () => void;
  initialValues?: {
    baseUrl?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  onClose?: () => void;
}

function FieldHelp({ title }: { title: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex cursor-pointer p-1 rounded opacity-60 hover:opacity-100 transition-opacity text-textSecondary"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function NewLinkForm({
  websiteId,
  defaultBaseUrl,
  onLinkCreated,
  initialValues,
  onClose,
}: NewLinkFormProps) {
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
  const [tags, setTags] = useState("");
  const [comments, setComments] = useState("");
  const [folder, setFolder] = useState("Links");
  const [conversionTracking, setConversionTracking] = useState(false);
  const [customPreviewEnabled, setCustomPreviewEnabled] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [previewEditOpen, setPreviewEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("utm");
  const [password, setPassword] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const builtUrl = useMemo(
    () => buildUtmUrl(baseUrl, utmParams),
    [baseUrl, utmParams],
  );

  const qrCodeUrl = useMemo(() => {
    if (!builtUrl) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(builtUrl)}`;
  }, [builtUrl]);

  const updateParam = (key: string, value: string) => {
    setUtmParams((prev) => ({ ...prev, [key]: value }));
  };

  const randomizeShortCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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

  const handleCreateLink = async () => {
    const name = templateName.trim() || "Untitled link";
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
          tags: tags
            ? tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined,
          comments: comments || undefined,
          folder: folder || undefined,
          conversionTracking,
          customPreview: customPreviewEnabled
            ? {
                title: previewTitle || undefined,
                description: previewDescription || undefined,
                imageUrl: previewImageUrl || undefined,
              }
            : undefined,
          password: password || undefined,
          expiresAt: expirationDate ? new Date(expirationDate) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create link");
      }

      toast.success("Link created");
      setTemplateName("");
      setBaseUrl(defaultBaseUrl);
      setUtmParams({
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        utm_term: "",
        utm_content: "",
      });
      setComments("");
      onLinkCreated?.();
      onClose?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="custom-card !border-0 shadow-none">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="destination-url"
                    className="text-sm font-medium text-textPrimary"
                  >
                    Destination URL
                  </Label>
                  <FieldHelp title="The full URL where users will be redirected" />
                </div>
                <Input
                  id="destination-url"
                  type="url"
                  placeholder="https://example.com/page"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-textPrimary">
                    Generated link
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateParam("utm_content", randomizeShortCode())
                      }
                      title="Randomize"
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                    <FieldHelp title="Your UTM-trackable link" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={builtUrl || "Enter URL and UTM params..."}
                    className="font-mono text-sm bg-muted/50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    disabled={!builtUrl}
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="tags"
                    className="text-sm font-medium text-textPrimary"
                  >
                    Tags
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Manage
                    </Button>
                    <FieldHelp title="Organize links with tags" />
                  </div>
                </div>
                <Input
                  id="tags"
                  placeholder="Select tags..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="comments"
                    className="text-sm font-medium text-textPrimary"
                  >
                    Comments
                  </Label>
                  <FieldHelp title="Internal notes about this link" />
                </div>
                <textarea
                  id="comments"
                  placeholder="Add comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="conversion"
                    className="text-sm font-medium text-textPrimary"
                  >
                    Conversion tracking
                  </Label>
                  <FieldHelp title="Track conversions for this link" />
                </div>
                <Switch
                  id="conversion"
                  checked={conversionTracking}
                  onCheckedChange={setConversionTracking}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="custom-card shadow-none">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="folder"
                    className="text-sm font-medium text-textPrimary"
                  >
                    Folder
                  </Label>
                  <FieldHelp title="Organize links in folders" />
                </div>
                <Select value={folder} onValueChange={setFolder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Links">Links</SelectItem>
                    <SelectItem value="Campaigns">Campaigns</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-textPrimary">
                    QR Code
                  </Label>
                  <FieldHelp title="QR code for your link" />
                </div>
                <div className="flex justify-center rounded-lg bg-muted/30 p-3">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-textSecondary text-sm">
                      Enter URL first
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-textPrimary">
                      Custom link preview
                    </Label>
                    <Switch
                      checked={customPreviewEnabled}
                      onCheckedChange={setCustomPreviewEnabled}
                    />
                  </div>
                  <FieldHelp title="Customize how the link appears when shared" />
                </div>
                {customPreviewEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-sm border-borderColor/60"
                    onClick={() => setPreviewEditOpen(true)}
                  >
                    Edit preview
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden custom-card !border-0 shadow-none mt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-5 pt-4 pb-2 border-b border-borderColor/50">
            <div className="flex w-full min-w-0 flex-1 items-center gap-2">
              <TabsList className="z-5 inline-flex h-auto flex-1 justify-start items-center gap-1 overflow-x-auto rounded-none border-0 bg-transparent p-0 text-sm shadow-none min-w-0">
                <TabsTrigger
                  value="utm"
                  className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                >
                  <span className="mb-1 inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                    UTM
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="targeting"
                  className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                >
                  <span className="mb-1 inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                    <Crosshair className="h-4 w-4" />
                    Targeting
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="password"
                  className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                >
                  <span className="mb-1 inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                    <Lock className="h-4 w-4" />
                    Password
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="expiration"
                  className="inline-flex shrink-0 cursor-pointer items-center justify-between whitespace-nowrap rounded-none border-b-2 border-transparent px-0 py-0 text-center text-sm font-semibold text-stone-950 transition-all ease-in duration-75 hover:bg-transparent data-[state=active]:rounded-none data-[state=active]:border-indigo-400 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none dark:data-[state=active]:text-brand-600"
                >
                  <span className="mb-1 inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1 hover:bg-stone-100">
                    <Clock className="h-4 w-4" />
                    Expiration
                  </span>
                </TabsTrigger>
              </TabsList>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 mb-1 text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                title="More options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 sm:pl-4">
              <Input
                placeholder="Link name (optional)"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-40 sm:w-48 text-sm"
              />
              <Button
                type="button"
                onClick={handleCreateLink}
                disabled={saving || !builtUrl}
                variant="stone"
                className="h-9 min-w-[120px] px-4 normal-case"
              >
                <ArrowLeft className="h-4 w-4 rotate-180" />
                {saving ? "Creating..." : "Create link"}
              </Button>
            </div>
          </div>

          <TabsContent value="utm" className="mt-0">
            <CardContent className="px-5 pb-5 pt-2">
              <h3 className="text-base font-semibold text-textPrimary mb-3">
                UTM Parameters
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {UTM_FIELDS.map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
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
            </CardContent>
          </TabsContent>

          <TabsContent value="targeting" className="mt-0">
            <CardContent className="px-5 pb-5 pt-2">
              <h3 className="text-base font-semibold text-textPrimary mb-3">
                Targeting
              </h3>
              <p className="text-textSecondary text-sm">
                Target specific countries, devices, or referrers. Coming soon.
              </p>
            </CardContent>
          </TabsContent>

          <TabsContent value="password" className="mt-0">
            <CardContent className="px-5 pb-5 pt-2">
              <h3 className="text-base font-semibold text-textPrimary mb-3">
                Password protection
              </h3>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="max-w-xs"
              />
            </CardContent>
          </TabsContent>

          <TabsContent value="expiration" className="mt-0">
            <CardContent className="px-5 pb-5 pt-2">
              <h3 className="text-base font-semibold text-textPrimary mb-3">
                Link expiration
              </h3>
              <Input
                type="datetime-local"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="max-w-xs"
              />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      <LinkPreviewEditDialog
        open={previewEditOpen}
        onOpenChange={setPreviewEditOpen}
        values={{
          title: previewTitle,
          description: previewDescription,
          imageUrl: previewImageUrl,
        }}
        onSave={(v: LinkPreviewValues) => {
          setPreviewTitle(v.title);
          setPreviewDescription(v.description);
          setPreviewImageUrl(v.imageUrl);
        }}
        defaultValues={{ title: "", description: "", imageUrl: "" }}
      />
    </div>
  );
}
