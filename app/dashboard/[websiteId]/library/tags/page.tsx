"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isValidObjectId } from "@/utils/validation";
import { useAppDispatch } from "@/store/hooks";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import { Tag } from "lucide-react";

export default function TagsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
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

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <nav className="flex items-center gap-2 text-sm text-textSecondary">
        <Link
          href={`/dashboard/${websiteId}/library/tags`}
          className="hover:text-textPrimary transition-colors"
        >
          Library
        </Link>
        <span>/</span>
        <span className="font-medium text-textPrimary">Tags</span>
      </nav>
      <div className="flex flex-col items-center justify-center py-16 px-6 rounded-lg border border-borderColor bg-muted/20">
        <Tag className="h-12 w-12 text-textSecondary mb-4" />
        <h2 className="text-textPrimary font-semibold text-lg mb-2">Tags</h2>
        <p className="text-textSecondary text-sm text-center max-w-md">
          Create and manage tags for your links. Coming soon.
        </p>
        <Link
          href={`/dashboard/${websiteId}/links`}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Go to Link Builder →
        </Link>
      </div>
    </div>
  );
}
