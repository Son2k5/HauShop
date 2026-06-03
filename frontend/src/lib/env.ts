const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is required");
}

export const API_BASE_URL = apiBaseUrl;
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
export const SIGNALR_HUB_URL =
  import.meta.env.VITE_SIGNALR_URL ?? `${API_ORIGIN}/hubs/chat`;
export const NOTIFICATION_HUB_URL =
  import.meta.env.VITE_NOTIFICATION_HUB_URL ?? `${API_ORIGIN}/hubs/notifications`;

const authIdleTimeoutHours = Number(import.meta.env.VITE_AUTH_IDLE_TIMEOUT_HOURS ?? "3");
export const AUTH_IDLE_TIMEOUT_MS =
  Number.isFinite(authIdleTimeoutHours) && authIdleTimeoutHours > 0
    ? authIdleTimeoutHours * 60 * 60 * 1000
    : 3 * 60 * 60 * 1000;
