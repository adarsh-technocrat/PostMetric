/**
 * Extract UTM parameters from URL
 */
export interface UTMParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

/**
 * Parse UTM parameters from URL string
 */
export function parseUTMParams(url: string | null): UTMParams {
  if (!url) return {};

  try {
    const urlObj = new URL(url);
    const params: UTMParams = {};

    const utmSource = urlObj.searchParams.get("utm_source");
    const utmMedium = urlObj.searchParams.get("utm_medium");
    const utmCampaign = urlObj.searchParams.get("utm_campaign");
    const utmTerm = urlObj.searchParams.get("utm_term");
    const utmContent = urlObj.searchParams.get("utm_content");

    if (utmSource) params.utmSource = utmSource;
    if (utmMedium) params.utmMedium = utmMedium;
    if (utmCampaign) params.utmCampaign = utmCampaign;
    if (utmTerm) params.utmTerm = utmTerm;
    if (utmContent) params.utmContent = utmContent;

    return params;
  } catch (error) {
    // Invalid URL, return empty
    return {};
  }
}

/**
 * Extract referrer domain from referrer URL
 */
export function extractReferrerDomain(referrer: string | null): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch (error) {
    return null;
  }
}
