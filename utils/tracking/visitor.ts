import { randomBytes } from "crypto";

/**
 * Generate a unique visitor ID
 */
export function generateVisitorId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Get visitor ID from cookie string
 */
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

/**
 * Get session ID from cookie string
 */
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

/**
 * Create cookie string for visitor ID
 */
export function createVisitorIdCookie(visitorId: string): string {
  return `_pm_vid=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}

/**
 * Create cookie string for session ID
 */
export function createSessionIdCookie(sessionId: string): string {
  return `_pm_sid=${sessionId}; Path=/; Max-Age=1800; SameSite=Lax; Secure`; // 30 minutes
}
