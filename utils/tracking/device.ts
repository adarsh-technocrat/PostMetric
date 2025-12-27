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

export function getSystemImageUrl(
  name: string,
  type: "browser" | "os" | "device"
): string {
  const nameLower = name.toLowerCase();

  if (type === "browser") {
    const browserMap: Record<string, string> = {
      chrome: "chrome",
      "mobile chrome": "chrome",
      firefox: "firefox",
      safari: "safari",
      "mobile safari": "safari",
      edge: "edge",
      opera: "opera",
      "opera touch": "opera-touch",
      "internet explorer": "ie",
      ie: "ie",
      brave: "brave",
      samsung: "samsung-internet",
      "samsung internet": "samsung-internet",
      yandex: "yandex",
      uc: "uc",
      "uc browser": "uc",
      ucbrowser: "uc",
      webkit: "webkit",
      "chrome webview": "chrome",
      gsa: "gsa",
      quark: "quark",
      electron: "electron",
      "avast secure browser": "avast-secure",
      vivo: "vivo",
      wechat: "wechat",
      whale: "whale",
      miui: "miui",
      "miui browser": "miui",
      "android browser": "android-webview",
    };

    if (nameLower.includes("twitter")) {
      return "https://icons.duckduckgo.com/ip3/twitter.com.ico";
    }
    if (nameLower.includes("instagram")) {
      return "https://icons.duckduckgo.com/ip3/instagram.com.ico";
    }
    if (nameLower.includes("facebook")) {
      return "https://icons.duckduckgo.com/ip3/facebook.com.ico";
    }
    if (nameLower.includes("linkedin")) {
      return "https://icons.duckduckgo.com/ip3/linkedin.com.ico";
    }
    if (nameLower.includes("tiktok")) {
      return "https://icons.duckduckgo.com/ip3/tiktok.com.ico";
    }
    if (nameLower.includes("klarna")) {
      return "https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/klarna/klarna_64x64.png";
    }

    for (const [key, folder] of Object.entries(browserMap)) {
      if (nameLower.includes(key)) {
        return `https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/${folder}/${folder}_64x64.png`;
      }
    }

    return "https://icons.duckduckgo.com/ip3/unknown.com.ico";
  } else if (type === "os") {
    const osMap: Record<string, string> = {
      ios: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apple.svg",
      "mac os": "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apple.svg",
      macos: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apple.svg",
      mac: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apple.svg",
      windows:
        "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/microsoft.svg",
      android:
        "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/android.svg",
      linux: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linux.svg",
      ubuntu: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/ubuntu.svg",
      "chromium os":
        "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/chromeos.svg",
      playstation:
        "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/playstation.svg",
    };

    for (const [key, path] of Object.entries(osMap)) {
      if (nameLower.includes(key)) {
        return path;
      }
    }

    return "https://icons.duckduckgo.com/ip3/unknown.com.ico";
  } else if (type === "device") {
    // Use emoji as fallback for device types since there's no good CDN for device icons
    // The component will handle displaying these appropriately
    const deviceMap: Record<string, string> = {
      desktop:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z'/%3E%3C/svg%3E",
      mobile:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z'/%3E%3C/svg%3E",
      tablet:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 14H5V6h14v12z'/%3E%3C/svg%3E",
      console: "https://icons.duckduckgo.com/ip3/unknown.com.ico",
    };

    for (const [key, path] of Object.entries(deviceMap)) {
      if (nameLower.includes(key)) {
        return path;
      }
    }

    return "https://icons.duckduckgo.com/ip3/unknown.com.ico";
  }

  return "https://icons.duckduckgo.com/ip3/unknown.com.ico";
}
