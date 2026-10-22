import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import type { Types } from "mongoose";
import connectDB from "@/db";
import Session from "@/db/models/Session";
import PageView from "@/db/models/PageView";
import ExitClick from "@/db/models/ExitClick";
import {
  generateVisitorId,
  generateSessionId,
  getVisitorIdFromCookie,
  getSessionIdFromCookie,
  createVisitorIdCookie,
  createSessionIdCookie,
  sanitizeTrackingId,
  SESSION_TIMEOUT_MS,
} from "@/utils/tracking/visitor";
import { isBotUserAgent } from "@/utils/tracking/bot";
import { isSelfReferrer } from "@/utils/tracking/referrer";
import { parseUserAgent, type DeviceInfo } from "@/utils/tracking/device";
import {
  getLocationFromIP,
  getIPFromHeaders,
  type LocationInfo,
} from "@/utils/tracking/geolocation";
import { shouldExcludeVisit } from "@/utils/tracking/validation";
import { getWebsiteByTrackingCode } from "@/utils/database/website";
import {
  checkTrafficSpike,
  applyAttackModeProtections,
  hashIp,
} from "@/utils/security/attack-mode";
import type { IWebsite } from "@/db/models/Website";
import type { ISession } from "@/db/models/Session";
import type { IPageView } from "@/db/models/PageView";
import { handlePaymentEvent } from "@/utils/revenue/paymentEvents";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

type TrackingEventType =
  | "pageview"
  | "exit_link"
  | "scroll"
  | "click"
  | "custom"
  | "payment";

interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface FinalUtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

interface ExitLinkExtraData {
  exitUrl?: string;
  exitLinkText?: string;
}

interface TrackingRequestBody {
  hostname?: string;
  path?: string;
  title?: string;
  visitorId?: string;
  sessionId?: string;
  type?: TrackingEventType;
  referrer?: string;
  utmParams?: UtmParams;
  extraData?: ExitLinkExtraData | Record<string, unknown>;
}

export async function OPTIONS(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  return handleTrack(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleTrack(request, "POST");
}

async function handleTrack(request: NextRequest, method: "GET" | "POST") {
  try {
    let requestBody: TrackingRequestBody | null = null;
    if (method === "POST") {
      try {
        const body = await request.json();
        requestBody = body as TrackingRequestBody;
      } catch (e) {
        requestBody = null;
      }
    }

    const trackingCode = request.nextUrl.searchParams.get("site");

    if (!trackingCode) {
      return new NextResponse(PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    await connectDB();

    const hostnameForValidation: string = requestBody?.hostname || "unknown";

    const website: IWebsite | null = await getWebsiteByTrackingCode(
      trackingCode,
      hostnameForValidation,
    );
    if (!website) {
      return new NextResponse(PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    const headers: Headers = request.headers;
    const cookieHeader: string | null = headers.get("cookie");
    const userAgent: string | null = headers.get("user-agent");
    const ip: string = getIPFromHeaders(headers);

    let path: string =
      request.nextUrl.searchParams.get("path") || requestBody?.path || "/";
    let title: string | undefined =
      request.nextUrl.searchParams.get("title") ||
      requestBody?.title ||
      undefined;
    const hostname: string = hostnameForValidation;
    const bodyVisitorId: string | null = requestBody?.visitorId || null;
    const bodySessionId: string | null = requestBody?.sessionId || null;
    const eventType: TrackingEventType | undefined = requestBody?.type;
    const extraData: ExitLinkExtraData | Record<string, unknown> =
      requestBody?.extraData || {};

    const clientReferrer: string | null = requestBody?.referrer || null;
    const utmParams: UtmParams = requestBody?.utmParams || {};

    let visitorId: string = getVisitorIdFromCookie(cookieHeader) || "";
    if (!visitorId && bodyVisitorId) {
      visitorId = bodyVisitorId;
    }
    if (!visitorId) {
      visitorId = generateVisitorId();
    }

    let sessionId: string = getSessionIdFromCookie(cookieHeader) || "";
    if (!sessionId && bodySessionId) {
      sessionId = bodySessionId;
    }
    const isNewSession: boolean = !sessionId;
    if (!sessionId) {
      sessionId = generateSessionId();
    }

    // A payment event ties a checkout or email to this visitor. It is not a
    // page view, so it must not touch the session or page view counts.
    if (eventType === "payment") {
      try {
        await handlePaymentEvent(website, extraData as Record<string, unknown>, {
          visitorId,
          sessionId: isNewSession ? undefined : sessionId,
        });
      } catch {
        // Revenue still arrives through the provider sync.
      }
      return new NextResponse(PIXEL, {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate, private",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Known crawlers, headless browsers and audit tools are not visitors.
    if (isBotUserAgent(userAgent)) {
      return pixelResponse();
    }

    // Ids from the request body are client input: accept only id-shaped values.
    if (!sanitizeTrackingId(visitorId)) {
      visitorId = generateVisitorId();
    }
    const candidateSessionId: string | null = isNewSession
      ? null
      : sanitizeTrackingId(sessionId);

    // Sanitize and validate inputs
    // Limit path length to prevent DoS
    if (path.length > 2048) {
      path = path.substring(0, 2048);
    }
    // Remove null bytes and dangerous characters
    path = path.replace(/\0/g, "").replace(/[\x00-\x1F\x7F]/g, "");

    // Limit title length
    if (title && title.length > 500) {
      title = title.substring(0, 500);
    }
    if (title) {
      title = title.replace(/\0/g, "").replace(/[\x00-\x1F\x7F]/g, "");
    }

    let referrer: string | null = clientReferrer || null;

    let referrerDomain: string | null = null;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        referrerDomain = referrerUrl.hostname;
      } catch {
        referrerDomain = referrer.includes("://")
          ? referrer.split("://")[1]?.split("/")[0] || null
          : referrer;
      }
    }

    // A referrer on the website's own domain (or a subdomain / additional
    // domain) is internal navigation, not a traffic source.
    if (referrerDomain && isSelfReferrer(referrerDomain, website)) {
      referrer = null;
      referrerDomain = null;
    }

    let finalUtmParams: FinalUtmParams = {};
    if (utmParams?.utm_source) {
      finalUtmParams = {
        utmSource: utmParams.utm_source,
        utmMedium: utmParams.utm_medium || "unknown",
        utmCampaign: utmParams.utm_campaign || undefined,
        utmTerm: utmParams.utm_term || undefined,
        utmContent: utmParams.utm_content || undefined,
      };
    }

    const deviceInfo: DeviceInfo = parseUserAgent(userAgent);

    const location: LocationInfo = await getLocationFromIP(ip);

    const websiteIdStr: string = website._id.toString();
    const ipHash: string = hashIp(ip, websiteIdStr);

    await checkTrafficSpike(websiteIdStr, website);

    // Apply attack mode protections (per hashed IP)
    const protection: { allowed: boolean; reason?: string } =
      await applyAttackModeProtections(websiteIdStr, ipHash, website);

    if (!protection.allowed) {
      return pixelResponse();
    }

    // Check exclusion rules
    if (shouldExcludeVisit(website, ip, location.country, hostname, path)) {
      return pixelResponse();
    }

    // Hash path if enabled
    if (website.settings?.hashPaths) {
      path = `#${createHash("sha256").update(path).digest("hex").slice(0, 16)}`;
    }

    const now: Date = new Date();

    // An exit-link click is not a page view: record it on its own and leave
    // the session's page view / bounce counters alone.
    if (eventType === "exit_link") {
      const exitData = extraData as ExitLinkExtraData;
      const exitUrl =
        typeof exitData.exitUrl === "string"
          ? exitData.exitUrl.substring(0, 2048)
          : "";
      if (exitUrl) {
        await ExitClick.create({
          websiteId: website._id,
          sessionId: candidateSessionId || sessionId,
          visitorId,
          path,
          exitUrl,
          exitLinkText:
            typeof exitData.exitLinkText === "string"
              ? exitData.exitLinkText.substring(0, 255)
              : undefined,
          timestamp: now,
        });
      }
      return pixelResponse();
    }

    sessionId = await resolveSessionId(
      website._id,
      visitorId,
      candidateSessionId,
      now,
    );

    await upsertSession({
      websiteId: website._id,
      sessionId,
      now,
      insertFields: {
        visitorId,
        firstVisitAt: now,
        referrer: referrer || undefined,
        referrerDomain: referrerDomain || undefined,
        ...finalUtmParams,
        ...deviceInfo,
        ...location,
      },
    });

    // Create page view
    const pageView: IPageView = new PageView({
      websiteId: website._id,
      sessionId,
      visitorId,
      path,
      hostname,
      title,
      referrer: referrer,
      referrerPath: referrer
        ? (() => {
            try {
              return new URL(referrer).pathname;
            } catch {
              return undefined;
            }
          })()
        : undefined,
      ...finalUtmParams,
      ...deviceInfo,
      ...location,
      ipHash,
      timestamp: now,
    });
    await pageView.save();

    const protocol: string =
      request.headers.get("x-forwarded-proto") ||
      request.nextUrl.protocol.slice(0, -1);
    const isSecure: boolean = protocol === "https";

    const response: NextResponse = new NextResponse(PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        // CORS headers for cross-origin tracking
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        // The script adopts this id (the server may have started a new
        // session after 30 minutes of inactivity).
        "X-PM-Session-Id": sessionId,
        "Access-Control-Expose-Headers": "X-PM-Session-Id",
      },
    });
    response.headers.append(
      "Set-Cookie",
      createVisitorIdCookie(visitorId, isSecure),
    );
    response.headers.append(
      "Set-Cookie",
      createSessionIdCookie(sessionId, isSecure),
    );

    return response;
  } catch (error) {
    return new NextResponse(PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}

function pixelResponse(): NextResponse {
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate, private",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Pick the session this hit belongs to.
 * - A known session seen within the last 30 minutes continues.
 * - A known but expired session is replaced: reuse the visitor's session
 *   that already replaced it (if still active), else start a new one.
 * - An unknown/missing id reuses the visitor's session active in the last
 *   5 minutes (cookies lost), else uses the client's id or a new one.
 */
async function resolveSessionId(
  websiteId: Types.ObjectId,
  visitorId: string,
  candidateSessionId: string | null,
  now: Date,
): Promise<string> {
  const activeCutoff = new Date(now.getTime() - SESSION_TIMEOUT_MS);

  if (candidateSessionId) {
    const existing = await Session.findOne(
      { websiteId, sessionId: candidateSessionId },
      { lastSeenAt: 1 },
    ).lean<{ lastSeenAt?: Date } | null>();

    if (existing) {
      if (existing.lastSeenAt && existing.lastSeenAt >= activeCutoff) {
        return candidateSessionId;
      }
      const replacement = await Session.findOne(
        {
          websiteId,
          visitorId,
          sessionId: { $ne: candidateSessionId },
          lastSeenAt: { $gte: activeCutoff },
        },
        { sessionId: 1 },
      )
        .sort({ lastSeenAt: -1 })
        .lean<{ sessionId: string } | null>();
      return replacement?.sessionId || generateSessionId();
    }
  }

  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const recent = await Session.findOne(
    { websiteId, visitorId, lastSeenAt: { $gte: fiveMinutesAgo } },
    { sessionId: 1 },
  )
    .sort({ lastSeenAt: -1 })
    .lean<{ sessionId: string } | null>();

  return recent?.sessionId || candidateSessionId || generateSessionId();
}

/**
 * Create the session or count another page view on it, atomically.
 * Relies on the unique {websiteId, sessionId} index; a concurrent insert
 * that loses the race is retried as an update.
 */
async function upsertSession(args: {
  websiteId: Types.ObjectId;
  sessionId: string;
  now: Date;
  insertFields: Record<string, unknown>;
}): Promise<void> {
  const { websiteId, sessionId, now } = args;
  const insertFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args.insertFields)) {
    if (value !== undefined && value !== null) insertFields[key] = value;
  }

  let doc: ISession | null = null;
  let updatedExisting = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await Session.findOneAndUpdate(
        { websiteId, sessionId },
        {
          $setOnInsert: { ...insertFields, bounce: true, duration: 0 },
          $inc: { pageViews: 1 },
          $set: { lastSeenAt: now },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: false,
          includeResultMetadata: true,
        },
      );
      doc = result?.value ?? null;
      updatedExisting = Boolean(result?.lastErrorObject?.updatedExisting);
      break;
    } catch (error) {
      const code = (error as { code?: number })?.code;
      if (code === 11000 && attempt === 0) continue;
      throw error;
    }
  }

  if (doc && updatedExisting) {
    const duration = Math.max(
      0,
      Math.floor((now.getTime() - new Date(doc.firstVisitAt).getTime()) / 1000),
    );
    await Session.updateOne(
      { _id: doc._id },
      { $set: { bounce: false }, $max: { duration } },
    );
  }
}
