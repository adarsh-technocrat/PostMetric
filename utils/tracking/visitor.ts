import { randomBytes } from "crypto";

export function generateVisitorId(): string {
  return randomBytes(16).toString("hex");
}

export function generateSessionId(): string {
  return randomBytes(16).toString("hex");
}

export function getVisitorIdFromCookie(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies["_pm_vid"] || null;
}

export function getSessionIdFromCookie(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies["_pm_sid"] || null;
}

export function createVisitorIdCookie(
  visitorId: string,
  isSecure: boolean = false
): string {
  const secureFlag = isSecure ? "; Secure" : "";
  return `_pm_vid=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax${secureFlag}`;
}

export function createSessionIdCookie(
  sessionId: string,
  isSecure: boolean = false
): string {
  const secureFlag = isSecure ? "; Secure" : "";
  return `_pm_sid=${sessionId}; Path=/; Max-Age=1800; SameSite=Lax${secureFlag}`; // 30 minutes
}
