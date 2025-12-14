/**
 * Test script to check all geolocation APIs and verify if they provide lat/long
 */

const TEST_IP = "8.8.8.8"; // Google's public DNS - good for testing

interface ApiResult {
  apiName: string;
  url: string;
  success: boolean;
  hasLatLong: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
  fullResponse?: any;
}

async function testIpapiCo(ip: string): Promise<ApiResult> {
  const IPAPI_KEY = process.env.IPAPI_KEY;
  const url = IPAPI_KEY
    ? `https://ipapi.co/${ip}/json/?key=${IPAPI_KEY}`
    : `https://ipapi.co/${ip}/json/`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "PostMetric/1.0",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.error) {
        return {
          apiName: "ipapi.co",
          url,
          success: false,
          hasLatLong: false,
          error: data.reason || "API returned error",
          fullResponse: data,
        };
      }

      const hasLatLong =
        typeof data.latitude === "number" &&
        !isNaN(data.latitude) &&
        typeof data.longitude === "number" &&
        !isNaN(data.longitude);

      return {
        apiName: "ipapi.co",
        url,
        success: true,
        hasLatLong,
        latitude: data.latitude,
        longitude: data.longitude,
        fullResponse: data,
      };
    } else {
      return {
        apiName: "ipapi.co",
        url,
        success: false,
        hasLatLong: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error: any) {
    return {
      apiName: "ipapi.co",
      url,
      success: false,
      hasLatLong: false,
      error: error.message || "Network error",
    };
  }
}

async function testIpStack(ip: string): Promise<ApiResult> {
  const IPSTACK_API_KEY = process.env.IPSTACK_API_KEY;
  if (!IPSTACK_API_KEY) {
    return {
      apiName: "IPStack",
      url: "http://api.ipstack.com/...",
      success: false,
      hasLatLong: false,
      error: "IPSTACK_API_KEY not set in environment",
    };
  }

  const url = `http://api.ipstack.com/${ip}?access_key=${IPSTACK_API_KEY}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "PostMetric/1.0",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.error) {
        return {
          apiName: "IPStack",
          url,
          success: false,
          hasLatLong: false,
          error: data.error.info || "API returned error",
          fullResponse: data,
        };
      }

      const hasLatLong =
        typeof data.latitude === "number" &&
        !isNaN(data.latitude) &&
        typeof data.longitude === "number" &&
        !isNaN(data.longitude);

      return {
        apiName: "IPStack",
        url,
        success: true,
        hasLatLong,
        latitude: data.latitude,
        longitude: data.longitude,
        fullResponse: data,
      };
    } else {
      return {
        apiName: "IPStack",
        url,
        success: false,
        hasLatLong: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error: any) {
    return {
      apiName: "IPStack",
      url,
      success: false,
      hasLatLong: false,
      error: error.message || "Network error",
    };
  }
}

async function testIpApiCom(ip: string): Promise<ApiResult> {
  const url = `http://ip-api.com/json/${ip}?fields=status,message,countryCode,regionName,city,lat,lon`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "PostMetric/1.0",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status !== "success") {
        return {
          apiName: "ip-api.com",
          url,
          success: false,
          hasLatLong: false,
          error: data.message || "API returned error",
          fullResponse: data,
        };
      }

      const hasLatLong =
        typeof data.lat === "number" &&
        !isNaN(data.lat) &&
        typeof data.lon === "number" &&
        !isNaN(data.lon);

      return {
        apiName: "ip-api.com",
        url,
        success: true,
        hasLatLong,
        latitude: data.lat,
        longitude: data.lon,
        fullResponse: data,
      };
    } else {
      return {
        apiName: "ip-api.com",
        url,
        success: false,
        hasLatLong: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error: any) {
    return {
      apiName: "ip-api.com",
      url,
      success: false,
      hasLatLong: false,
      error: error.message || "Network error",
    };
  }
}

async function main() {
  console.log("=".repeat(80));
  console.log("Testing Geolocation APIs for Lat/Long Support");
  console.log("=".repeat(80));
  console.log(`Test IP: ${TEST_IP}\n`);

  const results: ApiResult[] = [];

  // Test ipapi.co
  console.log("1. Testing ipapi.co...");
  const result1 = await testIpapiCo(TEST_IP);
  results.push(result1);
  console.log(`   Success: ${result1.success}`);
  console.log(`   Has Lat/Long: ${result1.hasLatLong}`);
  if (result1.hasLatLong) {
    console.log(`   Latitude: ${result1.latitude}`);
    console.log(`   Longitude: ${result1.longitude}`);
  }
  if (result1.error) {
    console.log(`   Error: ${result1.error}`);
  }
  console.log();

  // Test IPStack
  console.log("2. Testing IPStack...");
  const result2 = await testIpStack(TEST_IP);
  results.push(result2);
  console.log(`   Success: ${result2.success}`);
  console.log(`   Has Lat/Long: ${result2.hasLatLong}`);
  if (result2.hasLatLong) {
    console.log(`   Latitude: ${result2.latitude}`);
    console.log(`   Longitude: ${result2.longitude}`);
  }
  if (result2.error) {
    console.log(`   Error: ${result2.error}`);
  }
  console.log();

  // Test ip-api.com
  console.log("3. Testing ip-api.com...");
  const result3 = await testIpApiCom(TEST_IP);
  results.push(result3);
  console.log(`   Success: ${result3.success}`);
  console.log(`   Has Lat/Long: ${result3.hasLatLong}`);
  if (result3.hasLatLong) {
    console.log(`   Latitude: ${result3.latitude}`);
    console.log(`   Longitude: ${result3.longitude}`);
  }
  if (result3.error) {
    console.log(`   Error: ${result3.error}`);
  }
  console.log();

  // Summary
  console.log("=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  results.forEach((result) => {
    const status = result.success
      ? result.hasLatLong
        ? "✅ SUCCESS (Has Lat/Long)"
        : "⚠️  SUCCESS (No Lat/Long)"
      : "❌ FAILED";
    console.log(`${result.apiName}: ${status}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  console.log("\n" + "=".repeat(80));
  console.log("Full Response Details (if available):");
  console.log("=".repeat(80));
  results.forEach((result) => {
    if (result.fullResponse) {
      console.log(`\n${result.apiName}:`);
      console.log(JSON.stringify(result.fullResponse, null, 2));
    }
  });
}

main().catch(console.error);
