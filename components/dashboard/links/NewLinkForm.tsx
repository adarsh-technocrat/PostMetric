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
  Globe,
  Pencil,
  Linkedin,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  LinkPreviewEditDialog,
  type LinkPreviewValues,
} from "./LinkPreviewEditDialog";
import { UTMParamsDialog } from "./UTMParamsDialog";
import { TargetingDialog } from "./TargetingDialog";
import { PasswordDialog } from "./PasswordDialog";
import { ExpirationDialog } from "./ExpirationDialog";

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
  const [previewPlatform, setPreviewPlatform] = useState<
    "web" | "x" | "linkedin" | "facebook"
  >("web");
  const [utmDialogOpen, setUtmDialogOpen] = useState(false);
  const [targetingDialogOpen, setTargetingDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [expirationDialogOpen, setExpirationDialogOpen] = useState(false);
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
    <div className="flex flex-1 flex-col min-h-0 w-full max-w-5xl">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
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

                <div className="space-y-1.5">
                  <Label
                    htmlFor="link-name"
                    className="text-sm font-medium text-textPrimary"
                  >
                    Link name
                  </Label>
                  <Input
                    id="link-name"
                    placeholder="Link name (optional)"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="text-sm"
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
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-40 h-40"
                      />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-textSecondary text-sm">
                        Enter URL first
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-textPrimary">
                        Custom Link Preview
                      </span>
                      <FieldHelp title="Customize how the link appears when shared" />
                    </div>
                    <Switch
                      checked={customPreviewEnabled}
                      onCheckedChange={setCustomPreviewEnabled}
                    />
                  </div>
                  {customPreviewEnabled && (
                    <>
                      <div className="flex gap-1 rounded-lg border border-borderColor/50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setPreviewPlatform("web")}
                          className={`flex h-8 w-8 items-center justify-center rounded-md text-textSecondary transition-colors hover:bg-muted/50 hover:text-textPrimary ${
                            previewPlatform === "web"
                              ? "bg-muted/50 text-textPrimary ring-1 ring-borderColor"
                              : ""
                          }`}
                        >
                          <Globe className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewPlatform("x")}
                          className={`flex h-8 w-8 items-center justify-center rounded-md text-textSecondary transition-colors hover:bg-muted/50 hover:text-textPrimary ${
                            previewPlatform === "x"
                              ? "bg-muted/50 text-textPrimary ring-1 ring-borderColor"
                              : ""
                          }`}
                        >
                          <span className="text-[10px] font-bold">𝕏</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewPlatform("linkedin")}
                          className={`flex h-8 w-8 items-center justify-center rounded-md text-textSecondary transition-colors hover:bg-muted/50 hover:text-textPrimary ${
                            previewPlatform === "linkedin"
                              ? "bg-muted/50 text-textPrimary ring-1 ring-borderColor"
                              : ""
                          }`}
                        >
                          <Linkedin className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewPlatform("facebook")}
                          className={`flex h-8 w-8 items-center justify-center rounded-md text-textSecondary transition-colors hover:bg-muted/50 hover:text-textPrimary ${
                            previewPlatform === "facebook"
                              ? "bg-muted/50 text-textPrimary ring-1 ring-borderColor"
                              : ""
                          }`}
                        >
                          <span className="text-xs font-bold">f</span>
                        </button>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-borderColor/50 bg-white">
                        <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
                          {previewImageUrl ? (
                            <img
                              src={previewImageUrl}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Globe className="h-10 w-10 text-textSecondary/40" />
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-2 h-8 w-8 rounded-md bg-white/90 shadow-sm hover:bg-white"
                            onClick={() => setPreviewEditOpen(true)}
                            title="Edit preview"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="border-t border-borderColor/30 p-3">
                          <p className="line-clamp-1 text-sm font-semibold text-textPrimary">
                            {previewTitle || "Add a title..."}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-textSecondary">
                            {previewDescription || "Add a description..."}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-borderColor/50 bg-muted/30 px-6 py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex w-full min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setUtmDialogOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-stone-950 hover:bg-stone-100 transition-colors"
            >
              UTM
            </button>
            <button
              type="button"
              onClick={() => setTargetingDialogOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-stone-950 hover:bg-stone-100 transition-colors"
            >
              <Crosshair className="h-4 w-4" />
              Targeting
            </button>
            <button
              type="button"
              onClick={() => setPasswordDialogOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-stone-950 hover:bg-stone-100 transition-colors"
            >
              <Lock className="h-4 w-4" />
              Password
            </button>
            <button
              type="button"
              onClick={() => setExpirationDialogOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] px-3 py-2 text-sm font-semibold text-stone-950 hover:bg-stone-100 transition-colors"
            >
              <Clock className="h-4 w-4" />
              Expiration
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-stone-500 hover:text-stone-800 hover:bg-stone-100"
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            onClick={handleCreateLink}
            disabled={saving || !builtUrl}
            variant="stone"
            className="h-9 min-w-[120px] px-4 normal-case shrink-0"
          >
            <ArrowLeft className="h-4 w-4 rotate-180" />
            {saving ? "Creating..." : "Create link"}
          </Button>
        </div>
      </footer>

      <UTMParamsDialog
        open={utmDialogOpen}
        onOpenChange={setUtmDialogOpen}
        utmParams={utmParams}
        onUpdate={updateParam}
      />
      <TargetingDialog
        open={targetingDialogOpen}
        onOpenChange={setTargetingDialogOpen}
      />
      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        password={password}
        onPasswordChange={setPassword}
      />
      <ExpirationDialog
        open={expirationDialogOpen}
        onOpenChange={setExpirationDialogOpen}
        expirationDate={expirationDate}
        onExpirationChange={setExpirationDate}
      />

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
