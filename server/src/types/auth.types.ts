import type { UserRole } from "../models/User.js";

/**
 * Request payload for POST /api/auth/login
 */
export interface LoginInput {
  username?: string;
  password?: string;
}

/**
 * Request payload for POST /api/auth/register
 */
export interface RegisterInput {
  username?: string;
  password?: string;
}

/**
 * Public User entity returned in responses
 */
export interface PublicUserDto {
  id: string;
  username: string;
  role: UserRole;
  createdAt: Date;
}

/**
 * Successful authentication response payload.
 */
export interface AuthResponseDto {
  user: PublicUserDto;
}

/**
 * Standard API error response schema.
 */
export interface ApiErrorResponseDto {
  error: string;
}
