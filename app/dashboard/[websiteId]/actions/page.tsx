"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isValidObjectId } from "@/utils/validation";

export default function ActionBuilderPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const router = useRouter();

  useEffect(() => {
    if (!isValidObjectId(websiteId)) {
      router.push("/dashboard");
      return;
    }
    router.replace(`/dashboard/${websiteId}/workflows`);
  }, [websiteId, router]);

  return null;
}
