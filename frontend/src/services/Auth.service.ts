import api from "../api/apiClient";
import type {
    RegisterDto,
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ChangePasswordDto,
    AuthResponse
} from "../@types/auth.type";

// Helper để extract error từ Axios error
function extractError(error: any): string {
    if (error.response?.data?.errors) {
        // FluentValidation errors - object với key là field, value là array messages
        const errors = error.response.data.errors;
        return Object.values(errors).flat().join(', ');
    }
    return error.response?.data?.message || error.message || 'An error occurred';
}

export const authService = {
    register: async (dto: RegisterDto) => {
        try {
            const res = await api.post<AuthResponse>("/auth/register", dto);
            return res.data;
        } catch (error: any) {
            throw new Error(extractError(error));
        }
    },

    login: async (dto: LoginDto) => {
        try {
            const res = await api.post<AuthResponse>("/auth/login", dto);
            return res.data;
        } catch (error: any) {
            throw new Error(extractError(error));
        }
    },

    logout: () => 
        api.post("/auth/logout").then(res => res.data),

    refreshToken: () => 
        api.post("/auth/refresh-token").then(res => res.data),

    resetPassword: (dto: ResetPasswordDto) => 
        api.post("/auth/reset-password", dto).then(res => res.data),

    forgotPassword: (dto: ForgotPasswordDto) => 
        api.post("/auth/forgot-password", dto).then(res => res.data),

    changePassword: (dto: ChangePasswordDto) => 
        api.post("/auth/change-password", dto).then(res => res.data),

    revokeToken: () => 
        api.post("/auth/revoke-token").then(res => res.data),

    loginWithGoogle: () => {
        window.location.href = "https://localhost:7288/api/auth/google";
    }
};