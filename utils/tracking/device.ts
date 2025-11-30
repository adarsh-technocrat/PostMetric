import { UAParser } from "ua-parser-js";

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface DeviceInfo {
  device: DeviceType;
  browser: string;
  browserVersion?: string;
  os: string;
  osVersion?: string;
}

/**
 * Parse user agent and extract device information
 */
export function parseUserAgent(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return {
      device: "desktop",
      browser: "Unknown",
      os: "Unknown",
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Determine device type
  let device: DeviceType = "desktop";
  if (result.device.type === "mobile") {
    device = "mobile";
  } else if (result.device.type === "tablet") {
    device = "tablet";
  } else {
    // Check screen size or other indicators
    // For now, default to desktop if not explicitly mobile/tablet
    device = "desktop";
  }

  return {
    device,
    browser: result.browser.name || "Unknown",
    browserVersion: result.browser.version || undefined,
    os: result.os.name || "Unknown",
    osVersion: result.os.version || undefined,
  };
}

/**
 * Detect device type from user agent
 */
export function detectDevice(userAgent: string | null): DeviceType {
  if (!userAgent) return "desktop";

  const ua = userAgent.toLowerCase();

  // Mobile devices
  if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    // Check if it's a tablet
    if (
      /ipad|android(?!.*mobile)|tablet|playbook|silk/i.test(ua) ||
      (ua.includes("android") && !ua.includes("mobile"))
    ) {
      return "tablet";
    }
    return "mobile";
  }

  // Tablets
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return "tablet";
  }

  return "desktop";
}
