/**
 * Equal Dating App — Payments API
 *
 * Pi Network payment lifecycle: create, approve, complete.
 * All flows go through the backend which proxies the Pi Platform API.
 */

import { api } from './client';
import type { DonationResponse } from './types';

/**
 * Create a new payment.
 *
 * @param amount — payment amount in Pi
 * @param memo   — optional memo shown to the user in the Pi payment UI
 * @returns Payment ID + Pi Browser URL for confirmation
 * @throws {ApiError} 400 if amount <= 0
 */
export async function createPayment(amount: number, memo?: string): Promise<DonationResponse> {
  const { data } = await api.post<DonationResponse>('/payments', {
    amount,
    memo,
  });
  return data;
}

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
  await api.post<void>(`/payments/${encodeURIComponent(paymentId)}/approve`, {});
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
  await api.post<void>(`/payments/${encodeURIComponent(paymentId)}/complete`, { txid });
}

/**
 * Fetch payment history for the authenticated user.
 *
 * @returns List of payment records
 * @throws {ApiError} 401 if not authenticated
 */
export async function getPaymentHistory(): Promise<unknown[]> {
  const { data } = await api.get<unknown[]>('/payments/history');
  return data;
}

/**
 * Fetch incomplete (pending) payments for the authenticated user.
 *
 * @returns List of incomplete payment records
 * @throws {ApiError} 401 if not authenticated
 */
export async function getIncompletePayments(): Promise<unknown[]> {
  const { data } = await api.get<unknown[]>('/payments/incomplete');
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
  create: createPayment,
  approve: approvePayment,
  complete: completePayment,
  getHistory: getPaymentHistory,
  getIncomplete: getIncompletePayments,
};
