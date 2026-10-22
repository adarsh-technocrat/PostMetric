import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
countries.registerLocale(enLocale);

/**
 * Get geolocation from IP address
 * Supports multiple geolocation services:
 * - IPStack (ipstack.com)
 * - ipapi.co (free tier available)
 * - MaxMind GeoIP2 (requires local database)
 */
export interface LocationInfo {
  country: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

const GEO_TIMEOUT_MS = 1500;
const GEO_CACHE_MAX = 5000;
const GEO_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
// Lookups that found nothing are cached briefly so a failing provider is not
// hammered on every request from the same IP.
const GEO_CACHE_MISS_TTL_MS = 10 * 60 * 1000;

const UNKNOWN_LOCATION: LocationInfo = {
  country: "Unknown",
  region: undefined,
  city: undefined,
};

// In-memory LRU (Map keeps insertion order; re-inserting on hit moves to end).
const geoCache = new Map<string, { value: LocationInfo; expiresAt: number }>();

function getCachedLocation(ip: string): LocationInfo | null {
  const entry = geoCache.get(ip);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    geoCache.delete(ip);
    return null;
  }
  geoCache.delete(ip);
  geoCache.set(ip, entry);
  return entry.value;
}

function setCachedLocation(ip: string, value: LocationInfo): void {
  const ttl = value.country === "Unknown" ? GEO_CACHE_MISS_TTL_MS : GEO_CACHE_TTL_MS;
  geoCache.delete(ip);
  geoCache.set(ip, { value, expiresAt: Date.now() + ttl });
  while (geoCache.size > GEO_CACHE_MAX) {
    const oldest = geoCache.keys().next().value;
    if (oldest === undefined) break;
    geoCache.delete(oldest);
  }
}

/** Test hook: empty the geolocation cache. */
export function clearLocationCache(): void {
  geoCache.clear();
}

/**
 * True for addresses that can never be geolocated: unspecified, loopback,
 * RFC1918 (10/8, 172.16/12, 192.168/16), link-local, CGNAT and IPv6
 * loopback / unique-local (fc00::/7) / link-local (fe80::/10).
 */
export function isPrivateIP(rawIp: string): boolean {
  if (!rawIp) return true;
  let ip = rawIp.trim().toLowerCase();
  if (!ip || ip === "unknown") return true;
  ip = ip.replace(/^\[|\]$/g, "");
  // IPv4-mapped IPv6 (::ffff:10.0.0.1)
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) ip = mapped[1];

  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }

  if (ip.includes(":")) {
    if (ip === "::" || ip === "::1") return true;
    // fc00::/7 -> first byte fc or fd
    if (/^f[cd][0-9a-f]{0,2}:/.test(ip)) return true;
    // fe80::/10 -> fe8x..febx
    if (/^fe[89ab][0-9a-f]?:/.test(ip)) return true;
    return false;
  }

  // Not an IP at all: nothing to look up.
  return true;
}

/**
 * Get location from IP address. Tries ipapi.co, IPStack (with key), then
 * ip-api.com; each call is capped at 1.5s and results are cached by IP.
 */
export async function getLocationFromIP(ip: string): Promise<LocationInfo> {
  if (isPrivateIP(ip)) {
    return { ...UNKNOWN_LOCATION };
  }

  const cached = getCachedLocation(ip);
  if (cached) return { ...cached };

  const location = await lookupLocation(ip);
  setCachedLocation(ip, location);
  return { ...location };
}

async function lookupLocation(ip: string): Promise<LocationInfo> {
  // Option 1: ipapi.co (free tier: 1000 requests/day, no API key required)
  // API key is optional - use it for higher rate limits
  const IPAPI_KEY = process.env.IPAPI_KEY;
  try {
    const url = IPAPI_KEY
      ? `https://ipapi.co/${ip}/json/?key=${IPAPI_KEY}`
      : `https://ipapi.co/${ip}/json/`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "PostMetric/1.0",
      },
      signal: AbortSignal.timeout(GEO_TIMEOUT_MS),
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.error) {
        const lat =
          typeof data.latitude === "number" && !isNaN(data.latitude)
            ? data.latitude
            : undefined;
        const lon =
          typeof data.longitude === "number" && !isNaN(data.longitude)
            ? data.longitude
            : undefined;

        return {
          country: data.country_code || "Unknown",
          region: data.region,
          city: data.city,
          latitude: lat,
          longitude: lon,
        };
      }
    }
  } catch {}

  // Option 2: IPStack (requires API key)
  const IPSTACK_API_KEY = process.env.IPSTACK_API_KEY;
  if (IPSTACK_API_KEY) {
    try {
      const response = await fetch(
        `http://api.ipstack.com/${ip}?access_key=${IPSTACK_API_KEY}`,
        {
          headers: {
            "User-Agent": "PostMetric/1.0",
          },
          signal: AbortSignal.timeout(GEO_TIMEOUT_MS),
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (!data.error) {
          const lat =
            typeof data.latitude === "number" && !isNaN(data.latitude)
              ? data.latitude
              : undefined;
          const lon =
            typeof data.longitude === "number" && !isNaN(data.longitude)
              ? data.longitude
              : undefined;

          return {
            country: data.country_code || "Unknown",
            region: data.region_name,
            city: data.city,
            latitude: lat,
            longitude: lon,
          };
        }
      }
    } catch {}
  }

  // Option 3: ip-api.com (free tier: 45 requests/minute)
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,countryCode,regionName,city,lat,lon`,
      {
        headers: {
          "User-Agent": "PostMetric/1.0",
        },
        signal: AbortSignal.timeout(GEO_TIMEOUT_MS),
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.status === "success") {
        const lat =
          typeof data.lat === "number" && !isNaN(data.lat)
            ? data.lat
            : undefined;
        const lon =
          typeof data.lon === "number" && !isNaN(data.lon)
            ? data.lon
            : undefined;

        return {
          country: data.countryCode || "Unknown",
          region: data.regionName,
          city: data.city,
          latitude: lat,
          longitude: lon,
        };
      }
    }
  } catch {}

  return { ...UNKNOWN_LOCATION };
}

export function getIPFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  const cfConnectingIP = headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  return "0.0.0.0";
}

export function getCountryNameFromCode(code: string): string {
  const countryName = countries.getName(code.toUpperCase(), "en");
  return countryName || code;
}

export function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getLocationImageUrlFromCode(
  name: string,
  type: "country" | "region" | "city"
): string {
  if (type === "country") {
    const countryCode = name.length === 2 ? name.toUpperCase() : name;
    return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode}.svg`;
  }
  return "";
}
