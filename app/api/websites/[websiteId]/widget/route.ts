import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { websiteId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const shareId = searchParams.get("shareId");
  const mainTextSize = searchParams.get("mainTextSize");
  const primaryColor = searchParams.get("primaryColor");
  const secondaryColor = searchParams.get("secondaryColor");

  const widgetUrl = new URL(`/widgets/${websiteId}`, request.url);
  if (shareId) widgetUrl.searchParams.set("shareId", shareId);
  if (mainTextSize) widgetUrl.searchParams.set("mainTextSize", mainTextSize);
  if (primaryColor) widgetUrl.searchParams.set("primaryColor", primaryColor);
  if (secondaryColor)
    widgetUrl.searchParams.set("secondaryColor", secondaryColor);

  return NextResponse.redirect(widgetUrl, 302);
}
