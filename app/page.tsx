import type { Metadata } from "next";
import { LANDING_MAX_W } from "@/lib/landing-layout";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";
import { InsightsSection } from "@/components/landing/InsightsSection";
import { RevenueTrackingSection } from "@/components/landing/RevenueTrackingSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { PricingSection } from "@/components/landing/pricing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { SEO_BASE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Google Analytics Alternative | Revenue Attribution",
  description:
    "Privacy-friendly Google Analytics alternative. Find out which marketing channels drive your revenue—cookie-free analytics with Stripe integration. For startups, SaaS, and ecommerce.",
  keywords: [
    "Google Analytics alternative",
    "revenue attribution",
    "cookie-free analytics",
    "which marketing channels drive revenue",
    "traffic sources revenue",
    "Stripe analytics",
    "marketing analytics",
    "privacy-first analytics",
    "GDPR compliant analytics",
    "startup analytics",
  ],
  alternates: { canonical: SEO_BASE_URL },
  openGraph: {
    title:
      "Google Analytics Alternative | Revenue Attribution & Cookie-Free Analytics | PostMetric",
    description:
      "Privacy-friendly Google Analytics alternative. Find out which marketing channels drive your revenue—cookie-free analytics with Stripe integration.",
    url: SEO_BASE_URL,
  },
};

export default function Home() {
  return (
    <div className="antialiased font-sans flex flex-col w-full items-center min-h-screen bg-stone-50">
      <Navbar />
      <main
        className={`w-full ${LANDING_MAX_W} border-x border-stone-200 flex flex-col bg-stone-50`}
      >
        <HeroSection />
        <div className="w-full border-b border-stone-200" />
        <DashboardPreview />
        <div className="w-full border-b border-stone-200" />
        <FeatureCards />
        <div className="w-full border-b border-stone-200" />
        <IntegrationsSection />
        <InsightsSection />
        <RevenueTrackingSection />
        <FeaturesGrid />
        <PricingSection />
        <div className="w-full border-b border-stone-200" />
        <TestimonialsSection />
        <div className="w-full border-b border-stone-200" />
        <CTASection />
        <div className="w-full border-b border-stone-200" />
        <Footer />
      </main>
    </div>
  );
}
