import { API_ORIGIN } from "../lib/env";
import { http } from "../lib/http";
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
            return await http.post<AuthResponse>("/auth/register", dto);
        } catch (error: any) {
            throw new Error(extractError(error));
        }
    },

    login: async (dto: LoginDto) => {
        try {
            return await http.post<AuthResponse>("/auth/login", dto);
        } catch (error: any) {
            throw new Error(extractError(error));
        }
    },

    logout: () => 
        http.post("/auth/logout"),

    refreshToken: () => 
        http.post("/auth/refresh-token"),

    resetPassword: (dto: ResetPasswordDto) => 
        http.post("/auth/reset-password", dto),

    forgotPassword: (dto: ForgotPasswordDto) => 
        http.post("/auth/forgot-password", dto),

    changePassword: (dto: ChangePasswordDto) => 
        http.post("/auth/change-password", dto),

    revokeToken: () => 
        http.post("/auth/revoke-token"),

    getCurrentUser: async () => {
        const data = await http.get<any>("/auth/me", { skipAuthRedirect: true });
        if (data?.user) return data.user;
        if (data?.id || data?.email) return data;
        throw new Error("Invalid response structure from /auth/me");
    },

    loginWithGoogle: () => {
        window.location.href = `${API_ORIGIN}/api/auth/google`;
    }
};
