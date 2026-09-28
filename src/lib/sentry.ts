import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_PI_SANDBOX === 'true' ? 'sandbox' : 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
      // Session replays of a dating app would otherwise record private chats,
      // names and photos verbatim; mask text and block media by default.
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  });
}

export { Sentry };
