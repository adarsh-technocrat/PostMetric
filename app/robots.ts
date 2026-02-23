import type { MetadataRoute } from "next";
import { SEO_BASE_URL } from "@/lib/seo/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/llms.txt",
          "/sitemap.xml",
          "/login",
          "/demo",
          "/pricing",
          "/affiliate",
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
          "/llms.txt",
          "/sitemap.xml",
          "/login",
          "/demo",
          "/pricing",
          "/affiliate",
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
