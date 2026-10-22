import axios, { type AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    // Keep cancellations recognisable (name "CanceledError") so callers can
    // tell an aborted request apart from a real failure.
    if (axios.isCancel(error as unknown)) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const returnPath = window.location.pathname || "/";
      window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}`;
      return Promise.reject(error);
    }
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";
    const wrapped = new Error(message) as Error & { status?: number };
    wrapped.status = error.response?.status;
    return Promise.reject(wrapped);
  },
);
