/**
 * Website ID used for the public demo. When this ID is used, API routes
 * may allow unauthenticated read-only access so the landing demo shows real data.
 */
export const DEMO_WEBSITE_ID =
  process.env.DEMO_WEBSITE_ID || "693b22d002658800833f4159";

export function isDemoWebsite(websiteId: string): boolean {
  return websiteId === DEMO_WEBSITE_ID;
}
