import { paymentsApi } from './payments';

/** The subset of Pi's PaymentDTO this resolver needs. */
export interface IncompletePaymentDTO {
  identifier: string;
  transaction: { txid: string } | null;
  status: { developer_approved: boolean; developer_completed?: boolean };
}

/**
 * Handler for the SDK's `onIncompletePaymentFound`.
 *
 * Per the Pi SDK reference, an incomplete payment is one already submitted to
 * the blockchain whose `/complete` was never called, and the SDK will refuse to
 * start a NEW payment until it is resolved — so leaving these stranded quietly
 * disables payments for that user.
 *
 * Deliberately fire-and-forget: the SDK invokes this during `Pi.authenticate`,
 * and awaiting our own backend in there means a cold Render instance (free tier,
 * sleeps after inactivity) can stall login behind a request that takes tens of
 * seconds. Kick the resolution off, return immediately, never throw.
 */
export function resolveIncompletePayment(payment: unknown): void {
  const p = payment as IncompletePaymentDTO;
  if (!p?.identifier) return;

  // A payment with a txid is on-chain already: the only correct move is to
  // complete it. Approving is only meaningful for one that never got that far.
  const request = p.transaction?.txid
    ? paymentsApi.complete(p.identifier, p.transaction.txid)
    : paymentsApi.approve(p.identifier);

  void request.catch((e: unknown) => {
    // Silence here is expensive: while this stays unresolved, every subsequent
    // payment the user starts is rejected by the SDK.
    console.error('[pi] could not resolve incomplete payment', p.identifier, e);
  });
}
