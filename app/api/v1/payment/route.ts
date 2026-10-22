import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/utils/api/auth";
import { createPayment, type NewPayment } from "@/utils/database/payment";
import { stripePaymentIntentForInvoice } from "@/utils/integrations/stripe";
import connectDB from "@/db";
import Payment from "@/db/models/Payment";

const KNOWN_PROVIDERS = new Set([
  "stripe",
  "lemonsqueezy",
  "polar",
  "paddle",
  "other",
]);

/**
 * POST /api/v1/payment
 * Record a payment using API key authentication
 * Based on Postmetric API: https://postmetric.io/docs/api-introduction
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate using API key
    const auth = await authenticateApiRequest(request);

    if (!auth) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: 401,
            message: "Unauthorized. Invalid or missing API key.",
          },
        },
        { status: 401 },
      );
    }

    const { websiteId } = auth;
    const body = await request.json();

    // Field names follow PostMetric's docs, with DataFast's accepted as
    // aliases so a site can switch by changing only the URL and key.
    const pick = (...keys: string[]) => {
      for (const key of keys) {
        const value = body?.[key];
        if (value !== undefined && value !== null && value !== "") return value;
      }
      return undefined;
    };
    const provider = String(pick("provider") ?? "other");
    let providerPaymentId = pick("providerPaymentId", "transaction_id");
    const amount = Number(pick("amount"));
    const currency = String(pick("currency") ?? "USD").toUpperCase();
    const visitorId = pick("visitorId", "postmetric_visitor_id", "datafast_visitor_id");
    const sessionId = pick("sessionId", "postmetric_session_id", "datafast_session_id");
    const customerEmail = pick("customerEmail", "customer_email", "email");
    const customerId = pick("customerId", "customer_id");
    const timestamp = pick("timestamp");

    if (!providerPaymentId || !Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        {
          status: "error",
          error: {
            code: 400,
            message: "providerPaymentId (or transaction_id) and amount are required",
          },
        },
        { status: 400 },
      );
    }

    if (!KNOWN_PROVIDERS.has(provider)) {
      return NextResponse.json(
        {
          status: "error",
          error: { code: 400, message: `Unknown provider "${provider}"` },
        },
        { status: 400 },
      );
    }

    await connectDB();

    // With Stripe connected, the sync stores payments by PaymentIntent id.
    // Store an invoice reported here under the same id so it isn't counted
    // twice.
    if (provider === "stripe" && String(providerPaymentId).startsWith("in_")) {
      providerPaymentId =
        (await stripePaymentIntentForInvoice(websiteId, String(providerPaymentId))) ??
        providerPaymentId;
    }

    const existing = await Payment.findOne({
      provider,
      providerPaymentId: String(providerPaymentId),
    });

    const payment = await createPayment({
      websiteId,
      provider: provider as NewPayment["provider"],
      providerPaymentId: String(providerPaymentId),
      amount: Math.round(amount * 100),
      currency,
      renewal: Boolean(pick("renewal")),
      refunded: Boolean(pick("refunded")),
      customerEmail: customerEmail ? String(customerEmail) : undefined,
      customerId: customerId ? String(customerId) : undefined,
      visitorId: visitorId ? String(visitorId) : undefined,
      sessionId: sessionId ? String(sessionId) : undefined,
      metadata: typeof body?.metadata === "object" ? body.metadata : undefined,
      timestamp: timestamp ? new Date(String(timestamp)) : undefined,
    });

    return NextResponse.json({
      status: "success",
      data: {
        paymentId: payment._id.toString(),
        transaction_id: String(providerPaymentId),
        attributed: Boolean(payment.visitorId),
        message: existing ? "Payment already recorded" : "Payment recorded successfully",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: {
          code: 500,
          message: error.message || "Internal server error",
        },
      },
      { status: 500 },
    );
  }
}
