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
  /** Internal payment ID (Prisma UUID) */
  id: string;
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
            // Without this the payment isn't linked to the event, so the RSVP
            // check can't find it and a paid ticket is rejected as unpaid.
            eventId: metadata.eventId,
          },
        );

        // ── 3. Initiate Pi payment ──────────────────────────────
        return new Promise((resolve) => {
          // The SDK re-invokes onReadyForServerApproval / onReadyForServerCompletion
          // roughly every 10s until their timers end, so those callbacks can fire
          // many times. `settle` makes the promise resolve exactly once, and kills
          // the watchdog below.
          let settled = false;
          const settle = (result: PaymentResult) => {
            if (settled) return;
            settled = true;
            clearTimeout(watchdog);
            setIsProcessing(false);
            resolve(result);
          };

          // Pi's approval window is ~60s; if it lapses without onCancel/onError
          // (which is what "Payment Expired" looked like from the app's side),
          // nothing would ever settle this promise and the button would sit on
          // "Processing…" until a reload.
          const watchdog = setTimeout(() => {
            const msg = 'Payment timed out. Please try again.';
            setError(msg);
            settle({ success: false, error: msg });
          }, 150_000);

          window.Pi!.createPayment(
            {
              amount,
              memo,
              metadata: {
                ...metadata,
                paymentIdentifier: serverPayment.id,
              },
            },
            {
              onReadyForServerApproval: async (paymentId: string) => {
                try {
                  await api.post(`/payments/${paymentId}/approve`, {});
                } catch (err) {
                  // Deliberately does NOT settle the promise. Per the SDK
                  // reference, Pi re-invokes this callback roughly every 10s
                  // until the approval timer ends, so a first failure is a
                  // retry, not a verdict — giving up here would kill a payment
                  // that the very next attempt would have approved (a cold
                  // Render backend loses the first request and serves the
                  // second). The watchdog above is what stops a genuine
                  // stall from hanging forever.
                  console.error(
                    `[usePiPayment] approval attempt failed (SDK will retry) piId=${paymentId}:`,
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
                  settle({ success: true, paymentId });
                } catch (err) {
                  // Same retry contract as approval: the SDK keeps calling this
                  // every ~10s until the completion timer ends. Money has
                  // already moved on-chain by now, so failing the payment on a
                  // single flaky request would be the worst possible answer —
                  // log and let the retry land it.
                  console.error(
                    `[usePiPayment] completion attempt failed (SDK will retry) piId=${paymentId}:`,
                    err,
                  );
                }
              },

              onCancel: (paymentId: string) => {
                setError('Payment cancelled');
                settle({
                  success: false,
                  error: 'Payment cancelled',
                  paymentId,
                });
              },

              onError: (error: Error) => {
                setError(error.message);
                settle({ success: false, error: error.message });
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
