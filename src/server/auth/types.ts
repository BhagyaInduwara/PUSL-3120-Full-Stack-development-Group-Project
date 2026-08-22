import type { PublicUser, UserRole } from "@/domain/User";

/**
 * Request payload for login: POST /api/auth/login
 */
export interface LoginInput {
  username: string;
  password: string;
}

/**
 * Request payload for self-service registration: POST /api/auth/register
 */
export interface RegisterInput {
  username: string;
  password: string;
}

/**
 * Successful authentication response payload.
 */
export interface AuthResponse {
  user: PublicUser;
}

/**
 * Standard error response payload across all auth endpoints.
 */
export interface ApiErrorResponse {
  error: string;
}

/**
 * Generic success response payload for operations like logout.
 */
export interface SuccessResponse {
  ok: boolean;
}

export type { PublicUser, UserRole };
