
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResponse,
  ApiError,
} from "../@types/auth.type.ts";
const BASE = "https://localhost:7288/api/auth";

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",   
    ...init,
  });
 
  let data: unknown = null;
  try { data = await res.json(); } catch {  }
 
  if (!res.ok) {
    const err = data as { message?: string } | null;
    throw { message: err?.message ?? `HTTP ${res.status}`, statusCode: res.status } as ApiError;
  }
 
  return data as T;
}

// Auth Service
export const authService = {
    register: (dto:RegisterDto) =>
        req<AuthResponse>("/register", {method:  "POST", body:JSON.stringify(dto)}),
    login: (dto:LoginDto) =>
        req<AuthResponse>("/login", {method:  "POST", body:JSON.stringify(dto)}),
    logout: () =>
        req<{message : string}>("/logout", {method:  "POST"}),
    refreshToken: () =>
        req<{message: string}>("/refresh-token", {method:  "POST"}),
    resetPassword: (dto: ResetPasswordDto) =>
        req<{message: string}>("/reset-password",{method:"POST", body: JSON.stringify(dto)}),
    forgotPassword: (dto: ForgotPasswordDto) =>
        req<{message: string}>("/forgot-password", {method: "POST", body: JSON.stringify(dto)}),
    changePassword : (dto: ChangePasswordDto) =>
        req<{message: string}>("/change-password",{method:"POST", body: JSON.stringify(dto)}),
    revokeToke: () =>
        req<{message: string}>("/revoke-token",{method:"POST"}),

    loginWithGoogle: () =>{
        window.location.href ="https://localhost:7288/api/auth/google" 
    }

}