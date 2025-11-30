import { NextRequest, NextResponse } from "next/server";
import { getWebsitesByUserId, createWebsite } from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const websites = await getWebsitesByUserId(userId);

    return NextResponse.json({ websites }, { status: 200 });
  } catch (error) {
    console.error("Error fetching websites:", error);
    return NextResponse.json(
      { error: "Failed to fetch websites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();

    const { domain, name, iconUrl, settings } = body;

    if (!domain || !name) {
      return NextResponse.json(
        { error: "Domain and name are required" },
        { status: 400 }
      );
    }

    // Basic domain validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    const website = await createWebsite({
      userId,
      domain,
      name,
      iconUrl,
      settings,
    });

    return NextResponse.json({ website }, { status: 201 });
  } catch (error) {
    console.error("Error creating website:", error);
    return NextResponse.json(
      { error: "Failed to create website" },
      { status: 500 }
    );
  }
}
