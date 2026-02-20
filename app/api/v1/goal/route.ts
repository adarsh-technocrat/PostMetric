import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/utils/api/auth";
import { trackGoalEvent } from "@/utils/database/goal";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiRequest(request);

    if (!auth) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: 401,
            message: "Unauthorized. Invalid or missing API key.",
          },
        },
        { status: 401 },
      );
    }

    const { websiteId } = auth;
    const body = (await request.json()) as Record<string, unknown>;
    const { event, value, visitorId, sessionId, path, ...rest } = body;

    if (!event || typeof event !== "string") {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: 400,
            message: "event parameter is required",
          },
        },
        { status: 400 },
      );
    }
    const customData: Record<string, string> = {};
    let count = 0;
    for (const [key, val] of Object.entries(rest)) {
      if (count >= 10) break;
      if (
        typeof key !== "string" ||
        key.length > 64 ||
        !/^[a-z0-9_-]+$/.test(key.toLowerCase())
      )
        continue;
      const str = val == null ? "" : String(val);
      customData[key.toLowerCase()] =
        str.length > 255 ? str.slice(0, 255) : str;
      count++;
    }

    await trackGoalEvent({
      websiteId,
      event,
      value: typeof value === "number" ? value : undefined,
      visitorId: typeof visitorId === "string" ? visitorId : undefined,
      sessionId: typeof sessionId === "string" ? sessionId : undefined,
      path: typeof path === "string" ? path : "/",
      customData,
    });

    return NextResponse.json({
      status: "success",
      data: {
        message: "Goal event tracked successfully",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: 500,
          message: error.message || "Internal server error",
        },
      },
      { status: 500 },
    );
  }
}
