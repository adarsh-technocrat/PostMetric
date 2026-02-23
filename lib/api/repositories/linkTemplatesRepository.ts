import { apiClient } from "@/lib/api/client";

export interface LinkTemplate {
  _id: string;
  name: string;
  baseUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export async function getLinkTemplates(
  websiteId: string,
): Promise<LinkTemplate[]> {
  const { data } = await apiClient.get<{ templates: LinkTemplate[] }>(
    `/api/websites/${websiteId}/link-templates`,
  );
  return data.templates ?? [];
}

export interface CreateLinkTemplatePayload {
  name: string;
  baseUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  tags?: string[];
  comments?: string;
  folder?: string;
  conversionTracking?: boolean;
  customPreview?: {
    title?: string;
    description?: string;
    imageUrl?: string;
  };
  password?: string;
  expiresAt?: Date;
}

export async function createLinkTemplate(
  websiteId: string,
  payload: CreateLinkTemplatePayload,
): Promise<LinkTemplate> {
  const { data } = await apiClient.post<{ template: LinkTemplate }>(
    `/api/websites/${websiteId}/link-templates`,
    payload,
  );
  return data.template;
}

export async function deleteLinkTemplate(
  websiteId: string,
  templateId: string,
): Promise<void> {
  await apiClient.delete(
    `/api/websites/${websiteId}/link-templates/${templateId}`,
  );
}
