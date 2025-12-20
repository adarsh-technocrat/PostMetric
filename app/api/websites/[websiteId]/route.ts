import { NextRequest, NextResponse } from "next/server";
import {
  getWebsiteById,
  updateWebsite,
  deleteWebsite,
} from "@/utils/database/website";
import { getUserId } from "@/lib/get-session";
import { isValidObjectId } from "@/utils/validation";
import Stripe from "stripe";
import { sanitizeWebsiteForFrontend } from "@/utils/database/website-sanitize";
import {
  registerPaymentProviderSync,
  unregisterPaymentProviderSync,
} from "@/utils/jobs/register";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 }
      );
    }

    const website = await getWebsiteById(websiteId);

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    const userId = await getUserId();
    if (!userId || website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sanitizedWebsite = sanitizeWebsiteForFrontend(website);

    return NextResponse.json({ website: sanitizedWebsite }, { status: 200 });
  } catch (error) {
    console.error("Error fetching website:", error);
    return NextResponse.json(
      { error: "Failed to fetch website" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;

    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 }
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, domain, iconUrl, settings, paymentProviders } = body;

    // Check if this is a new Stripe key being added
    const isNewStripeKey =
      paymentProviders?.stripe?.apiKey &&
      website.paymentProviders?.stripe?.apiKey !==
        paymentProviders.stripe.apiKey;

    // Check if Stripe is being removed
    const isStripeRemoved =
      !paymentProviders?.stripe?.apiKey &&
      website.paymentProviders?.stripe?.apiKey;

    if (paymentProviders?.stripe?.apiKey) {
      const apiKey = paymentProviders.stripe.apiKey.trim();
      if (!apiKey.startsWith("rk_")) {
        return NextResponse.json(
          {
            error:
              "Please use a restricted API key (starts with 'rk_'). Create a restricted API key with Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
          },
          { status: 400 }
        );
      }

      try {
        const stripe = new Stripe(apiKey, {
          apiVersion: "2025-11-17.clover",
        });
        await stripe.balance.retrieve();
        await stripe.customers.list({ limit: 1 });
        await stripe.checkout.sessions.list({ limit: 1 });
      } catch (error: any) {
        if (error.type === "StripeAuthenticationError") {
          return NextResponse.json(
            {
              error:
                "Invalid Stripe API key. Please check your key and try again.",
            },
            { status: 400 }
          );
        }

        const errorCode = error.code || "";
        const errorMessage = (error.message || "").toLowerCase();
        const errorType = error.type || "";
        const statusCode = error.statusCode || 0;

        if (
          errorType === "StripePermissionError" ||
          errorCode === "resource_missing" ||
          errorMessage.includes("permission") ||
          errorMessage.includes("forbidden") ||
          errorMessage.includes("not allowed") ||
          errorMessage.includes("insufficient permissions") ||
          errorCode === "api_key_expired" ||
          statusCode === 403
        ) {
          return NextResponse.json(
            {
              error:
                "Stripe API key doesn't have the required permissions. Please create a restricted API key with Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
            },
            { status: 400 }
          );
        }
        console.error("Stripe validation error:", {
          type: error.type,
          code: error.code,
          message: error.message,
        });

        return NextResponse.json(
          {
            error:
              error.message ||
              "Failed to validate Stripe API key. Please check that your restricted key has Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
          },
          { status: 400 }
        );
      }
    }

    const updatedWebsite = await updateWebsite(websiteId, {
      name,
      domain,
      iconUrl,
      settings,
      paymentProviders,
    });

    // Register/unregister background sync jobs when payment providers change
    try {
      // If Stripe is being removed, unregister sync jobs
      if (isStripeRemoved) {
        await unregisterPaymentProviderSync(websiteId, "stripe");
      }

      if (isNewStripeKey && paymentProviders?.stripe?.apiKey) {
        await registerPaymentProviderSync(websiteId, "stripe");

        // Trigger immediate job processing in the background (fire and forget)
        // This ensures payments start syncing as soon as the key is added
        const getBaseUrl = () => {
          // Use NEXT_PUBLIC_APP_URL if set (production)
          if (process.env.NEXT_PUBLIC_APP_URL) {
            return process.env.NEXT_PUBLIC_APP_URL;
          }
          // Use VERCEL_URL for Vercel deployments
          if (process.env.VERCEL_URL) {
            return `https://${process.env.VERCEL_URL}`;
          }
          // Fallback to localhost for development
          return "http://localhost:3000";
        };

        const baseUrl = getBaseUrl();

        // Process jobs asynchronously - don't wait for response
        fetch(`${baseUrl}/api/jobs/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.CRON_SECRET && {
              Authorization: `Bearer ${process.env.CRON_SECRET}`,
            }),
          },
          body: JSON.stringify({ batchSize: 5, maxConcurrent: 2 }),
        }).catch((err) => {
          // Silently fail - this is a background operation
          console.error("Failed to trigger immediate job processing:", err);
        });
      }
    } catch (error) {
      // Log but don't fail the request - job registration is non-critical
      console.error(
        `Error registering/unregistering sync jobs for website ${websiteId}:`,
        error
      );
    }

    const sanitizedWebsite = sanitizeWebsiteForFrontend(updatedWebsite);

    return NextResponse.json({ website: sanitizedWebsite }, { status: 200 });
  } catch (error) {
    console.error("Error updating website:", error);
    return NextResponse.json(
      { error: "Failed to update website" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    if (!isValidObjectId(websiteId)) {
      return NextResponse.json(
        { error: "Invalid website ID" },
        { status: 400 }
      );
    }

    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const website = await getWebsiteById(websiteId);
    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (website.userId.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await deleteWebsite(websiteId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting website:", error);
    return NextResponse.json(
      { error: "Failed to delete website" },
      { status: 500 }
    );
  }
}
