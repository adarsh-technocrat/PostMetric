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
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const returnPath = window.location.pathname || "/";
      window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}`;
      return Promise.reject(error);
    }
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  },
);
