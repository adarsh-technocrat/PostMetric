export interface UTMParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export function buildUtmUrl(
  baseUrl: string,
  params: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  },
): string {
  const u = baseUrl.trim();
  if (!u) return "";

  let url: URL;
  try {
    url = new URL(u.startsWith("http") ? u : `https://${u}`);
  } catch {
    return u;
  }

  const addParam = (key: string, value: string) => {
    if (value && value.trim()) {
      url.searchParams.set(key, value.trim());
    }
  };

  addParam("utm_source", params.utm_source || "");
  addParam("utm_medium", params.utm_medium || "");
  addParam("utm_campaign", params.utm_campaign || "");
  addParam("utm_term", params.utm_term || "");
  addParam("utm_content", params.utm_content || "");

  return url.toString();
}

export function extractUrlParams(
  referrer: string | null | undefined,
  path?: string,
): {
  param_ref?: string;
  param_via?: string;
  utm_source?: string;
  utm_medium?: string;
} {
  const params: any = {};

  if (referrer) {
    try {
      const referrerUrl = referrer.startsWith("http")
        ? referrer
        : `https://${referrer}`;
      const urlObj = new URL(referrerUrl);

      const paramRef =
        urlObj.searchParams.get("ref") || urlObj.searchParams.get("param_ref");
      const paramVia =
        urlObj.searchParams.get("via") || urlObj.searchParams.get("param_via");
      const utmSource = urlObj.searchParams.get("utm_source");
      const utmMedium = urlObj.searchParams.get("utm_medium");

      if (paramRef) params.param_ref = paramRef;
      if (paramVia) params.param_via = paramVia;
      if (utmSource) params.utm_source = utmSource;
      if (utmMedium) params.utm_medium = utmMedium;
    } catch (error) {
      // Referrer might not be a valid URL, continue
    }
  }

  // Also try to extract from path if provided
  if (path) {
    try {
      const pathUrl = path.startsWith("http")
        ? path
        : `https://example.com${path}`;
      const urlObj = new URL(pathUrl);

      const paramRef =
        urlObj.searchParams.get("ref") || urlObj.searchParams.get("param_ref");
      const paramVia =
        urlObj.searchParams.get("via") || urlObj.searchParams.get("param_via");
      const utmSource = urlObj.searchParams.get("utm_source");
      const utmMedium = urlObj.searchParams.get("utm_medium");

      if (paramRef && !params.param_ref) params.param_ref = paramRef;
      if (paramVia && !params.param_via) params.param_via = paramVia;
      if (utmSource && !params.utm_source) params.utm_source = utmSource;
      if (utmMedium && !params.utm_medium) params.utm_medium = utmMedium;
    } catch (error) {
      // Path might not be a valid URL, continue
    }
  }

  return params;
}
