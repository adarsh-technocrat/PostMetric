export const DEMO_WEBSITE_ID =
  process.env.DEMO_WEBSITE_ID || "693b22d002658800833f4159";

export function isDemoWebsite(websiteId: string): boolean {
  return websiteId === DEMO_WEBSITE_ID;
}
