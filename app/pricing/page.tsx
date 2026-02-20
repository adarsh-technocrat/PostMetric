import type { Metadata } from "next";
import { LANDING_MAX_W } from "@/lib/landing-layout";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PricingPageContent } from "@/components/landing/pricing/PricingPageContent";
import { SEO_BASE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "PostMetric pricing plans for analytics and revenue attribution. Choose the plan that fits your traffic and start turning data into action.",
  alternates: { canonical: `${SEO_BASE_URL}/pricing` },
  openGraph: {
    title: "Pricing | PostMetric",
    description:
      "PostMetric pricing plans for analytics and revenue attribution. Choose the plan that fits your traffic and start turning data into action.",
    url: `${SEO_BASE_URL}/pricing`,
  },
};

export default function PricingPage() {
  return (
    <div className="flex flex-col w-full items-center min-h-screen bg-stone-50">
      <Navbar />
      <main
        className={`items-center w-full ${LANDING_MAX_W} border-x border-stone-200 flex flex-col bg-stone-50`}
      >
        <PricingPageContent />
        <div className="w-full border-b border-stone-200" />
        <Footer />
      </main>
    </div>
  );
}
