import { SEO_BASE_URL, SEO_SITE_NAME, SEO_DEFAULT_OG_IMAGE } from "./constants";

/**
 * Organization schema - helps Google understand business identity,
 * enables knowledge panel, and improves brand visibility.
 */
export function getOrganizationSchema() {
  const fullImageUrl = SEO_DEFAULT_OG_IMAGE.startsWith("http")
    ? SEO_DEFAULT_OG_IMAGE
    : `${SEO_BASE_URL}${SEO_DEFAULT_OG_IMAGE}`;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_SITE_NAME,
    alternateName: ["PostMetric", "Postmetric", "postmetric.io"],
    url: SEO_BASE_URL,
    logo: fullImageUrl,
    description:
      "Privacy-friendly Google Analytics alternative. Cookie-free analytics and revenue attribution. Find out which marketing channels drive your revenue.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@postmetric.io",
      contactType: "customer service",
      url: `${SEO_BASE_URL}/login`,
    },
    knowsAbout: [
      "Web Analytics",
      "Google Analytics Alternative",
      "Revenue Attribution",
      "Cookie-Free Tracking",
      "Conversion Tracking",
      "Marketing Analytics",
      "Traffic Sources",
      "Stripe Integration",
      "Privacy-First Analytics",
      "SaaS",
    ],
    serviceType: "Analytics Platform",
    areaServed: "Worldwide",
  };
}

/**
 * WebSite schema - helps Google understand site structure,
 * enables site links and navigation understanding.
 */
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SEO_SITE_NAME,
    alternateName: ["PostMetric", "Postmetric"],
    url: SEO_BASE_URL,
    description:
      "Privacy-friendly Google Analytics alternative. Cookie-free analytics and revenue attribution.",
    publisher: {
      "@type": "Organization",
      name: SEO_SITE_NAME,
      logo: `${SEO_BASE_URL}/icon.svg`,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "WebPage",
            name: "Login",
            url: `${SEO_BASE_URL}/login`,
            description: "Access your PostMetric account",
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "WebPage",
            name: "Demo",
            url: `${SEO_BASE_URL}/demo`,
            description: "Try PostMetric analytics with live demo",
          },
        },
        {
          "@type": "ListItem",
          position: 3,
          item: {
            "@type": "WebPage",
            name: "Pricing",
            url: `${SEO_BASE_URL}/pricing`,
            description: "PostMetric pricing plans",
          },
        },
        {
          "@type": "ListItem",
          position: 4,
          item: {
            "@type": "WebPage",
            name: "Blog",
            url: `${SEO_BASE_URL}/blog`,
            description: "Analytics insights and guides",
          },
        },
        {
          "@type": "ListItem",
          position: 5,
          item: {
            "@type": "WebPage",
            name: "Affiliate Program",
            url: `${SEO_BASE_URL}/affiliate`,
            description: "Earn 60% commission for 24 months",
          },
        },
      ],
    },
  };
}

/**
 * SoftwareApplication schema - helps Google understand the product.
 */
export function getSoftwareApplicationSchema() {
  const fullImageUrl = SEO_DEFAULT_OG_IMAGE.startsWith("http")
    ? SEO_DEFAULT_OG_IMAGE
    : `${SEO_BASE_URL}${SEO_DEFAULT_OG_IMAGE}`;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SEO_SITE_NAME,
    alternateName: ["PostMetric", "Postmetric", "postmetric.io"],
    url: SEO_BASE_URL,
    description:
      "Privacy-friendly Google Analytics alternative. Find out which marketing channels drive your revenue. Cookie-free analytics with Stripe integration.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier available",
    },
    author: {
      "@type": "Organization",
      name: SEO_SITE_NAME,
      url: SEO_BASE_URL,
    },
    featureList: [
      "Google Analytics alternative",
      "Cookie-free analytics",
      "Revenue attribution",
      "Marketing channels drive revenue",
      "Stripe integration",
      "Conversion tracking",
      "Real-time dashboard",
      "Traffic source analytics",
    ],
    screenshot: fullImageUrl,
  };
}
