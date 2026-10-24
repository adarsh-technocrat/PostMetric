import Stripe from "stripe";
import connectDB from "@/db";
import Payment from "@/db/models/Payment";
import {
  createPayment,
  deletePaymentsByProvider,
  paymentKey,
  type NewPayment,
} from "@/utils/database/payment";
import { getSiteCurrency } from "@/utils/analytics/revenueAmount";
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
    deadline?: number,
  ): Promise<SyncResult>;

  abstract deletePayments(websiteId: string): Promise<void>;

  validatePaymentProviderKey?(apiKey: string): Promise<StripeConfigResult>;
}

/**
 * Currencies Stripe expresses without minor units
 * (https://docs.stripe.com/currencies#zero-decimal). Payment.amount is always
 * "major units ×100", so these are multiplied by 100 when stored.
 */
export const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

/** A Stripe amount in the stored representation (major units ×100). */
export function toStoredAmount(stripeAmount: number, currency: string): number {
  const amount = Math.abs(stripeAmount || 0);
  return ZERO_DECIMAL_CURRENCIES.has((currency || "").toLowerCase())
    ? Math.round(amount * 100)
    : Math.round(amount);
}

/** How far back a newly connected account's history is imported. */
const BACKFILL_HISTORY_MS = 3 * 365 * 24 * 60 * 60 * 1000;
/** Fallback window when the key can't read Events. */
const FALLBACK_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
/** Events are re-read this far behind the cursor in case Stripe lags. */
const EVENT_OVERLAP_MS = 10 * 60 * 1000;
/** Small pages keep backfill progress fine-grained (each item can cost ~3 calls). */
const BACKFILL_PAGE_SIZE = 25;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRateLimit(error: any) {
  return error?.type === "StripeRateLimitError" || error?.statusCode === 429;
}

export function isStripeAuthError(error: any) {
  return (
    error?.type === "StripeAuthenticationError" || error?.statusCode === 401
  );
}

export function isStripePermissionError(error: any) {
  return error?.type === "StripePermissionError" || error?.statusCode === 403;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (!isRateLimit(error) || i >= attempts - 1) throw error;
      const retryAfter = Number(error?.headers?.["retry-after"]);
      await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 2000);
    }
  }
}

type Page<T> = { data: T[]; has_more: boolean };

/** The Stripe calls the sync needs; tests substitute a fake. */
export interface StripeApi {
  listPaymentIntentsPage(params: {
    createdGte?: number;
    createdLte?: number;
    startingAfter?: string;
    limit?: number;
  }): Promise<Page<Stripe.PaymentIntent>>;
  listRefundsPage(params: {
    createdGte?: number;
    createdLte?: number;
    startingAfter?: string;
    limit?: number;
  }): Promise<Page<Stripe.Refund>>;
  listEvents(params: {
    types: string[];
    createdGte: number;
    startingAfter?: string;
  }): Promise<Page<Stripe.Event>>;
  listRefundsForCharge(chargeId: string): Promise<Stripe.Refund[]>;
  findInvoiceForPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.Invoice | null>;
  findCheckoutSession(
    paymentIntentId: string,
    subscriptionId: string | null,
  ): Promise<Stripe.Checkout.Session | null>;
  retrieveCheckoutSession(id: string): Promise<Stripe.Checkout.Session>;
  retrieveCharge(chargeId: string): Promise<Stripe.Charge>;
  retrieveChargeWithBalance(chargeId: string): Promise<Stripe.Charge>;
  retrieveBalanceTransaction(id: string): Promise<Stripe.BalanceTransaction>;
  listInvoicePayments(invoiceId: string): Promise<Stripe.InvoicePayment[]>;
  retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent>;
}

export class StripeHelper implements StripeApi {
  private stripe: Stripe;
  private readonly RATE_LIMIT_DELAY_MS = 100;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2025-11-17.clover",
    });
  }

  async listPaymentIntentsPage(params: {
    createdGte?: number;
    createdLte?: number;
    startingAfter?: string;
    limit?: number;
  }): Promise<Page<Stripe.PaymentIntent>> {
    return withRetry(() =>
      this.stripe.paymentIntents.list({
        limit: params.limit ?? 100,
        created: { gte: params.createdGte, lte: params.createdLte },
        ...(params.startingAfter && { starting_after: params.startingAfter }),
      }),
    );
  }

  async listRefundsPage(params: {
    createdGte?: number;
    createdLte?: number;
    startingAfter?: string;
    limit?: number;
  }): Promise<Page<Stripe.Refund>> {
    return withRetry(() =>
      this.stripe.refunds.list({
        limit: params.limit ?? 100,
        created: { gte: params.createdGte, lte: params.createdLte },
        ...(params.startingAfter && { starting_after: params.startingAfter }),
      }),
    );
  }

  async listEvents(params: {
    types: string[];
    createdGte: number;
    startingAfter?: string;
  }): Promise<Page<Stripe.Event>> {
    return withRetry(() =>
      this.stripe.events.list({
        types: params.types,
        created: { gte: params.createdGte },
        limit: 100,
        ...(params.startingAfter && { starting_after: params.startingAfter }),
      }),
    );
  }

  async listRefundsForCharge(chargeId: string): Promise<Stripe.Refund[]> {
    const { data } = await withRetry(() =>
      this.stripe.refunds.list({ charge: chargeId, limit: 100 }),
    );
    return data;
  }

  /**
   * PaymentIntents lost their `invoice` field in API 2025-03-31.basil; the
   * link now lives on InvoicePayment.
   */
  async findInvoiceForPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.Invoice | null> {
    await sleep(this.RATE_LIMIT_DELAY_MS);
    const { data } = await withRetry(() =>
      this.stripe.invoicePayments.list({
        payment: { type: "payment_intent", payment_intent: paymentIntentId },
        expand: ["data.invoice"],
        limit: 1,
      }),
    );
    const invoice = data[0]?.invoice;
    return invoice && typeof invoice === "object"
      ? (invoice as Stripe.Invoice)
      : null;
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
    await sleep(this.RATE_LIMIT_DELAY_MS);
    const byIntent = await withRetry(() =>
      this.stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      }),
    );
    if (byIntent.data[0]) return byIntent.data[0];
    if (!subscriptionId) return null;
    const bySubscription = await withRetry(() =>
      this.stripe.checkout.sessions.list({
        subscription: subscriptionId,
        limit: 1,
      }),
    );
    return bySubscription.data[0] ?? null;
  }

  async retrieveCheckoutSession(
    checkoutSessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    return await withRetry(() =>
      this.stripe.checkout.sessions.retrieve(checkoutSessionId),
    );
  }

  async retrieveInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    await sleep(this.RATE_LIMIT_DELAY_MS);
    return await withRetry(() =>
      this.stripe.invoices.retrieve(invoiceId, {
        expand: ["subscription"],
      }),
    );
  }

  async retrieveCharge(chargeId: string): Promise<Stripe.Charge> {
    await sleep(this.RATE_LIMIT_DELAY_MS);
    return await withRetry(() =>
      this.stripe.charges.retrieve(chargeId, {
        expand: ["customer"],
      }),
    );
  }

  async retrieveChargeWithBalance(chargeId: string): Promise<Stripe.Charge> {
    await sleep(this.RATE_LIMIT_DELAY_MS);
    return await withRetry(() =>
      this.stripe.charges.retrieve(chargeId, {
        expand: ["balance_transaction"],
      }),
    );
  }

  async retrieveBalanceTransaction(
    id: string,
  ): Promise<Stripe.BalanceTransaction> {
    await sleep(this.RATE_LIMIT_DELAY_MS);
    return await withRetry(() => this.stripe.balanceTransactions.retrieve(id));
  }

  async listInvoicePayments(invoiceId: string) {
    const { data } = await withRetry(() =>
      this.stripe.invoicePayments.list({
        invoice: invoiceId,
        limit: 10,
      }),
    );
    return data;
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    await sleep(this.RATE_LIMIT_DELAY_MS);
    return await withRetry(() =>
      this.stripe.paymentIntents.retrieve(paymentIntentId),
    );
  }

  async fetchAllPaymentIntents(
    startDate: Date,
    endDate: Date,
    deadline?: number,
  ): Promise<Stripe.PaymentIntent[]> {
    return collectPages(
      (startingAfter) =>
        this.listPaymentIntentsPage({
          createdGte: Math.floor(startDate.getTime() / 1000),
          createdLte: Math.floor(endDate.getTime() / 1000),
          startingAfter,
        }),
      deadline,
    );
  }

  async fetchAllRefunds(
    startDate: Date,
    endDate: Date,
    deadline?: number,
  ): Promise<Stripe.Refund[]> {
    return collectPages(
      (startingAfter) =>
        this.listRefundsPage({
          createdGte: Math.floor(startDate.getTime() / 1000),
          createdLte: Math.floor(endDate.getTime() / 1000),
          startingAfter,
        }),
      deadline,
    );
  }
}

async function collectPages<T extends { id: string }>(
  fetchPage: (startingAfter?: string) => Promise<Page<T>>,
  deadline?: number,
): Promise<T[]> {
  const items: T[] = [];
  let startingAfter: string | undefined;
  for (;;) {
    const page = await fetchPage(startingAfter);
    items.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    if (deadline && Date.now() > deadline) break;
    startingAfter = page.data[page.data.length - 1].id;
    await sleep(100);
  }
  return items;
}

type SaveOutcome = "synced" | "skipped" | "error";

function tally(result: SyncResult, outcome: SaveOutcome) {
  if (outcome === "synced") result.synced++;
  else if (outcome === "skipped") result.skipped++;
  else result.errors++;
}

const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : (value?.id ?? undefined);

export class StripePaymentSyncer extends PaymentProviderSyncer {
  private helper: StripeApi;
  private siteCurrency?: string;

  constructor(apiKey: string, helper?: StripeApi) {
    super();
    this.helper = helper ?? new StripeHelper(apiKey);
  }

  private async currencyOf(websiteId: string): Promise<string> {
    if (!this.siteCurrency) {
      this.siteCurrency = await getSiteCurrency(websiteId);
    }
    return this.siteCurrency;
  }

  /** Window sync: every PaymentIntent and refund *created* in the range. */
  async syncPayments(
    startDate: Date,
    endDate: Date,
    websiteId: string,
    deadline?: number,
  ): Promise<SyncResult> {
    await connectDB();
    const result: SyncResult = { synced: 0, skipped: 0, errors: 0 };

    const paymentIntents = await collectPages(
      (startingAfter) =>
        this.helper.listPaymentIntentsPage({
          createdGte: Math.floor(startDate.getTime() / 1000),
          createdLte: Math.floor(endDate.getTime() / 1000),
          startingAfter,
        }),
      deadline,
    );
    for (const paymentIntent of paymentIntents) {
      if (deadline && Date.now() > deadline) break;
      tally(result, await this.processPaymentIntent(paymentIntent, websiteId));
    }

    const refunds = await collectPages(
      (startingAfter) =>
        this.helper.listRefundsPage({
          createdGte: Math.floor(startDate.getTime() / 1000),
          createdLte: Math.floor(endDate.getTime() / 1000),
          startingAfter,
        }),
      deadline,
    );
    for (const refund of refunds) {
      if (deadline && Date.now() > deadline) break;
      tally(result, await this.processRefund(refund, websiteId));
    }

    return result;
  }

  /**
   * Incremental sync from Stripe Events: a payment is picked up when it
   * *succeeds*, however long after its PaymentIntent was created. Events are
   * processed oldest first and the cursor only moves past processed ones, so
   * a run cut short by the deadline resumes where it stopped.
   */
  async syncFromEvents(
    websiteId: string,
    since: Date,
    deadline: number,
    onProgress?: (lastEventAt: Date) => Promise<void>,
  ): Promise<SyncResult & { lastEventAt?: Date; complete: boolean }> {
    await connectDB();
    const result: SyncResult = { synced: 0, skipped: 0, errors: 0 };

    // Stripe lists events newest first.
    const events = await collectPages((startingAfter) =>
      this.helper.listEvents({
        types: ["payment_intent.succeeded", "charge.refunded"],
        createdGte: Math.floor(since.getTime() / 1000),
        startingAfter,
      }),
    );
    events.sort((a, b) => a.created - b.created);

    let lastEventAt: Date | undefined;
    let complete = true;
    for (const event of events) {
      if (Date.now() > deadline) {
        complete = false;
        break;
      }
      try {
        if (event.type === "payment_intent.succeeded") {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          tally(
            result,
            await this.processPaymentIntent(paymentIntent, websiteId),
          );
        } else if (event.type === "charge.refunded") {
          const charge = event.data.object as Stripe.Charge;
          const refunds = await this.helper.listRefundsForCharge(charge.id);
          for (const refund of refunds) {
            tally(result, await this.processRefund(refund, websiteId));
          }
        }
      } catch (error) {
        if (isStripeAuthError(error)) throw error;
        result.errors++;
      }
      const at = new Date(event.created * 1000);
      if (!lastEventAt || at > lastEventAt) {
        lastEventAt = at;
        // Persist every so often so a killed run loses little.
        if (onProgress && result.synced + result.skipped + result.errors > 0) {
          if ((result.synced + result.skipped + result.errors) % 10 === 0) {
            await onProgress(lastEventAt);
          }
        }
      }
    }
    if (lastEventAt && onProgress) await onProgress(lastEventAt);
    return { ...result, lastEventAt, complete };
  }

  /**
   * One budgeted chunk of the history import. `state` is updated in place
   * (cursor, phase, status) and `persist` is called after every page.
   */
  async backfillChunk(
    websiteId: string,
    state: BackfillState,
    deadline: number,
    persist: (state: BackfillState) => Promise<void>,
  ): Promise<SyncResult> {
    await connectDB();
    const result: SyncResult = { synced: 0, skipped: 0, errors: 0 };
    const until = state.until ? new Date(state.until) : new Date();
    state.until = until;
    state.status = "running";
    state.phase = state.phase ?? "payment_intents";
    state.startedAt = state.startedAt ?? new Date();

    const createdGte = Math.floor(
      (until.getTime() - BACKFILL_HISTORY_MS) / 1000,
    );
    const createdLte = Math.floor(until.getTime() / 1000);

    while (Date.now() < deadline) {
      const params = {
        createdGte,
        createdLte,
        startingAfter: state.startingAfter ?? undefined,
        limit: BACKFILL_PAGE_SIZE,
      };
      const page: Page<{ id: string }> =
        state.phase === "payment_intents"
          ? await this.helper.listPaymentIntentsPage(params)
          : await this.helper.listRefundsPage(params);

      let stoppedEarly = false;
      for (const item of page.data) {
        if (Date.now() > deadline) {
          stoppedEarly = true;
          break;
        }
        const outcome =
          state.phase === "payment_intents"
            ? await this.processPaymentIntent(
                item as Stripe.PaymentIntent,
                websiteId,
              )
            : await this.processRefund(item as Stripe.Refund, websiteId);
        tally(result, outcome);
        state.startingAfter = item.id;
      }

      if (!stoppedEarly && (!page.has_more || page.data.length === 0)) {
        if (state.phase === "payment_intents") {
          state.phase = "refunds";
          state.startingAfter = null;
        } else {
          state.status = "done";
          state.finishedAt = new Date();
          state.startingAfter = null;
        }
      }
      state.lastError = null;
      await persist(state);
      if (state.status === "done" || stoppedEarly) break;
    }
    return result;
  }

  async deletePayments(websiteId: string): Promise<void> {
    await deletePaymentsByProvider(websiteId, "stripe");
  }

  async validatePaymentProviderKey(
    apiKey: string,
  ): Promise<StripeConfigResult> {
    return await validateStripeApiKey(apiKey);
  }

  async processPaymentIntent(
    paymentIntent: Stripe.PaymentIntent,
    websiteId: string,
  ): Promise<SaveOutcome> {
    if (paymentIntent.status !== "succeeded") return "skipped";
    try {
      return await this.savePaymentIntentToDatabase(paymentIntent, websiteId);
    } catch (error) {
      if (isStripeAuthError(error)) throw error;
      return "error";
    }
  }

  async processRefund(
    refund: Stripe.Refund,
    websiteId: string,
  ): Promise<SaveOutcome> {
    if (refund.status !== "succeeded") return "skipped";
    try {
      return await this.saveRefundToDatabase(refund, websiteId);
    } catch (error) {
      if (isStripeAuthError(error)) throw error;
      return "error";
    }
  }

  private async savePaymentIntentToDatabase(
    paymentIntent: Stripe.PaymentIntent,
    websiteId: string,
  ): Promise<SaveOutcome> {
    const existingPayment = await Payment.findOne(
      paymentKey(websiteId, "stripe", paymentIntent.id),
    );

    // Attributed payments are settled; unattributed ones are looked at again
    // in case the browser has since reported their checkout or email.
    if (existingPayment?.visitorId) {
      return "skipped";
    }

    await createPayment(
      await this.describePaymentIntent(paymentIntent, websiteId),
    );
    return existingPayment ? "skipped" : "synced";
  }

  /**
   * What the payment settled to on the Stripe balance, normalised like
   * `amount`. Only fetched when the payment's own currency differs from the
   * website's, since that is the only case reports use it.
   */
  private async settlementForCharge(
    chargeId: string | undefined,
    currency: string,
    websiteId: string,
  ): Promise<Pick<NewPayment, "settlementAmount" | "settlementCurrency">> {
    if (!chargeId) return {};
    const siteCurrency = await this.currencyOf(websiteId);
    if (currency.toUpperCase() === siteCurrency) return {};
    try {
      const charge = await this.helper.retrieveChargeWithBalance(chargeId);
      const bt = charge.balance_transaction;
      if (!bt || typeof bt === "string") return {};
      return {
        settlementAmount: toStoredAmount(bt.amount, bt.currency),
        settlementCurrency: bt.currency,
      };
    } catch (error) {
      if (isStripeAuthError(error)) throw error;
      return {};
    }
  }

  private async settlementForRefund(
    refund: Stripe.Refund,
    websiteId: string,
  ): Promise<Pick<NewPayment, "settlementAmount" | "settlementCurrency">> {
    const siteCurrency = await this.currencyOf(websiteId);
    if (refund.currency.toUpperCase() === siteCurrency) return {};
    try {
      const bt =
        typeof refund.balance_transaction === "string"
          ? await this.helper.retrieveBalanceTransaction(
              refund.balance_transaction,
            )
          : refund.balance_transaction;
      if (!bt) return {};
      return {
        settlementAmount: toStoredAmount(bt.amount, bt.currency),
        settlementCurrency: bt.currency,
      };
    } catch (error) {
      if (isStripeAuthError(error)) throw error;
      return {};
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

    const settlement = await this.settlementForCharge(
      idOf(paymentIntent.latest_charge),
      paymentIntent.currency,
      websiteId,
    );

    return {
      websiteId,
      provider: "stripe",
      providerPaymentId: paymentIntent.id,
      amount: toStoredAmount(
        paymentIntent.amount_received || paymentIntent.amount,
        paymentIntent.currency,
      ),
      currency: paymentIntent.currency,
      ...settlement,
      authoritativeAmount: true,
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
    const session =
      await this.helper.retrieveCheckoutSession(checkoutSessionId);
    if (session.payment_status !== "paid") return;
    const paymentIntentId = await paymentIntentForCheckoutSession(
      this.helper,
      session,
    );
    if (!paymentIntentId) return;

    const paymentIntent =
      await this.helper.retrievePaymentIntent(paymentIntentId);
    if (paymentIntent.status !== "succeeded") return;
    await createPayment(
      await this.describePaymentIntent(paymentIntent, websiteId),
    );
  }

  private async saveRefundToDatabase(
    refund: Stripe.Refund,
    websiteId: string,
  ): Promise<SaveOutcome> {
    const existingRefund = await Payment.findOne(
      paymentKey(websiteId, "stripe", refund.id),
    );
    if (existingRefund?.visitorId) {
      return "skipped";
    }

    const paymentIntentId = idOf(refund.payment_intent);
    let customerEmail: string | undefined;
    let customerId: string | undefined;
    let metadata: Record<string, any> = {
      refundId: refund.id,
      refundReason: refund.reason,
      receiptNumber: refund.receipt_number,
      paymentIntentId: paymentIntentId ?? null,
    };

    // A refund belongs to the visitor/session of the payment it refunds, so
    // breakdowns subtract it from the same row.
    const original = paymentIntentId
      ? await Payment.findOne(paymentKey(websiteId, "stripe", paymentIntentId))
      : null;
    if (original) {
      customerEmail = original.customerEmail;
      customerId = original.customerId;
    } else {
      if (refund.charge) {
        try {
          const charge = await this.helper.retrieveCharge(idOf(refund.charge)!);
          customerEmail = charge.billing_details?.email || undefined;
          customerId = idOf(charge.customer as any);
          if (charge.metadata) metadata = { ...metadata, ...charge.metadata };
        } catch (error) {
          if (isStripeAuthError(error)) throw error;
        }
      }
      if (!customerEmail && paymentIntentId) {
        try {
          const paymentIntent =
            await this.helper.retrievePaymentIntent(paymentIntentId);
          customerEmail = paymentIntent.receipt_email || customerEmail;
          customerId = idOf(paymentIntent.customer) || customerId;
          if (paymentIntent.metadata) {
            metadata = { ...metadata, ...paymentIntent.metadata };
          }
        } catch (error) {
          if (isStripeAuthError(error)) throw error;
        }
      }
    }

    await createPayment({
      websiteId,
      provider: "stripe",
      providerPaymentId: refund.id,
      amount: toStoredAmount(refund.amount, refund.currency),
      currency: refund.currency,
      ...(await this.settlementForRefund(refund, websiteId)),
      authoritativeAmount: true,
      renewal: false,
      refunded: true,
      customerEmail,
      customerId,
      metadata,
      ...(original?.visitorId && {
        visitorId: original.visitorId,
        sessionId: original.sessionId,
      }),
      timestamp: new Date(refund.created * 1000),
    });
    return existingRefund ? "skipped" : "synced";
  }
}

export type BackfillState = NonNullable<
  NonNullable<
    NonNullable<
      NonNullable<IWebsite["paymentProviders"]>["stripe"]
    >["syncConfig"]
  >["backfill"]
>;

const SYNC_CONFIG = "paymentProviders.stripe.syncConfig";

async function setSyncConfig(
  websiteId: string,
  fields: Record<string, unknown>,
) {
  const $set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    $set[`${SYNC_CONFIG}.${key}`] = value;
  }
  await Website.updateOne({ _id: new Types.ObjectId(websiteId) }, { $set });
}

function errorMessage(error: any): string {
  return String(error?.message || error || "Unknown error").slice(0, 500);
}

/**
 * Window sync over PaymentIntents/refunds *created* in the range. Used by the
 * manual sync endpoints with an explicit range and as the fallback when the
 * key can't read Events.
 */
export async function syncStripePayments(
  websiteId: string,
  apiKey: string,
  startDate?: Date,
  endDate?: Date,
  options: { deadline?: number; helper?: StripeApi } = {},
): Promise<{ synced: number; skipped: number; errors: number }> {
  const syncer = new StripePaymentSyncer(apiKey, options.helper);
  const end = endDate || new Date();
  const start = startDate || new Date(end.getTime() - FALLBACK_WINDOW_MS);
  return syncer.syncPayments(start, end, websiteId, options.deadline);
}

/** Mark a full history import as pending; the cron works through it. */
export async function startStripeBackfill(websiteId: string): Promise<void> {
  await connectDB();
  const now = new Date();
  await setSyncConfig(websiteId, {
    backfill: {
      status: "pending",
      phase: "payment_intents",
      startingAfter: null,
      until: now,
      startedAt: now,
      lastError: null,
    },
    // Everything created before `until` is the backfill's; everything that
    // succeeds from now on arrives as an Event.
    lastEventAt: now,
    lastError: null,
    authFailedAt: null,
  });
}

export interface StripeSiteSyncResult extends SyncResult {
  websiteId: string;
  mode: "events" | "window" | "skipped";
  backfill?: BackfillState["status"];
  error?: string;
}

/**
 * One budgeted sync run for a website: new activity from Events (or the
 * 3-day window without Events access), then a chunk of any unfinished
 * backfill. Progress, `lastSyncAt` and `lastError` are persisted so a run cut
 * off by the deadline resumes next time and failures are visible.
 */
export async function runStripeSync(
  website: Pick<IWebsite, "_id" | "paymentProviders">,
  options: { deadline: number; helper?: StripeApi; skipIncremental?: boolean },
): Promise<StripeSiteSyncResult> {
  await connectDB();
  const websiteId = website._id.toString();
  const stripeConfig = website.paymentProviders?.stripe;
  const apiKey = stripeConfig?.apiKey;
  const result: StripeSiteSyncResult = {
    websiteId,
    synced: 0,
    skipped: 0,
    errors: 0,
    mode: "skipped",
  };
  if (!apiKey) return result;

  const syncConfig = stripeConfig?.syncConfig;
  const syncer = new StripePaymentSyncer(apiKey, options.helper);
  const add = (r: SyncResult) => {
    result.synced += r.synced;
    result.skipped += r.skipped;
    result.errors += r.errors;
  };

  try {
    if (!options.skipIncremental) {
      const cursor =
        syncConfig?.lastEventAt ??
        syncConfig?.lastSyncAt ??
        new Date(Date.now() - FALLBACK_WINDOW_MS);
      const since = new Date(new Date(cursor).getTime() - EVENT_OVERLAP_MS);
      try {
        const r = await syncer.syncFromEvents(
          websiteId,
          since,
          options.deadline,
          (lastEventAt) => setSyncConfig(websiteId, { lastEventAt }),
        );
        add(r);
        result.mode = "events";
      } catch (error) {
        if (!isStripePermissionError(error)) throw error;
        // No Events access: re-read recent payments by creation time.
        const end = new Date();
        add(
          await syncer.syncPayments(
            new Date(end.getTime() - FALLBACK_WINDOW_MS),
            end,
            websiteId,
            options.deadline,
          ),
        );
        result.mode = "window";
      }
    }

    const backfill = syncConfig?.backfill;
    if (
      backfill &&
      (backfill.status === "pending" || backfill.status === "running") &&
      Date.now() < options.deadline
    ) {
      const state: BackfillState = {
        status: backfill.status,
        phase: backfill.phase,
        startingAfter: backfill.startingAfter,
        until: backfill.until,
        startedAt: backfill.startedAt,
        finishedAt: backfill.finishedAt,
        lastError: backfill.lastError,
      };
      try {
        add(
          await syncer.backfillChunk(websiteId, state, options.deadline, (s) =>
            setSyncConfig(websiteId, { backfill: s }),
          ),
        );
      } catch (error) {
        state.lastError = errorMessage(error);
        await setSyncConfig(websiteId, { backfill: state });
        throw error;
      }
      result.backfill = state.status;
    }

    await setSyncConfig(websiteId, {
      lastSyncAt: new Date(),
      lastError: null,
      authFailedAt: null,
    });
  } catch (error) {
    result.error = errorMessage(error);
    result.errors++;
    await setSyncConfig(websiteId, {
      lastError: result.error,
      ...(isStripeAuthError(error) && { authFailedAt: new Date() }),
    });
  }
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

async function paymentIntentForInvoiceId(
  api: Pick<StripeApi, "listInvoicePayments">,
  invoiceId: string,
): Promise<string | null> {
  const payments = await api.listInvoicePayments(invoiceId);
  const paid = payments.find((p) => p.payment.payment_intent);
  return idOf(paid?.payment.payment_intent as any) ?? null;
}

async function paymentIntentForCheckoutSession(
  api: Pick<StripeApi, "listInvoicePayments">,
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const direct = idOf(session.payment_intent as any);
  if (direct) return direct;
  const invoiceId = idOf(session.invoice as any);
  return invoiceId ? paymentIntentForInvoiceId(api, invoiceId) : null;
}

/**
 * The PaymentIntent behind any Stripe payment-ish id: `pi_` as is, a charge's
 * PaymentIntent, an invoice's (via InvoicePayment) or a Checkout Session's.
 * Null when the id isn't a Stripe id or can't be resolved.
 */
export async function resolveStripePaymentIntentId(
  api: Pick<
    StripeApi,
    "retrieveCharge" | "listInvoicePayments" | "retrieveCheckoutSession"
  >,
  id: string,
): Promise<string | null> {
  try {
    if (id.startsWith("pi_")) return id;
    if (id.startsWith("ch_") || id.startsWith("py_")) {
      const charge = await api.retrieveCharge(id);
      return idOf(charge.payment_intent as any) ?? null;
    }
    if (id.startsWith("in_")) return await paymentIntentForInvoiceId(api, id);
    if (id.startsWith("cs_")) {
      const session = await api.retrieveCheckoutSession(id);
      return await paymentIntentForCheckoutSession(api, session);
    }
  } catch (error) {
    return null;
  }
  return null;
}

export const STRIPE_ID_PREFIXES = ["pi_", "ch_", "py_", "in_", "cs_", "re_"];

export function looksLikeStripeId(id: string): boolean {
  return STRIPE_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
}

/**
 * Payments API: when the website has Stripe connected, a Stripe id is stored
 * under provider "stripe" and its PaymentIntent id — whatever `provider` the
 * caller sent — so the API and the sync never count one payment twice.
 */
export async function mapApiPaymentToStripe(
  websiteId: string,
  provider: string,
  providerPaymentId: string,
  makeApi: (
    apiKey: string,
  ) => Pick<
    StripeApi,
    "retrieveCharge" | "listInvoicePayments" | "retrieveCheckoutSession"
  > = (apiKey) => new StripeHelper(apiKey),
): Promise<{
  provider: string;
  providerPaymentId: string;
  stripeConnected: boolean;
}> {
  const unchanged = { provider, providerPaymentId, stripeConnected: false };
  const website = await Website.findById(websiteId)
    .select("paymentProviders.stripe.apiKey")
    .lean<Pick<IWebsite, "paymentProviders">>();
  const apiKey = website?.paymentProviders?.stripe?.apiKey;
  if (!apiKey) return unchanged;
  if (!looksLikeStripeId(providerPaymentId)) {
    return { ...unchanged, stripeConnected: true };
  }
  if (providerPaymentId.startsWith("re_")) {
    return { provider: "stripe", providerPaymentId, stripeConnected: true };
  }
  const paymentIntentId = await resolveStripePaymentIntentId(
    makeApi(apiKey),
    providerPaymentId,
  );
  return paymentIntentId
    ? {
        provider: "stripe",
        providerPaymentId: paymentIntentId,
        stripeConnected: true,
      }
    : { ...unchanged, stripeConnected: true };
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
    return await paymentIntentForInvoiceId(new StripeHelper(apiKey), invoiceId);
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
        "Please use a restricted API key (starts with 'rk_'). Create a restricted API key with Core (Read), Billing (Read), Checkout (Read), Events (Read), and Webhook (Write) permissions.",
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
    await stripe.events.list({ limit: 1 });
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
      // Stripe names the missing permission, e.g. "Enabling Balance Read
      // ('balance_read') permissions on this key would allow this request…"
      const missing = (error.message || "").match(
        /Enabling (.+?) \('[a-z_]+'\) permission/,
      )?.[1];
      if (missing) {
        return {
          error: `Your Stripe key is missing the ${missing} permission. Edit the key in your Stripe dashboard to grant it, then connect again.`,
          statusCode: 400,
        };
      }
      return {
        error:
          "Stripe API key doesn't have the required permissions. Please create a restricted API key with Core (Read), Billing (Read), Checkout (Read), Events (Read), and Webhook (Write) permissions.",
        statusCode: 400,
      };
    }
    return {
      error:
        error.message ||
        "Failed to validate Stripe API key. Please check that your restricted key has Core (Read), Billing (Read), Checkout (Read), Events (Read), and Webhook (Write) permissions.",
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
