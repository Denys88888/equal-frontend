/**
 * Equal Dating App — Authentication API
 *
 * Handles Pi Network SDK auth, email register/login, and token refresh.
 * All endpoints are public (no Bearer token required).
 */

import { api } from './client';
import type {
  AuthPiRequest,
  AuthEmailRequest,
  AuthResponse,
  TokenRefreshResponse,
} from './types';

/**
 * Authenticate a user via the Pi Network SDK.
 *
 * The backend validates the Pi access token by calling Pi Platform API /me,
 * creates a new user record on first login, and returns a JWT.
 *
 * @param accessToken — accessToken returned by `Pi.authenticate()`
 * @param scopes    — granted scopes (e.g. ['username', 'payments', 'wallet_address'])
 * @returns JWT token + base user record
 *
 * @throws {ApiError} 401 if Pi token is invalid; 403 if incomplete payment found
 */
export async function piAuth(accessToken: string, scopes: string[]): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/pi', {
    accessToken,
    scopes,
  } as AuthPiRequest);
  return data;
}

/**
 * Register a new user with email & password.
 *
 * If the email already exists the backend may return the existing user's token
 * (idempotent login/register behaviour depends on backend implementation).
 *
 * @param email    — valid e-mail address
 * @param password — minimum 6 characters
 * @param name     — optional display name
 * @returns JWT token + base user record
 *
 * @throws {ApiError} 400 on validation failure; 409 if email already taken
 */
export async function emailRegister(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/email', {
    email,
    password,
    name,
  } as AuthEmailRequest);
  return data;
}

/**
 * Log in an existing email-authenticated user.
 *
 * @param email    — registered e-mail address
 * @param password — user's password
 * @returns JWT token + base user record
 *
 * @throws {ApiError} 401 on wrong credentials
 */
export async function emailLogin(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/email', {
    email,
    password,
  } as AuthEmailRequest);
  return data;
}

/**
 * Refresh an expired JWT access token using a long-lived refresh token.
 *
 * @param refreshToken — the refresh token previously returned by the backend
 * @returns a new short-lived access token
 *
 * @throws {ApiError} 401 if the refresh token is invalid or expired
 */
export async function refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
  const { data } = await api.post<TokenRefreshResponse>('/auth/refresh', {
    refreshToken,
  });
  return data;
}

// ───────────────────────────────────────────────────────────
// NAMESPACE EXPORT (convenience)
// ───────────────────────────────────────────────────────────

/**
 * Grouped auth API methods for cleaner imports:
 * `import { authApi } from '@/api/auth'`
 */
export const authApi = {
  piAuth,
  emailRegister,
  emailLogin,
  refreshToken,
};
