import type { Metadata } from "next";
import Link from "next/link";
import { LANDING_MAX_W } from "@/lib/landing-layout";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO_BASE_URL } from "@/lib/seo/constants";
import {
  Gift,
  RotateCcw,
  BarChart3,
  Wallet,
  Link2,
  FileText,
} from "lucide-react";
import { AffiliateEarningsCalculator } from "@/components/affiliate/AffiliateEarningsCalculator";

export const metadata: Metadata = {
  title: "Affiliate Program",
  description:
    "Join the PostMetric affiliate program. Earn 60% commission for 24 months, 90-day cookie. The most generous analytics affiliate program.",
  alternates: { canonical: `${SEO_BASE_URL}/affiliate` },
  openGraph: {
    title: "Affiliate Program (60%) | PostMetric",
    description:
      "Earn 60% commission for 24 months. Join the PostMetric affiliate program and get paid for every customer you refer.",
    url: `${SEO_BASE_URL}/affiliate`,
  },
};

const STATS = [
  { value: "60%", label: "Commission" },
  { value: "24", label: "Months" },
  { value: "90", label: "Cookie days" },
];

const BENEFIT_CARDS = [
  {
    icon: Gift,
    title: "60% for 24 months",
    description:
      "Earn on every payment, including recurring subscriptions. We pay out more than anyone in the analytics space.",
  },
  {
    icon: RotateCcw,
    title: "90-day cookie",
    description:
      "Longer window means more conversions count as yours. Visitors have time to try, decide, and subscribe.",
  },
  {
    icon: BarChart3,
    title: "Real-time dashboard",
    description:
      "Track clicks, signups, and earnings in real time. See exactly how your referrals are performing.",
  },
  {
    icon: Wallet,
    title: "Simple payouts",
    description:
      "Get paid via PayPal or bank transfer. No minimum thresholds to wait for—we process promptly.",
  },
  {
    icon: Link2,
    title: "Tracking links",
    description:
      "Unique links and UTM parameters for every campaign. Know which content drives your best conversions.",
  },
  {
    icon: FileText,
    title: "Marketing assets",
    description:
      "Banners, logos, and copy we provide. Share PostMetric with your audience without extra design work.",
  },
];

const STEPS = [
  {
    num: "1",
    title: "Sign up",
    text: "Create your affiliate account in under a minute.",
  },
  {
    num: "2",
    title: "Share",
    text: "Use your link on your site, newsletter, or social.",
  },
  { num: "3", title: "Earn", text: "Get 60% of every payment for 24 months." },
];

export default function AffiliatePage() {
  return (
    <div className="flex flex-col w-full items-center min-h-screen bg-stone-50">
      <Navbar />
      <main
        className={`items-center w-full ${LANDING_MAX_W} border-x border-stone-200 flex flex-col bg-stone-50`}
      >
        {/* Hero - split layout with big stat */}
        <section className="w-full border-b border-stone-200">
          <div className="flex flex-col lg:flex-row lg:min-h-[420px]">
            <div className="flex-1 flex flex-col justify-center px-6 lg:px-12 py-16 lg:py-20">
              <p className="text-xs font-mono uppercase text-stone-500 tracking-wider mb-4">
                Affiliate Program
              </p>
              <h1 className="font-cooper text-[32px] lg:text-[44px] leading-[1.15] text-stone-900 max-w-xl">
                Share PostMetric. Earn 60%.
              </h1>
              <p className="text-stone-600 text-lg mt-4 max-w-lg leading-relaxed">
                Recommend analytics that actually help. Get 60% commission for
                24 months, 90-day cookie, and payouts on every
                subscription—including renewals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <a
                  href="https://postmetric.getrewardful.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-postmetric-goal="affiliate_join"
                  data-postmetric-goal-location="hero"
                  className="inline-flex items-center justify-center gap-2 font-semibold font-mono uppercase border border-stone-800 bg-stone-800 text-white px-6 py-3 rounded text-xs hover:bg-stone-700 transition-all w-full sm:w-auto"
                >
                  Join the program
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </a>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center font-semibold font-mono uppercase border border-stone-200 bg-white text-stone-700 px-6 py-3 rounded text-xs hover:bg-stone-50 transition-all w-full sm:w-auto"
                >
                  View pricing
                </Link>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-12 lg:py-20 bg-stone-100/50 border-t lg:border-t-0 lg:border-l border-stone-200">
              <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-center justify-center">
                {STATS.map((stat, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="font-cooper text-4xl lg:text-5xl text-stone-800 tabular-nums">
                      {stat.value}
                    </span>
                    <span className="text-xs font-mono uppercase text-stone-500 mt-1">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="w-full">
          <div className="px-6 lg:px-12 py-12 lg:py-16">
            <h2 className="font-cooper text-2xl lg:text-3xl text-stone-900 mb-10 text-center">
              How it works
            </h2>
            <div className="flex flex-col md:flex-row gap-8 md:gap-4 max-w-3xl mx-auto">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center flex-1 relative"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-stone-800 flex items-center justify-center text-stone-800 font-mono font-bold text-lg mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-semibold text-stone-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-stone-500 text-sm">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Earnings calculator */}
        <section className="w-full border-b border-stone-200">
          <div className="px-6 lg:px-12 py-12 lg:py-16">
            <div className="max-w-4xl mx-auto">
              <AffiliateEarningsCalculator />
            </div>
          </div>
        </section>

        {/* Benefits grid - FeatureCards style */}
        <section className="w-full border-b border-stone-200">
          <div className="flex flex-col lg:flex-row lg:divide-x divide-stone-200">
            {BENEFIT_CARDS.slice(0, 3).map((card, i) => (
              <div
                key={i}
                className="flex flex-col border-b lg:border-b-0 lg:border-y-0 border-stone-200 flex-1"
              >
                <div className="py-8 px-6 lg:px-10 flex flex-col gap-6">
                  <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center border border-stone-200 text-stone-700">
                    <card.icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-stone-800 font-normal text-xl font-cooper">
                      {card.title}
                    </h3>
                    <p className="text-stone-500 font-normal text-sm leading-6">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col lg:flex-row lg:divide-x divide-stone-200 border-t border-stone-200">
            {BENEFIT_CARDS.slice(3, 6).map((card, i) => (
              <div
                key={i}
                className="flex flex-col border-b lg:border-b-0 border-stone-200 flex-1"
              >
                <div className="py-8 px-6 lg:px-10 flex flex-col gap-6">
                  <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center border border-stone-200 text-stone-700">
                    <card.icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-stone-800 font-normal text-xl font-cooper">
                      {card.title}
                    </h3>
                    <p className="text-stone-500 font-normal text-sm leading-6">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full px-6 lg:px-12 py-12 lg:py-16 bg-gradient-to-br from-stone-100 via-stone-50 to-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div>
              <h2 className="font-cooper text-xl lg:text-2xl text-stone-900">
                Ready to earn?
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                Already an affiliate?{" "}
                <a
                  href="https://postmetric.getrewardful.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-800 font-medium hover:underline"
                >
                  Log in to your dashboard
                </a>
              </p>
            </div>
            <a
              href="https://postmetric.getrewardful.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center justify-center gap-2 font-semibold font-mono uppercase border border-stone-800 bg-stone-800 text-white px-8 py-4 rounded text-xs hover:bg-stone-700 transition-all"
            >
              Become an affiliate
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>
        </section>

        <div className="w-full border-b border-stone-200" />
        <Footer />
      </main>
    </div>
  );
}
