import { apiClient } from "@/lib/api/client";

export interface FolderItem {
  name: string;
  linkCount: number;
}

export async function getFolders(websiteId: string): Promise<FolderItem[]> {
  const { data } = await apiClient.get<{ folders: FolderItem[] }>(
    `/api/websites/${websiteId}/folders`,
  );
  return data.folders ?? [];
}

export async function createFolder(
  websiteId: string,
  name: string,
): Promise<void> {
  await apiClient.post(`/api/websites/${websiteId}/folders`, { name });
}

export async function renameFolder(
  websiteId: string,
  oldName: string,
  newName: string,
): Promise<void> {
  await apiClient.patch(`/api/websites/${websiteId}/folders`, {
    oldName,
    newName,
  });
}

export async function deleteFolder(
  websiteId: string,
  name: string,
): Promise<void> {
  await apiClient.delete(
    `/api/websites/${websiteId}/folders?name=${encodeURIComponent(name)}`,
  );
}
