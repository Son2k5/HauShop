import axios from 'axios';
import   type { InternalAxiosRequestConfig } from 'axios';

// Hàm chuyển đổi PascalCase từ Backend (C#) thành camelCase cho Frontend
function toCamelCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCase);
    const result: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // Chuyển PascalCase sang camelCase: User → user, FirstName → firstName
            const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
            result[camelKey] = toCamelCase(obj[key]);
        }
    }
    return result;
}

const api = axios.create({
    baseURL: 'https://localhost:7288/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor để xử lý FormData (upload file)
// Khi gửi FormData, browser tự động set Content-Type với boundary
api.interceptors.request.use(
    (config) => {
        if (config.data instanceof FormData) {
            // Xóa Content-Type để browser tự set multipart/form-data với boundary
            delete config.headers['Content-Type'];
        }
        // Debug: log cookie cho upload requests
        if (config.url?.includes('/user/avatar')) {
            console.log('Avatar upload request:', {
                url: config.url,
                withCredentials: config.withCredentials,
                cookies: document.cookie
            });
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(null);
    });
    failedQueue = [];
};

// Danh sách các endpoint không nên redirect khi lỗi auth
// (ví dụ: upload file, các action không liên quan đến auth)
const NO_REDIRECT_ENDPOINTS = ['/user/avatar'];

api.interceptors.response.use(
    (response) => {
        // Chuyển đổi PascalCase sang camelCase cho tất cả response
        if (response.data) {
            response.data = toCamelCase(response.data);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Nếu lỗi 401 (Unauthorized) và chưa thử lại
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Kiểm tra xem endpoint này có cần redirect không
            const shouldNotRedirect = NO_REDIRECT_ENDPOINTS.some(endpoint =>
                originalRequest.url?.includes(endpoint)
            );

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi API refresh-token (Backend sẽ tự đọc Refresh Cookie và Set-Cookie mới)
                await axios.post('https://localhost:7288/api/auth/refresh-token', {}, { withCredentials: true });

                processQueue(null);
                return api(originalRequest); // Thực hiện lại request bị lỗi ban đầu
            } catch (refreshError) {
                processQueue(refreshError);
                // Chỉ redirect khi refresh token thất bại VÀ endpoint cho phép redirect
                if (!shouldNotRedirect) {
                    console.error("Session expired. Redirecting to sign-in...");
                    window.location.href = '/signin';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Debug logging for upload errors
        if (error.config?.url?.includes('/user/avatar')) {
            console.error('Avatar upload error in interceptor:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
        }

        // Xử lý lỗi 500 từ server để trả về message chi tiết
        if (error.response?.status === 500 && error.response?.data?.message) {
            error.message = error.response.data.message;
        }

        return Promise.reject(error);
    }
);

export default api;