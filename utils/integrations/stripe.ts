import Stripe from "stripe";
import connectDB from "@/db";
import Payment from "@/db/models/Payment";
import {
  createPayment,
  deletePaymentsByProvider,
  type NewPayment,
} from "@/utils/database/payment";
import { Types } from "mongoose";
import Website, { type IWebsite } from "@/db/models/Website";

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: number;
}

export interface StripeConfigResult {
  error?: string;
  statusCode?: number;
}

export interface StripeChangeDetection {
  isNewStripeKey: boolean;
  isStripeRemoved: boolean;
}

export abstract class PaymentProviderSyncer {
  abstract syncPayments(
    startDate: Date,
    endDate: Date,
    websiteId: string,
  ): Promise<SyncResult>;

  abstract deletePayments(websiteId: string): Promise<void>;

  validatePaymentProviderKey?(apiKey: string): Promise<StripeConfigResult>;
}

export class StripeHelper {
  private stripe: Stripe;
  private apiKey: string;
  private readonly baseUrl = "https://api.stripe.com/v1/payment_intents";
  private readonly RATE_LIMIT_DELAY_MS = 100;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2025-11-17.clover",
    });
  }

  async fetchAllPaymentIntents(
    startDate: Date,
    endDate: Date,
  ): Promise<Stripe.PaymentIntent[]> {
    const paymentIntents: Stripe.PaymentIntent[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    let requestCount = 0;

    while (hasMore) {
      if (requestCount > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.RATE_LIMIT_DELAY_MS),
        );
      }

      const params = new URLSearchParams();
      params.append("limit", "100");

      if (startingAfter) {
        params.append("starting_after", startingAfter);
      }

      params.append(
        "created[gte]",
        Math.floor(startDate.getTime() / 1000).toString(),
      );
      params.append(
        "created[lte]",
        Math.floor(endDate.getTime() / 1000).toString(),
      );

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString(
            "base64",
          )}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Stripe API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      paymentIntents.push(...(data.data as Stripe.PaymentIntent[]));
      hasMore = data.has_more;
      if (data.data.length > 0) {
        startingAfter = data.data[data.data.length - 1].id;
      }

      requestCount++;
    }

    return paymentIntents;
  }

  /**
   * PaymentIntents lost their `invoice` field in API 2025-03-31.basil; the
   * link now lives on InvoicePayment.
   */
  async findInvoiceForPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.Invoice | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const { data } = await this.stripe.invoicePayments.list({
      payment: { type: "payment_intent", payment_intent: paymentIntentId },
      expand: ["data.invoice"],
      limit: 1,
    });
    const invoice = data[0]?.invoice;
    return invoice && typeof invoice === "object" ? (invoice as Stripe.Invoice) : null;
  }

  /**
   * The Checkout Session behind a payment, which is where checkout code puts
   * the visitor ids. A subscription's first invoice is found through the
   * subscription; one-time payments through their PaymentIntent.
   */
  async findCheckoutSession(
    paymentIntentId: string,
    subscriptionId: string | null,
  ): Promise<Stripe.Checkout.Session | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const byIntent = await this.stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });
    if (byIntent.data[0]) return byIntent.data[0];
    if (!subscriptionId) return null;
    const bySubscription = await this.stripe.checkout.sessions.list({
      subscription: subscriptionId,
      limit: 1,
    });
    return bySubscription.data[0] ?? null;
  }

  async retrieveCheckoutSession(
    checkoutSessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    return await this.stripe.checkout.sessions.retrieve(checkoutSessionId);
  }

  async retrieveInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return await this.stripe.invoices.retrieve(invoiceId, {
      expand: ["subscription"],
    });
  }

  async retrieveCharge(chargeId: string): Promise<Stripe.Charge> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return await this.stripe.charges.retrieve(chargeId, {
      expand: ["customer"],
    });
  }

  async listInvoicePayments(invoiceId: string) {
    const { data } = await this.stripe.invoicePayments.list({
      invoice: invoiceId,
      limit: 10,
    });
    return data;
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async fetchAllRefunds(
    startDate: Date,
    endDate: Date,
  ): Promise<Stripe.Refund[]> {
    const refunds: Stripe.Refund[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    let requestCount = 0;

    while (hasMore) {
      if (requestCount > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.RATE_LIMIT_DELAY_MS),
        );
      }

      const params: Stripe.RefundListParams = {
        limit: 100,
      };

      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      params.created = {};
      params.created.gte = Math.floor(startDate.getTime() / 1000);
      params.created.lte = Math.floor(endDate.getTime() / 1000);

      try {
        const response = await this.stripe.refunds.list(params);

        refunds.push(...response.data);
        hasMore = response.has_more;
        if (response.data.length > 0) {
          startingAfter = response.data[response.data.length - 1].id;
        }
        requestCount++;
      } catch (error: any) {
        if (error.type === "StripeRateLimitError") {
          const retryAfter = error.headers?.["retry-after"] || "2";
          const waitTime = parseInt(retryAfter) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }

    return refunds;
  }
}

export class StripePaymentSyncer extends PaymentProviderSyncer {
  private helper: StripeHelper;

  constructor(apiKey: string) {
    super();
    this.helper = new StripeHelper(apiKey);
  }

  async syncPayments(
    startDate: Date,
    endDate: Date,
    websiteId: string,
  ): Promise<SyncResult> {
    await connectDB();

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const paymentResult = await this.syncPaymentIntents(
        startDate,
        endDate,
        websiteId,
      );
      synced += paymentResult.synced;
      skipped += paymentResult.skipped;
      errors += paymentResult.errors;

      const refundResult = await this.syncRefunds(
        startDate,
        endDate,
        websiteId,
      );
      synced += refundResult.synced;
      skipped += refundResult.skipped;
      errors += refundResult.errors;

      return { synced, skipped, errors };
    } catch (error) {
      throw error;
    }
  }

  async deletePayments(websiteId: string): Promise<void> {
    await deletePaymentsByProvider(websiteId, "stripe");
  }

  async validatePaymentProviderKey(
    apiKey: string,
  ): Promise<StripeConfigResult> {
    return await validateStripeApiKey(apiKey);
  }

  private async syncPaymentIntents(
    startDate: Date,
    endDate: Date,
    websiteId: string,
  ): Promise<SyncResult> {
    let paymentSynced = 0;
    let paymentSkipped = 0;
    let paymentErrors = 0;

    try {
      const paymentIntents = await this.helper.fetchAllPaymentIntents(
        startDate,
        endDate,
      );
      for (const paymentIntent of paymentIntents) {
        try {
          if (paymentIntent.status !== "succeeded") {
            paymentSkipped++;
            continue;
          }

          const result = await this.savePaymentIntentToDatabase(
            paymentIntent,
            websiteId,
          );
          if (result === "synced") {
            paymentSynced++;
          } else if (result === "skipped") {
            paymentSkipped++;
          } else {
            paymentErrors++;
          }
        } catch (error) {
          paymentErrors++;
        }
      }

      return {
        synced: paymentSynced,
        skipped: paymentSkipped,
        errors: paymentErrors,
      };
    } catch (error) {
      throw error;
    }
  }

  private async syncRefunds(
    startDate: Date,
    endDate: Date,
    websiteId: string,
  ): Promise<SyncResult> {
    let refundSynced = 0;
    let refundSkipped = 0;
    let refundErrors = 0;

    try {
      const refunds = await this.helper.fetchAllRefunds(startDate, endDate);
      for (const refund of refunds) {
        try {
          if (refund.status !== "succeeded") {
            refundSkipped++;
            continue;
          }

          const result = await this.saveRefundToDatabase(refund, websiteId);
          if (result === "synced") {
            refundSynced++;
          } else if (result === "skipped") {
            refundSkipped++;
          } else {
            refundErrors++;
          }
        } catch (error) {
          refundErrors++;
        }
      }

      return {
        synced: refundSynced,
        skipped: refundSkipped,
        errors: refundErrors,
      };
    } catch (error) {
      throw error;
    }
  }

  private async savePaymentIntentToDatabase(
    paymentIntent: Stripe.PaymentIntent,
    websiteId: string,
  ): Promise<"synced" | "skipped" | "error"> {
    const existingPayment = await Payment.findOne({
      websiteId: new Types.ObjectId(websiteId),
      provider: "stripe",
      providerPaymentId: paymentIntent.id,
    });

    // Attributed payments are settled; unattributed ones are looked at again
    // in case the browser has since reported their checkout or email.
    if (existingPayment?.visitorId) {
      return "skipped";
    }

    try {
      await createPayment(
        await this.describePaymentIntent(paymentIntent, websiteId),
      );
      return existingPayment ? "skipped" : "synced";
    } catch (error) {
      return "error";
    }
  }

  async describePaymentIntent(
    paymentIntent: Stripe.PaymentIntent,
    websiteId: string,
  ): Promise<NewPayment> {
    const invoice = await this.helper
      .findInvoiceForPaymentIntent(paymentIntent.id)
      .catch(() => null);
    const subscriptionDetails = invoice?.parent?.subscription_details;
    const subscriptionId = subscriptionDetails?.subscription
      ? typeof subscriptionDetails.subscription === "string"
        ? subscriptionDetails.subscription
        : subscriptionDetails.subscription.id
      : null;

    // Renewals inherit attribution from the customer's first payment, so the
    // Checkout Session is only needed for first payments.
    const checkoutSession =
      invoice?.billing_reason === "subscription_cycle"
        ? null
        : await this.helper
            .findCheckoutSession(paymentIntent.id, subscriptionId)
            .catch(() => null);

    let paymentType: "new" | "renewal" | "one-time" = "one-time";
    if (invoice?.billing_reason === "subscription_cycle") {
      paymentType = "renewal";
    } else if (invoice?.billing_reason === "subscription_create") {
      paymentType = "new";
    }

    const idOf = (value: string | { id: string } | null | undefined) =>
      typeof value === "string" ? value : (value?.id ?? undefined);

    return {
      websiteId,
      provider: "stripe",
      providerPaymentId: paymentIntent.id,
      amount: paymentIntent.amount_received || paymentIntent.amount,
      currency: paymentIntent.currency,
      renewal: paymentType === "renewal",
      refunded: false,
      customerEmail:
        paymentIntent.receipt_email ||
        invoice?.customer_email ||
        checkoutSession?.customer_details?.email ||
        undefined,
      customerId:
        idOf(paymentIntent.customer) ||
        idOf(invoice?.customer) ||
        idOf(checkoutSession?.customer),
      checkoutSessionId: checkoutSession?.id,
      // Later spreads win: the PaymentIntent's own metadata beats the
      // subscription's, which beats the Checkout Session's.
      metadata: {
        ...checkoutSession?.metadata,
        ...subscriptionDetails?.metadata,
        ...paymentIntent.metadata,
        paymentType,
        billingReason: invoice?.billing_reason || null,
        invoiceId: invoice?.id || null,
        subscriptionId,
        checkoutSessionId: checkoutSession?.id || null,
      },
      timestamp: new Date(paymentIntent.created * 1000),
    };
  }

  /**
   * A browser reported `?session_id=cs_...` from a success page. Record the
   * payment now instead of waiting for the next sync.
   */
  async recordCheckoutSession(
    checkoutSessionId: string,
    websiteId: string,
  ): Promise<void> {
    const session = await this.helper.retrieveCheckoutSession(checkoutSessionId);
    if (session.payment_status !== "paid") return;

    let paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId && session.invoice) {
      const invoiceId =
        typeof session.invoice === "string" ? session.invoice : session.invoice.id;
      const payments = await this.helper.listInvoicePayments(invoiceId);
      paymentIntentId = payments.find((p) => p.payment.payment_intent)?.payment
        .payment_intent as string | undefined;
    }
    if (!paymentIntentId) return;

    const paymentIntent = await this.helper.retrievePaymentIntent(paymentIntentId);
    if (paymentIntent.status !== "succeeded") return;
    await createPayment(await this.describePaymentIntent(paymentIntent, websiteId));
  }

  private async saveRefundToDatabase(
    refund: Stripe.Refund,
    websiteId: string,
  ): Promise<"synced" | "skipped" | "error"> {
    const websiteObjectId = new Types.ObjectId(websiteId);

    const existingPayment = await Payment.findOne({
      websiteId: websiteObjectId,
      provider: "stripe",
      providerPaymentId: refund.id,
    });

    if (existingPayment) {
      return "skipped";
    }

    let customerEmail: string | undefined;
    let customerId: string | undefined;
    let metadata: Record<string, any> = {
      refundId: refund.id,
      refundReason: refund.reason,
      receiptNumber: refund.receipt_number,
    };

    if (refund.charge) {
      try {
        const charge = await this.helper.retrieveCharge(
          refund.charge as string,
        );
        if (charge.billing_details?.email) {
          customerEmail = charge.billing_details.email;
        }
        if (charge.customer) {
          customerId =
            typeof charge.customer === "string"
              ? charge.customer
              : charge.customer.id;
        }
        if (charge.metadata) {
          metadata = { ...metadata, ...charge.metadata };
        }
      } catch (chargeError) {}
    }

    if (!customerEmail && refund.payment_intent) {
      try {
        const paymentIntent = await this.helper.retrievePaymentIntent(
          refund.payment_intent as string,
        );
        if (paymentIntent.receipt_email) {
          customerEmail = paymentIntent.receipt_email;
        }
        if (paymentIntent.customer) {
          customerId =
            typeof paymentIntent.customer === "string"
              ? paymentIntent.customer
              : paymentIntent.customer.id;
        }
        if (paymentIntent.metadata) {
          metadata = { ...metadata, ...paymentIntent.metadata };
        }
      } catch (piError) {}
    }

    try {
      await createPayment({
        websiteId,
        provider: "stripe",
        providerPaymentId: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        renewal: false,
        refunded: true,
        customerEmail,
        customerId,
        metadata,
        timestamp: new Date(refund.created * 1000),
      });
      return "synced";
    } catch (error) {
      return "error";
    }
  }
}

export async function syncStripePayments(
  websiteId: string,
  apiKey: string,
  startDate?: Date,
  endDate?: Date,
): Promise<{ synced: number; skipped: number; errors: number }> {
  const syncer = new StripePaymentSyncer(apiKey);
  const start =
    startDate || new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();
  const result = await syncer.syncPayments(start, end, websiteId);
  return result;
}

export async function recordStripeCheckoutSession(
  websiteId: string,
  apiKey: string,
  checkoutSessionId: string,
): Promise<void> {
  await connectDB();
  const syncer = new StripePaymentSyncer(apiKey);
  await syncer.recordCheckoutSession(checkoutSessionId, websiteId);
}

/** The PaymentIntent that paid a Stripe invoice, when Stripe is connected. */
export async function stripePaymentIntentForInvoice(
  websiteId: string,
  invoiceId: string,
): Promise<string | null> {
  const website = await Website.findById(websiteId);
  const apiKey = website?.paymentProviders?.stripe?.apiKey;
  if (!apiKey) return null;
  try {
    const payments = await new StripeHelper(apiKey).listInvoicePayments(invoiceId);
    const paid = payments.find((p) => p.payment.payment_intent);
    const intent = paid?.payment.payment_intent;
    return typeof intent === "string" ? intent : (intent?.id ?? null);
  } catch {
    return null;
  }
}

export function detectStripeChanges(
  currentWebsite: IWebsite,
  newPaymentProviders?: IWebsite["paymentProviders"],
): StripeChangeDetection {
  const currentApiKey = currentWebsite.paymentProviders?.stripe?.apiKey;
  const newApiKey = newPaymentProviders?.stripe?.apiKey;

  const isNewStripeKey = !!newApiKey && currentApiKey !== newApiKey;
  const isStripeRemoved = !newApiKey && !!currentApiKey;
  return {
    isNewStripeKey,
    isStripeRemoved,
  };
}

export async function validateStripeApiKey(
  apiKey: string,
): Promise<StripeConfigResult> {
  const trimmedKey = apiKey.trim();

  if (!trimmedKey.startsWith("rk_")) {
    return {
      error:
        "Please use a restricted API key (starts with 'rk_'). Create a restricted API key with Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
      statusCode: 400,
    };
  }

  try {
    const stripe = new Stripe(trimmedKey, {
      apiVersion: "2025-11-17.clover",
    });

    await stripe.balance.retrieve();
    await stripe.customers.list({ limit: 1 });
    await stripe.checkout.sessions.list({ limit: 1 });
  } catch (error: any) {
    if (error.type === "StripeAuthenticationError") {
      return {
        error: "Invalid Stripe API key. Please check your key and try again.",
        statusCode: 400,
      };
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
      return {
        error:
          "Stripe API key doesn't have the required permissions. Please create a restricted API key with Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
        statusCode: 400,
      };
    }
    return {
      error:
        error.message ||
        "Failed to validate Stripe API key. Please check that your restricted key has Core (Read), Billing (Read), Checkout (Read), and Webhook (Write) permissions.",
      statusCode: 400,
    };
  }

  return {};
}

export function initializeStripeSyncConfig(
  paymentProviders?: IWebsite["paymentProviders"],
): void {
  if (paymentProviders?.stripe?.apiKey && !paymentProviders.stripe.syncConfig) {
    paymentProviders.stripe.syncConfig = {
      enabled: true,
      frequency: "realtime",
    };
  }
}

export async function handleStripeRemoval(websiteId: string): Promise<void> {
  await deletePaymentsByProvider(websiteId, "stripe");
}

export async function handleStripeAddition(
  websiteId: string,
  apiKey: string,
  stripeConfig?: NonNullable<IWebsite["paymentProviders"]>["stripe"],
): Promise<void> {
  // Stripe addition is now handled by the sync-payment cron endpoint
  // No job registration or processing needed
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function processStripeConfigChanges(
  websiteId: string,
  currentWebsite: IWebsite,
  newPaymentProviders?: IWebsite["paymentProviders"],
): Promise<StripeConfigResult> {
  const changes = detectStripeChanges(currentWebsite, newPaymentProviders);

  if (newPaymentProviders?.stripe?.apiKey) {
    const validation = await validateStripeApiKey(
      newPaymentProviders.stripe.apiKey,
    );
    if (validation.error) {
      return validation;
    }
  }

  if (changes.isNewStripeKey && newPaymentProviders?.stripe?.apiKey) {
    initializeStripeSyncConfig(newPaymentProviders);
  }

  try {
    if (changes.isStripeRemoved) {
      await handleStripeRemoval(websiteId);
    }

    if (changes.isNewStripeKey && newPaymentProviders?.stripe?.apiKey) {
      await handleStripeAddition(
        websiteId,
        newPaymentProviders.stripe.apiKey,
        newPaymentProviders.stripe,
      );
    }
  } catch (error) {}

  return {};
}
