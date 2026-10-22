import { NextRequest, NextResponse } from "next/server";
import { trackGoalEvent } from "@/utils/database/goal";
import { getWebsiteByTrackingCode } from "@/utils/database/website";
import { sanitizeTrackingId } from "@/utils/tracking/visitor";
import { isBotUserAgent } from "@/utils/tracking/bot";

const GOAL_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "X-Content-Type-Options": "nosniff",
};

function getVisitorSessionFromCookies(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const visitorId =
    cookieHeader
      ?.split(";")
      .find((c) => c.trim().startsWith("_pm_vid="))
      ?.split("=")[1] || undefined;
  const sessionId =
    cookieHeader
      ?.split(";")
      .find((c) => c.trim().startsWith("_pm_sid="))
      ?.split("=")[1] || undefined;
  return { visitorId, sessionId };
}

/**
 * Visitor/session ids for a goal. The script sends them explicitly (POST body
 * or GET query) because the _pm_* cookies live on the customer's domain and
 * are never sent cross-origin to PostMetric; cookies are only a fallback.
 */
function resolveVisitorSession(
  request: NextRequest,
  explicit: { visitorId?: unknown; sessionId?: unknown },
) {
  const fromCookies = getVisitorSessionFromCookies(request);
  return {
    visitorId:
      sanitizeTrackingId(explicit.visitorId) ||
      sanitizeTrackingId(fromCookies.visitorId) ||
      undefined,
    sessionId:
      sanitizeTrackingId(explicit.sessionId) ||
      sanitizeTrackingId(fromCookies.sessionId) ||
      undefined,
  };
}

/**
 * Sanitize custom params: lowercase keys, max 10, max 255 chars per value
 */
function sanitizeCustomData(
  data: Record<string, unknown> | null,
): Record<string, string> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out: Record<string, string> = {};
  let count = 0;
  for (const [key, value] of Object.entries(data)) {
    if (count >= 10) break;
    if (
      typeof key !== "string" ||
      key.length > 64 ||
      !/^[a-z0-9_-]+$/.test(key.toLowerCase())
    )
      continue;
    const str = value == null ? "" : String(value);
    out[key.toLowerCase()] = str.length > 255 ? str.slice(0, 255) : str;
    count++;
  }
  return out;
}

/**
 * GET /api/goals/track - Legacy beacon (site, event, value, path)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trackingCode = searchParams.get("site");
    const event = searchParams.get("event");
    const value = searchParams.get("value");

    if (!trackingCode || !event) {
      return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
    }

    if (isBotUserAgent(request.headers.get("user-agent"))) {
      return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
    }

    const website = await getWebsiteByTrackingCode(trackingCode);
    if (!website) {
      return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
    }

    const { visitorId, sessionId } = resolveVisitorSession(request, {
      visitorId: searchParams.get("visitorId"),
      sessionId: searchParams.get("sessionId"),
    });

    await trackGoalEvent({
      websiteId: website._id.toString(),
      event,
      sessionId,
      visitorId,
      path: searchParams.get("path") || "/",
      value: value ? parseFloat(value) : undefined,
    });

    return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
  } catch (error) {
    return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trackingCode = searchParams.get("site");

    if (!trackingCode) {
      return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
    }

    if (isBotUserAgent(request.headers.get("user-agent"))) {
      return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
    }

    const website = await getWebsiteByTrackingCode(trackingCode);
    if (!website) {
      return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const {
      event,
      value,
      path,
      visitorId: bodyVisitorId,
      sessionId: bodySessionId,
      ...rest
    } = body;

    if (!event || typeof event !== "string") {
      return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
    }

    const customData = sanitizeCustomData(rest);
    const { visitorId, sessionId } = resolveVisitorSession(request, {
      visitorId: bodyVisitorId,
      sessionId: bodySessionId,
    });

    await trackGoalEvent({
      websiteId: website._id.toString(),
      event,
      sessionId,
      visitorId,
      path: typeof path === "string" ? path : "/",
      value: typeof value === "number" ? value : undefined,
      customData,
    });

    return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
  } catch (error) {
    return new NextResponse(null, { status: 204, headers: GOAL_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
