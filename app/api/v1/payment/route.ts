import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/utils/api/auth";
import {
  createPayment,
  paymentKey,
  type NewPayment,
} from "@/utils/database/payment";
import { mapApiPaymentToStripe } from "@/utils/integrations/stripe";
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
    let provider = String(pick("provider") ?? "other");
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
    // A Stripe id reported here (pi_/ch_/in_/cs_, whatever `provider` says)
    // is stored under the same key so it is never counted twice.
    const mapped = await mapApiPaymentToStripe(
      websiteId,
      provider,
      String(providerPaymentId),
    );
    provider = mapped.provider;
    providerPaymentId = mapped.providerPaymentId;
    const refunded = Boolean(pick("refunded"));

    // Stripe refunds arrive through the sync as their own re_ records.
    if (mapped.stripeConnected && provider === "stripe" && refunded) {
      return NextResponse.json({
        status: "success",
        data: {
          paymentId: null,
          transaction_id: String(providerPaymentId),
          attributed: false,
          message: "Stripe refunds are recorded by the Stripe sync",
        },
      });
    }

    // A refund is its own record (subtracted from revenue), so one reported
    // under the sale's id must not overwrite the sale.
    const storedId = refunded
      ? `${providerPaymentId}:refund`
      : String(providerPaymentId);

    const existing = await Payment.findOne(
      paymentKey(websiteId, provider, storedId),
    );

    // A refund counts against the visitor of the sale it refunds.
    const sale = refunded
      ? await Payment.findOne(
          paymentKey(websiteId, provider, String(providerPaymentId)),
        )
      : null;
    const visitor = visitorId
      ? { visitorId: String(visitorId), sessionId: sessionId ? String(sessionId) : undefined }
      : sale?.visitorId
        ? { visitorId: sale.visitorId, sessionId: sale.sessionId }
        : { visitorId: undefined, sessionId: sessionId ? String(sessionId) : undefined };

    const payment = await createPayment({
      websiteId,
      provider: provider as NewPayment["provider"],
      providerPaymentId: storedId,
      // Major units in, stored ×100 (see Payment.amount).
      amount: Math.round(amount * 100),
      currency,
      renewal: Boolean(pick("renewal")),
      refunded,
      customerEmail: customerEmail ? String(customerEmail) : undefined,
      customerId: customerId ? String(customerId) : undefined,
      visitorId: visitor.visitorId,
      sessionId: visitor.sessionId,
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
