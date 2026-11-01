/**
 * Tells the server what broke on the phone (client_errors on the backend's
 * /v1/health). Pi Browser has no console we can read on a real phone, and a
 * crash there otherwise reaches us as "white screen". A few reports per page
 * load at most, each message once; reporting itself never throws.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
const MAX_REPORTS = 5;
const sent = new Set<string>();

export type CrashKind = 'render' | 'error' | 'rejection' | 'chunk' | 'restart';

function describe(error: unknown): string {
  if (error instanceof Error) {
    // The first frame says where; the rest is noise at 300 characters.
    const frame = error.stack?.split('\n').find((l) => l.includes('/assets/') || l.includes('.js'))?.trim();
    return `${error.name}: ${error.message}${frame ? ` @ ${frame}` : ''}`;
  }
  return String(error);
}

export function reportCrash(kind: CrashKind, error: unknown, where?: string) {
  try {
    const message = describe(error).slice(0, 2000);
    if (sent.size >= MAX_REPORTS || sent.has(message)) return;
    sent.add(message);
    fetch(`${API_BASE_URL}/client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, message, where: where ?? (window.location.hash || window.location.pathname) }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // nothing to do
  }
}

const TRAIL_KEY = 'equal_session_trail';
type Trail = { route: string; at: number; clean: boolean };

/**
 * A page the phone kills (out of memory, a crashed WebView) shows a white
 * screen and runs no more code, so nothing above can report it. The app
 * keeps a note of the screen it is on; if the next start finds the note was
 * never closed off — no pagehide, never hidden — the last session died
 * there, and that is reported with the screen it died on.
 */
function watchSession() {
  try {
    const prev = JSON.parse(localStorage.getItem(TRAIL_KEY) ?? 'null') as Trail | null;
    if (prev && !prev.clean && Date.now() - prev.at < 30 * 60_000) {
      const ago = Math.round((Date.now() - prev.at) / 1000);
      reportCrash('restart', new Error(`previous session ended without closing, ${ago}s after it was last seen here`), prev.route);
    }
  } catch { /* storage unavailable */ }
  const note = (clean: boolean) => {
    try {
      localStorage.setItem(TRAIL_KEY, JSON.stringify({ route: window.location.hash || '/', at: Date.now(), clean } satisfies Trail));
    } catch { /* storage unavailable */ }
  };
  note(false);
  window.addEventListener('hashchange', () => note(false));
  setInterval(() => { if (document.visibilityState === 'visible') note(false); }, 5000);
  document.addEventListener('visibilitychange', () => note(document.visibilityState === 'hidden'));
  window.addEventListener('pagehide', () => note(true));
}

/** Errors outside React's render: event handlers, effects, promises — and sessions that died. */
export function watchCrashes() {
  window.addEventListener('error', (e) => reportCrash('error', e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => reportCrash('rejection', e.reason));
  watchSession();
}
