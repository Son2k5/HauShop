import type { AxiosRequestConfig } from "axios";
import api from "../api/apiClient";

export type HttpRequestConfig = AxiosRequestConfig & {
  skipAuthRedirect?: boolean;
};

function withCleanParams(config?: HttpRequestConfig): HttpRequestConfig | undefined {
  if (!config?.params || config.params instanceof URLSearchParams || typeof config.params !== "object") {
    return config;
  }

  const params = Object.fromEntries(
    Object.entries(config.params as Record<string, unknown>).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );

  return { ...config, params };
}

export const http = {
  async get<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await api.get<T>(url, withCleanParams(config));
    return response.data;
  },

  async post<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await api.post<T>(url, data, withCleanParams(config));
    return response.data;
  },

  async put<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await api.put<T>(url, data, withCleanParams(config));
    return response.data;
  },

  async patch<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await api.patch<T>(url, data, withCleanParams(config));
    return response.data;
  },

  async delete<T = void>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await api.delete<T>(url, withCleanParams(config));
    return response.data;
  },
};
