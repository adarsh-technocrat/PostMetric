import { apiClient } from "@/lib/api/client";

export interface Website {
  _id: string;
  domain: string;
  name: string;
  iconUrl?: string;
  userId: string;
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiKey {
  _id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface TeamMember {
  _id: string;
  userId: { _id: string; email: string; name?: string; avatarUrl?: string };
  invitedBy: { email: string; name?: string };
  role: "viewer" | "editor" | "admin";
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  acceptedAt?: string;
}

export interface NotificationSettings {
  weeklySummary: boolean;
  trafficSpike: boolean;
}

export async function getAllWebsites(): Promise<Website[]> {
  const { data } = await apiClient.get<{ websites: Website[] }>(
    "/api/websites",
  );
  return data.websites ?? [];
}

export async function getWebsiteById(
  websiteId: string,
): Promise<Website> {
  const { data } = await apiClient.get<{ website: Website }>(
    `/api/websites/${websiteId}`,
  );
  return data.website;
}

export async function updateWebsite(
  websiteId: string,
  updates: Record<string, unknown>,
): Promise<Website> {
  const { data } = await apiClient.put<{ website: Website }>(
    `/api/websites/${websiteId}`,
    updates,
  );
  return data.website;
}

export async function createWebsite(payload: {
  domain: string;
  name: string;
  iconUrl?: string;
  settings?: { timezone?: string; [key: string]: unknown };
}): Promise<Website> {
  const { data } = await apiClient.post<{ website: Website }>(
    "/api/websites",
    payload,
  );
  return data.website;
}

export async function deleteWebsite(websiteId: string): Promise<void> {
  await apiClient.delete(`/api/websites/${websiteId}`);
}

export async function connectStripeRevenue(
  websiteId: string,
  apiKey: string,
): Promise<Website> {
  const { data } = await apiClient.post<{ website: Website }>(
    `/api/websites/${websiteId}/revenue/stripe/connect`,
    { apiKey },
  );
  return data.website;
}

export async function disconnectStripeRevenue(
  websiteId: string,
): Promise<Website> {
  const { data } = await apiClient.post<{ website: Website }>(
    `/api/websites/${websiteId}/revenue/stripe/disconnect`,
  );
  return data.website;
}

export async function getApiKeys(websiteId: string): Promise<ApiKey[]> {
  const { data } = await apiClient.get<{ apiKeys: ApiKey[] }>(
    `/api/websites/${websiteId}/api-keys`,
  );
  return data.apiKeys ?? [];
}

export async function createApiKey(
  websiteId: string,
  name: string,
): Promise<ApiKey> {
  const { data } = await apiClient.post<{ apiKey: ApiKey }>(
    `/api/websites/${websiteId}/api-keys`,
    { name: name.trim() || "Unnamed Key" },
  );
  return data.apiKey;
}

export async function deleteApiKey(
  websiteId: string,
  keyId: string,
): Promise<void> {
  await apiClient.delete(`/api/websites/${websiteId}/api-keys/${keyId}`);
}

export async function getTeamMembers(websiteId: string): Promise<{
  teamMembers: TeamMember[];
  owner: unknown;
}> {
  const { data } = await apiClient.get<{
    teamMembers: TeamMember[];
    owner: unknown;
  }>(`/api/websites/${websiteId}/team`);
  return {
    teamMembers: data.teamMembers ?? [],
    owner: data.owner ?? null,
  };
}

export async function inviteTeamMember(
  websiteId: string,
  email: string,
  role: "viewer" | "editor" | "admin",
): Promise<unknown> {
  const { data } = await apiClient.post(`/api/websites/${websiteId}/team`, {
    email: email.trim(),
    role,
  });
  return data;
}

export async function updateTeamMemberRole(
  websiteId: string,
  memberId: string,
  role: "viewer" | "editor" | "admin",
): Promise<void> {
  await apiClient.put(`/api/websites/${websiteId}/team/${memberId}`, {
    role,
  });
}

export async function removeTeamMember(
  websiteId: string,
  memberId: string,
): Promise<void> {
  await apiClient.delete(`/api/websites/${websiteId}/team/${memberId}`);
}

export async function getNotificationSettings(
  websiteId: string,
): Promise<NotificationSettings> {
  const { data } = await apiClient.get<{
    notification: NotificationSettings;
  }>(`/api/websites/${websiteId}/notifications`);
  return (
    data.notification ?? {
      weeklySummary: false,
      trafficSpike: false,
    }
  );
}

export async function updateNotificationSettings(
  websiteId: string,
  settings: NotificationSettings,
): Promise<NotificationSettings> {
  const { data } = await apiClient.put<{
    notification: NotificationSettings;
  }>(`/api/websites/${websiteId}/notifications`, settings);
  return data.notification ?? settings;
}

export async function importPlausibleData(
  websiteId: string,
  file: File,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post(
    `/api/websites/${websiteId}/plausible-import`,
    formData,
  );
  return data;
}
