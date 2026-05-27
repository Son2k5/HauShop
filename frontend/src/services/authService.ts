import { API_ORIGIN } from "../lib/env";
import { http } from "../lib/http";
import type {
    RegisterDto,
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ChangePasswordDto,
    UserDto
} from "../@types/auth.type";

export const authService = {
    register: (dto: RegisterDto) =>
        http.post<UserDto>("/auth/register", dto),

    login: (dto: LoginDto) =>
        http.post<UserDto>("/auth/login", dto),

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

    getCurrentUser: () =>
        http.get<UserDto>("/auth/me", { skipAuthRedirect: true }),

    loginWithGoogle: () => {
        window.location.href = `${API_ORIGIN}/api/auth/google`;
    }
};
