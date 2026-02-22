"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidObjectId } from "@/utils/validation";
import { TemplateList } from "@/components/dashboard/links/TemplateList";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";

export default function UTMTemplatesPage({
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

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <h1 className="text-textPrimary font-semibold text-lg mb-4">
          UTM Templates
        </h1>
        <p className="text-textSecondary text-sm mb-6">
          Your saved UTM link templates. Use them in the Link Builder to create
          new links quickly.
        </p>
        <TemplateList
          websiteId={websiteId}
          defaultBaseUrl={defaultBaseUrl}
          onUseTemplate={(t) => {
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.setItem(
                `postmetric_template_${websiteId}`,
                JSON.stringify({
                  baseUrl: t.baseUrl,
                  utm_source: t.utmSource,
                  utm_medium: t.utmMedium,
                  utm_campaign: t.utmCampaign,
                  utm_term: t.utmTerm,
                  utm_content: t.utmContent,
                }),
              );
            }
            router.push(`/dashboard/${websiteId}/links`);
          }}
        />
      </div>
    </div>
  );
}
