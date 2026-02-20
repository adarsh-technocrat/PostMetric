import type { Metadata } from "next";
import { SEO_BASE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Demo",
  description:
    "Try PostMetric analytics and revenue attribution with our live demo. See how we turn data into actionable next steps.",
  alternates: { canonical: `${SEO_BASE_URL}/demo` },
  openGraph: {
    title: "Demo | PostMetric",
    description:
      "Try PostMetric analytics and revenue attribution with our live demo. See how we turn data into actionable next steps.",
    url: `${SEO_BASE_URL}/demo`,
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
