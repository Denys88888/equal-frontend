/**
 * Equal Dating App — Pi Network SDK Global Type Declarations
 *
 * Consolidated window.Pi types used across the app.
 * The Pi SDK is injected by the Pi Browser environment.
 */

interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string, error?: Error) => void;
  onError: (error: Error, payment?: unknown) => void;
}

declare global {
  interface Window {
    Pi: {
      /** Initialise the Pi SDK with a version string and optional sandbox flag */
      init: (config: { version: string; sandbox?: boolean }) => void;

      /**
       * Authenticate the current Pi user.
       * Must be called after `Pi.init()`.
       */
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: unknown) => void,
      ) => Promise<{
        accessToken: string;
        user: { uid: string; username: string };
      }>;

      /** Start an in-app payment flow */
      createPayment: (
        paymentData: PiPaymentData,
        callbacks: PiPaymentCallbacks,
        options?: { callback?: (paymentId: string) => void },
      ) => void;
    } | undefined;
  }
}

export {};
