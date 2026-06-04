import { useState, useCallback } from 'react';
import { api } from '@/api/client';

/**
 * Equal Dating App — Pi Network Payment Hook
 *
 * Encapsulates the full Pi payment lifecycle:
 *   server create → Pi.createPayment → server approve → server complete
 *
 * In development (import.meta.env.DEV), payments are mocked so UI work
 * can proceed without the Pi Browser.
 *
 * @example
 * ```tsx
 * const { initiatePayment, isProcessing, error } = usePiPayment();
 *
 * const handleBuySparks = async () => {
 *   const result = await initiatePayment(
 *     1.0,
 *     '10 Sparks recharge',
 *     { matchId: 'match-123', product: 'sparks_10' }
 *   );
 *   if (result.success) {
 *     toast.success('Payment complete!');
 *   }
 * };
 * ```
 */

// ── Types ──────────────────────────────────────────────
// Pi SDK global types are declared in src/types/pi-sdk.d.ts

/** Server response when creating a payment */
interface ServerPayment {
  /** Internal payment identifier (used as paymentIdentifier in metadata) */
  identifier: string;
}

/** Result shape returned by initiatePayment() */
interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}

// ── Hook ───────────────────────────────────────────────

export function usePiPayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiate a Pi payment for the given amount and memo.
   *
   * @param amount   — Pi amount to charge
   * @param memo     — Description shown to the user in the Pi payment UI
   * @param metadata — Extra data passed through the Pi flow (matchId, product, etc.)
   * @returns        — PaymentResult indicating success/failure
   */
  const initiatePayment = useCallback(
    async (
      amount: number,
      memo: string,
      metadata: Record<string, unknown>,
    ): Promise<PaymentResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        // ── 1. Check if Pi SDK is available ─────────────────────
        if (!window.Pi) {
          if (import.meta.env.DEV) {
            // Mock payment in development
            // eslint-disable-next-line no-console
            console.log('[usePiPayment] MOCK payment in DEV mode', {
              amount,
              memo,
              metadata,
            });
            return { success: true, paymentId: 'mock-payment-id' };
          }
          throw new Error('Pi SDK not available. Open in Pi Browser.');
        }

        // ── 2. Create payment on our server first ───────────────
        const { data: serverPayment } = await api.post<ServerPayment>(
          '/payments',
          {
            amount,
            memo,
            matchId: metadata.matchId,
          },
        );

        // ── 3. Initiate Pi payment ──────────────────────────────
        return new Promise((resolve) => {
          window.Pi!.createPayment(
            {
              amount,
              memo,
              metadata: {
                ...metadata,
                paymentIdentifier: serverPayment.identifier,
              },
            },
            {
              onReadyForServerApproval: async (paymentId: string) => {
                try {
                  await api.post(`/payments/${paymentId}/approve`, {});
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.error(
                    '[usePiPayment] Server approval failed:',
                    err,
                  );
                }
              },

              onReadyForServerCompletion: async (
                paymentId: string,
                txid: string,
              ) => {
                try {
                  await api.post(`/payments/${paymentId}/complete`, { txid });
                  setIsProcessing(false);
                  resolve({ success: true, paymentId });
                } catch (err) {
                  const msg =
                    err instanceof Error
                      ? err.message
                      : 'Completion failed';
                  setError(msg);
                  setIsProcessing(false);
                  resolve({ success: false, error: msg });
                }
              },

              onCancel: (paymentId: string) => {
                setError('Payment cancelled');
                setIsProcessing(false);
                resolve({
                  success: false,
                  error: 'Payment cancelled',
                  paymentId,
                });
              },

              onError: (error: Error) => {
                setError(error.message);
                setIsProcessing(false);
                resolve({ success: false, error: error.message });
              },
            },
          );
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Payment failed';
        setError(msg);
        setIsProcessing(false);
        return { success: false, error: msg };
      }
    },
    [],
  );

  /** Clear the current error state */
  const clearError = useCallback(() => setError(null), []);

  return { initiatePayment, isProcessing, error, clearError };
}
