import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// ─────────────────────────────────────────────
// PascalCase → camelCase
// ─────────────────────────────────────────────
function toCamelCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCase);

    const result: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
            result[camelKey] = toCamelCase(obj[key]);
        }
    }
    return result;
}

// ─────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────
const api = axios.create({
    baseURL: 'https://localhost:7288/api',
    withCredentials: true,
});

// ─────────────────────────────────────────────
// Request interceptor
// ─────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        if (config.data instanceof FormData) {
            delete config.headers?.['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// Refresh control
// ─────────────────────────────────────────────
let isRefreshing = false;

let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any) => {
    failedQueue.forEach((p) => {
        if (error) p.reject(error);
        else p.resolve();
    });
    failedQueue = [];
};

// ─────────────────────────────────────────────
// Response interceptor
// ─────────────────────────────────────────────
api.interceptors.response.use(
    (response) => {
        if (response.data) {
            response.data = toCamelCase(response.data);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        const is401 = error.response?.status === 401;

        //  CHẶN LOOP: không xử lý nếu chính nó là refresh API
        if (originalRequest?.url?.includes('/auth/refresh-token')) {
            return Promise.reject(error);
        }

        if (is401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Nếu đang refresh → queue lại
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => api(originalRequest));
            }

            isRefreshing = true;

            try {
                //  Gọi refresh
                await api.post('/auth/refresh-token');

                processQueue(null);

                // Retry request cũ (chỉ 1 lần)
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);

                console.error('Refresh token failed');

                //  KHÔNG loop nữa → redirect luôn
                window.location.href = '/signin';

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ───────── Optional xử lý lỗi 500 ─────────
        if (error.response?.status === 500 && error.response?.data?.message) {
            error.message = error.response.data.message;
        }

        return Promise.reject(error);
    }
);

export default api;