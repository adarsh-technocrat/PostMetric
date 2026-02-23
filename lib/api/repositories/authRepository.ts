import { apiClient } from "@/lib/api/client";

export interface VerifyFirebasePayload {
  token: string;
}

export interface VerifyFirebaseResponse {
  user?: { id: string; email?: string };
  [key: string]: unknown;
}

export async function verifyFirebase(
  payload: VerifyFirebasePayload,
): Promise<VerifyFirebaseResponse> {
  const { data } = await apiClient.post<VerifyFirebaseResponse>(
    "/api/auth/firebase/verify",
    payload,
  );
  return data;
}
