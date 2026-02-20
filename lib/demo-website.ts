export const DEMO_WEBSITE_ID =
  process.env.DEMO_WEBSITE_ID || "693b27e0894b4317c12707fe";

export function isDemoWebsite(websiteId: string): boolean {
  return websiteId === DEMO_WEBSITE_ID;
}
