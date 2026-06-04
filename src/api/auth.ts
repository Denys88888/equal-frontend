/**
 * Equal Dating App — Authentication API
 *
 * Handles Pi Network SDK auth and token refresh.
 * All endpoints are public (no Bearer token required).
 */

import { api } from './client';
import type {
  AuthPiRequest,
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
  const body = { accessToken, scopes } as AuthPiRequest;
  console.log('[API AUTH] POST /auth/pi, body keys:', Object.keys(body), 'token len:', accessToken?.length);
  try {
    const { data } = await api.post<AuthResponse>('/auth/pi', body);
    console.log('[API AUTH] Success!');
    return data;
  } catch (err: any) {
    console.error('[API AUTH] Failed:', err.status, err.message);
    throw err;
  }
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
  refreshToken,
};
