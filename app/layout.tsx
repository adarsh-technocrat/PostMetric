import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import {
  SEO_BASE_URL,
  SEO_SITE_NAME,
  SEO_DEFAULT_OG_IMAGE,
} from "@/lib/seo/constants";
import {
  getOrganizationSchema,
  getWebSiteSchema,
  getSoftwareApplicationSchema,
} from "@/lib/seo/structured-data";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SEO_BASE_URL),
  title: {
    default: "Revenue Attribution & Cookie-Free Analytics | PostMetric",
    template: "%s | Postmetric",
  },
  description:
    "Find out which marketing channels drive your revenue—cookie-free analytics with Stripe integration. See the data, get the next move.",
  keywords: [
    "revenue attribution",
    "cookie-free analytics",
    "website analytics",
    "which marketing channels drive revenue",
    "traffic sources revenue",
    "conversion tracking",
    "marketing analytics",
    "Stripe analytics",
    "visitor analytics",
    "privacy-first analytics",
    "GDPR compliant analytics",
    "lightweight analytics",
    "PostMetric",
  ],
  alternates: {
    canonical: SEO_BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SEO_BASE_URL,
    siteName: SEO_SITE_NAME,
    title: "Revenue Attribution & Cookie-Free Analytics | PostMetric",
    description:
      "Find out which marketing channels drive your revenue—cookie-free analytics with Stripe integration.",
    images: [
      {
        url: SEO_DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "PostMetric - Analytics that tell you what to do next",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Revenue Attribution & Cookie-Free Analytics | PostMetric",
    description:
      "Find out which marketing channels drive your revenue—cookie-free analytics with Stripe integration.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: "auto", minHeight: "100%" }}>
      <body
        className={`${dmSans.variable} font-sans bg-background`}
        style={{ height: "auto", minHeight: "100%" }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getOrganizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebSiteSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getSoftwareApplicationSchema()),
          }}
        />
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Script
          defer
          data-website-id="pmid_fdf703b82d846f2109a76457"
          data-domain="postmetric.io"
          src="https://www.postmetric.io/js/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
