/**
 * Equal Dating App — Payments API
 *
 * Pi Network payment lifecycle: approve, complete, and donate.
 * All flows go through the backend which proxies the Pi Platform API.
 */

import { api } from './client';
import type { DonationResponse } from './types';

/**
 * Approve an incomplete Pi payment.
 *
 * Called after the user confirms the payment in the Pi Browser.
 * The backend forwards the call to `POST /v2/payments/{paymentId}/approve`.
 *
 * @param paymentId — the payment identifier returned by Pi.createPayment()
 * @throws {ApiError} 404 if payment not found; 409 if already approved
 */
export async function approvePayment(paymentId: string): Promise<void> {
  await api.post<void>(`/pi/payments/${encodeURIComponent(paymentId)}/approve`, {});
}

/**
 * Complete a Pi payment after the blockchain transaction has been submitted.
 *
 * The backend verifies the txid on-chain then marks the payment completed.
 *
 * @param paymentId — the payment identifier
 * @param txid      — the blockchain transaction hash
 * @throws {ApiError} 404 if payment not found; 400 if txid is invalid
 */
export async function completePayment(paymentId: string, txid: string): Promise<void> {
  await api.post<void>(`/pi/payments/${encodeURIComponent(paymentId)}/complete`, { txid });
}

/**
 * Initiate a donation (in-app purchase / spark recharge).
 *
 * The backend creates a Pi payment object and returns the deep-link URL
 * for the user to confirm in the Pi Browser.
 *
 * @param amount — donation amount in Pi
 * @param memo   — optional memo shown to the user in the Pi payment UI
 * @returns Payment ID + Pi Browser URL for confirmation
 * @throws {ApiError} 400 if amount <= 0
 */
export async function donate(amount: number, memo?: string): Promise<DonationResponse> {
  const { data } = await api.post<DonationResponse>('/payments/donate', {
    amount,
    memo,
  });
  return data;
}

/**
 * Fetch the current spark balance for the authenticated user.
 *
 * @returns Spark balance object
 * @throws {ApiError} 401 if not authenticated
 */
export async function getSparkBalance(): Promise<{ balance: number }> {
  const { data } = await api.get<{ balance: number }>('/sparks/balance');
  return data;
}

// ───────────────────────────────────────────────────────────
// NAMESPACE EXPORT
// ───────────────────────────────────────────────────────────

/**
 * Grouped payments API methods:
 * `import { paymentsApi } from '@/api/payments'`
 */
export const paymentsApi = {
  approve: approvePayment,
  complete: completePayment,
  donate,
  getSparkBalance,
};
