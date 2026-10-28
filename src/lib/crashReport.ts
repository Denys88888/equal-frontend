/**
 * Tells the server what broke on the phone (client_errors on the backend's
 * /v1/health). Pi Browser has no console we can read on a real phone, and a
 * crash there otherwise reaches us as "white screen". A few reports per page
 * load at most, each message once; reporting itself never throws.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
const MAX_REPORTS = 5;
const sent = new Set<string>();

export type CrashKind = 'render' | 'error' | 'rejection' | 'chunk';

function describe(error: unknown): string {
  if (error instanceof Error) {
    // The first frame says where; the rest is noise at 300 characters.
    const frame = error.stack?.split('\n').find((l) => l.includes('/assets/') || l.includes('.js'))?.trim();
    return `${error.name}: ${error.message}${frame ? ` @ ${frame}` : ''}`;
  }
  return String(error);
}

export function reportCrash(kind: CrashKind, error: unknown) {
  try {
    const message = describe(error).slice(0, 2000);
    if (sent.size >= MAX_REPORTS || sent.has(message)) return;
    sent.add(message);
    fetch(`${API_BASE_URL}/client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, message, where: window.location.hash || window.location.pathname }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // nothing to do
  }
}

/** Errors outside React's render: event handlers, effects, promises. */
export function watchCrashes() {
  window.addEventListener('error', (e) => reportCrash('error', e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => reportCrash('rejection', e.reason));
}
