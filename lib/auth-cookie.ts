/**
 * Auth cookie utilities for firebaseToken.
 * Sets domain=.postmetric.io in production so the cookie works across
 * www.postmetric.io and postmetric.io (avoids redirect-to-login after navigation).
 */

const COOKIE_NAME = "firebaseToken";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

function getCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hostname = window.location.hostname;
  // Localhost: don't set domain (host-only cookie)
  if (hostname === "localhost" || hostname === "127.0.0.1") return undefined;
  // Production: use root domain so cookie works on both www and non-www
  if (hostname === "postmetric.io" || hostname.endsWith(".postmetric.io")) {
    return ".postmetric.io";
  }
  return undefined;
}

export function setAuthCookie(idToken: string): void {
  const isSecure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  let cookie = `${COOKIE_NAME}=${idToken}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  if (isSecure) cookie += "; Secure";
  const domain = getCookieDomain();
  if (domain) cookie += `; domain=${domain}`;
  document.cookie = cookie;
}

export function clearAuthCookie(): void {
  const domain = getCookieDomain();
  let cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  if (domain) cookie += `; domain=${domain}`;
  document.cookie = cookie;
}
