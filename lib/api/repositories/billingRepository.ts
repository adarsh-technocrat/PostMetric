import { apiClient } from "@/lib/api/client";
import type { PlanId } from "@/lib/billing/plans";
import type { VolumeKey } from "@/lib/billing/pricing-tiers";

export interface CreateCheckoutPayload {
  planId: PlanId;
  billingPeriod: "monthly" | "yearly";
  volume?: VolumeKey;
}

export async function createCheckout(
  payload: CreateCheckoutPayload,
): Promise<{ url: string }> {
  const { data } = await apiClient.post<{ url: string }>(
    "/api/billing/checkout",
    payload,
  );
  return data;
}

export interface BillingStatus {
  canManageBilling?: boolean;
  status?: string;
  [key: string]: unknown;
}

export async function getBillingStatus(): Promise<BillingStatus> {
  const { data } = await apiClient.get<BillingStatus>("/api/billing/status");
  return data;
}

export async function openPortal(): Promise<{ url: string }> {
  const { data } = await apiClient.post<{ url: string }>(
    "/api/billing/portal",
    {},
  );
  return data;
}
