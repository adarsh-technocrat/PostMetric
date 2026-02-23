import { NextResponse } from "next/server";
import { SEO_BASE_URL } from "@/lib/seo/constants";
import {
  generateSitemapIndexXml,
  isProductionEnvironment,
} from "@/lib/seo/sitemap.utils";

export async function GET() {
  if (!isProductionEnvironment()) {
    return new NextResponse("", { status: 404 });
  }

  const baseUrl = SEO_BASE_URL;
  const now = new Date().toISOString();

  const sitemaps = [
    { url: `${baseUrl}/sitemaps/page_sitemap.xml`, lastModified: now },
    { url: `${baseUrl}/sitemaps/blog_sitemap.xml`, lastModified: now },
  ];

  const xml = generateSitemapIndexXml(sitemaps);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
