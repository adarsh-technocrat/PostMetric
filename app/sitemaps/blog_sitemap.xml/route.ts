import { NextResponse } from "next/server";
import { SEO_BASE_URL } from "@/lib/seo/constants";
import {
  generateSitemapXml,
  isProductionEnvironment,
  type SitemapUrl,
} from "@/lib/seo/sitemap.utils";
import { blogPosts } from "@/lib/blog-data";

export async function GET() {
  if (!isProductionEnvironment()) {
    return new NextResponse("", { status: 404 });
  }

  const baseUrl = SEO_BASE_URL;
  const now = new Date();

  const pages: SitemapUrl[] = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.id}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const xml = generateSitemapXml(pages);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
