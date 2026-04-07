
export type Role = "Admin" | "Member" | "Merchant";

// Provider.cs  →  Local=0 | Google=1
export type Provider = "Local" | "Google";

export type OtpPurpose =
  | "ResetPassword"
  | "EmailVerification"
  | "PhoneVerification"
  | "TwoFactorAuth"
  | "LoginVerification";

// ── Request DTOs ──────────────────────────────────────────────────
export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ── Response DTOs ─────────────────────────────────────────────────
export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatar?: string | null;
  role: Role;
  provider?: Provider;
  isOnline: boolean;
  lastSeen: string | null;
  created: string;

}

export interface AuthResponse {
  message: string;
  user: UserDto;
}

export interface UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
}

// ── Auth State ────────────────────────────────────────────────────
export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  user: UserDto | null;
  status: AuthStatus;
  error: string | null;
}

// ── API Error ─────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  statusCode?: number;
  errors?:    Record<string, string[]> | null;
}

export interface ApiErrorResponse{
  success: boolean;
  message : string;
  errors?: Record<string, string[]>; 
}