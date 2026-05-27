import type { AxiosRequestConfig } from "axios";
import api from "../api/apiClient";

export type HttpRequestConfig = AxiosRequestConfig & {
  skipAuthRedirect?: boolean;
};

export const http = {
  async get<T>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await api.get<T>(url, config);
    return response.data;
  },

  async post<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  async put<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await api.put<T>(url, data, config);
    return response.data;
  },

  async patch<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  },

  async delete<T = void>(url: string, config?: HttpRequestConfig): Promise<T> {
    const response = await api.delete<T>(url, config);
    return response.data;
  },
};
