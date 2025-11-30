/**
 * Get geolocation from IP address
 * For now, returns a default location
 * In production, integrate with MaxMind, IPStack, or similar service
 */
export interface LocationInfo {
  country: string;
  region?: string;
  city?: string;
}

/**
 * Get location from IP address
 * TODO: Integrate with geolocation service (MaxMind, IPStack, etc.)
 */
export async function getLocationFromIP(ip: string): Promise<LocationInfo> {
  // For development, return default
  // In production, use a geolocation service

  // Example with IPStack (uncomment and configure):
  /*
  const IPSTACK_API_KEY = process.env.IPSTACK_API_KEY;
  if (IPSTACK_API_KEY) {
    try {
      const response = await fetch(
        `http://api.ipstack.com/${ip}?access_key=${IPSTACK_API_KEY}`
      );
      const data = await response.json();
      return {
        country: data.country_code || "Unknown",
        region: data.region_name,
        city: data.city,
      };
    } catch (error) {
      console.error("Geolocation error:", error);
    }
  }
  */

  // Fallback: return default
  return {
    country: "Unknown",
    region: undefined,
    city: undefined,
  };
}

/**
 * Extract IP address from request headers
 */
export function getIPFromHeaders(headers: Headers): string {
  // Check various headers for IP address
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return "0.0.0.0";
}
