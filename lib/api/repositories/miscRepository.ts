import { apiClient } from "@/lib/api/client";

export async function subscribeNewsletter(email: string): Promise<unknown> {
  const { data } = await apiClient.post("/api/newsletter/subscribe", {
    email,
  });
  return data;
}

export async function hasEvents(websiteId: string): Promise<boolean> {
  const { data } = await apiClient.get<{ hasEvents: boolean }>(
    `/api/websites/${websiteId}/has-events`,
  );
  return data.hasEvents ?? false;
}

export async function getConversionMetrics(websiteId: string): Promise<unknown> {
  const { data } = await apiClient.get<{ conversionMetrics: unknown }>(
    `/api/websites/${websiteId}/conversion-metrics`,
  );
  return data.conversionMetrics;
}

export async function getRealtimePublicUrl(
  websiteId: string,
): Promise<{ url?: string }> {
  const { data } = await apiClient.get<{ url?: string }>(
    `/api/websites/${websiteId}/realtime/public`,
  );
  return data;
}
