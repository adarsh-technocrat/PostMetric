import type { MetadataRoute } from "next";
import { SEO_BASE_URL } from "@/lib/seo/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/sitemap.xml",
          "/login",
          "/demo",
          "/pricing",
          "/blog",
          "/blog/*",
          "/changelog",
          "/privacy",
          "/terms",
        ],
        disallow: [
          "/dashboard/",
          "/api/",
          "/feedback/",
          "/globe/",
          "/*.json$",
          "/*.txt$",
          "/*.log$",
          "/*.env$",
          "/*.config$",
        ],
      },
      {
        userAgent: [
          "Googlebot",
          "CHATGPT-User",
          "OAI-SearchBot",
          "PerplexityBot",
          "Claude-SearchBot",
        ],
        allow: [
          "/",
          "/sitemap.xml",
          "/login",
          "/demo",
          "/pricing",
          "/blog",
          "/blog/*",
          "/changelog",
          "/privacy",
          "/terms",
        ],
        disallow: [
          "/dashboard/",
          "/api/",
          "/feedback/",
          "/globe/",
          "/*.json$",
          "/*.txt$",
          "/*.log$",
          "/*.env$",
          "/*.config$",
        ],
      },
    ],
    sitemap: `${SEO_BASE_URL}/sitemap.xml`,
  };
}
