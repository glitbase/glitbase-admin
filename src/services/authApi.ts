import { api } from "./baseQuery";
import { IApiResponse, User } from "@/types/api";

/**
 * Authentication API endpoints
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface ResendOTPRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<IApiResponse<LoginResponse>> {
  return api.post<LoginResponse>("/auth/login", data, { skipAuth: true });
}

/**
 * Register new user
 */
export async function register(data: RegisterRequest): Promise<IApiResponse<LoginResponse>> {
  return api.post<LoginResponse>("/auth/register", data, { skipAuth: true });
}

/**
 * Logout user
 */
export async function logout(): Promise<IApiResponse<void>> {
  return api.post<void>("/auth/logout");
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<IApiResponse<User>> {
  return api.get<User>("/auth/profile");
}

/**
 * Update user profile
 */
export async function updateProfile(data: Partial<User>): Promise<IApiResponse<User>> {
  return api.patch<User>("/auth/profile", data);
}

/**
 * Forgot password - send reset email
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<IApiResponse<void>> {
  return api.post<void>("/auth/forgot-password", data, { skipAuth: true });
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<IApiResponse<void>> {
  return api.post<void>("/auth/reset-password", data, { skipAuth: true });
}

/**
 * Verify OTP
 */
export async function verifyOTP(data: VerifyOTPRequest): Promise<IApiResponse<void>> {
  return api.post<void>("/auth/verify-otp", data, { skipAuth: true });
}

/**
 * Resend OTP
 */
export async function resendOTP(data: ResendOTPRequest): Promise<IApiResponse<void>> {
  return api.post<void>("/auth/resend-otp", data, { skipAuth: true });
}

/**
 * Change password (authenticated)
 */
export async function changePassword(data: ChangePasswordRequest): Promise<IApiResponse<void>> {
  return api.post<void>("/auth/change-password", data);
}

/**
 * Refresh access token
 * Note: Refresh token should be sent in Authorization header or cookie per PRD
 */
export async function refreshToken(refreshTokenValue: string): Promise<IApiResponse<LoginResponse>> {
  // The refresh token should be sent in Authorization header or cookie
  // Since cookies are handled automatically, we'll use Authorization header as fallback
  return api.post<LoginResponse>(
    "/auth/refresh-user-token",
    {},
    {
      skipAuth: true,
      headers: {
        Authorization: `Bearer ${refreshTokenValue}`,
      },
    }
  );
}

