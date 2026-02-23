import { SEO_BASE_URL } from "./constants";

export interface SitemapUrl {
  url: string;
  lastModified: Date;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
}

export function generateSitemapXml(urls: SitemapUrl[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastModified.toISOString()}</lastmod>
    <changefreq>${url.changeFrequency}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

export interface SitemapIndexEntry {
  url: string;
  lastModified: string;
}

export function generateSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <sitemap>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;
}

export function isProductionEnvironment(): boolean {
  const baseUrl = SEO_BASE_URL;
  const isDevelopmentOrTest =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  const isStaging =
    baseUrl.includes("staging") ||
    baseUrl.includes("preview") ||
    baseUrl.includes("dev");

  // Allow sitemaps in development if flag is set
  if (process.env.NEXT_PUBLIC_ENABLE_SITEMAPS_IN_DEV === "true") {
    return true;
  }

  return !isDevelopmentOrTest && !isStaging;
}
