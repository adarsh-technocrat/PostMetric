import type { IWebsite } from "@/db/models/Website";

/**
 * Check if a visit should be excluded based on website settings
 */
export function shouldExcludeVisit(
  website: IWebsite,
  ip: string,
  country: string,
  hostname: string,
  path: string
): boolean {
  const settings = website.settings || {};

  // Check IP exclusion
  if (settings.excludeIps && settings.excludeIps.length > 0) {
    if (settings.excludeIps.includes(ip)) {
      return true;
    }
  }

  // Check country exclusion
  if (settings.excludeCountries && settings.excludeCountries.length > 0) {
    if (settings.excludeCountries.includes(country)) {
      return true;
    }
  }

  // Check hostname exclusion
  if (settings.excludeHostnames && settings.excludeHostnames.length > 0) {
    if (settings.excludeHostnames.includes(hostname)) {
      return true;
    }
  }

  // Check path exclusion
  if (settings.excludePaths && settings.excludePaths.length > 0) {
    for (const excludedPath of settings.excludePaths) {
      if (path.startsWith(excludedPath)) {
        return true;
      }
    }
  }

  return false;
}
