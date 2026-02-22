"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isValidObjectId } from "@/utils/validation";
import { useAppDispatch } from "@/store/hooks";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import { ActionBuilder } from "@/components/dashboard/actions";

export default function ActionBuilderPage({
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
        <div className="h-[calc(100vh-12rem)] bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/dashboard/${websiteId}/actions`}
          className="hover:text-foreground transition-colors"
        >
          Builders
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">Action Builder</span>
      </nav>
      <ActionBuilder />
    </div>
  );
}
