import { lazy, type ComponentType } from 'react';
import { reportCrash } from './crashReport';

const RELOADED_AT = 'equal_chunk_reload_at';

/**
 * A screen loaded on demand. Each release renames these files, so a phone
 * that has kept the app open since before a release can no longer fetch the
 * next screen it opens. One reload brings in the new build; a second failure
 * within a minute is a real error and goes to the error page.
 */
export function lazyPage<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  return lazy(() =>
    load().catch((err: unknown) => {
      reportCrash('chunk', err);
      let last = 0;
      try { last = Number(sessionStorage.getItem(RELOADED_AT)) || 0; } catch { /* private mode */ }
      if (Date.now() - last > 60_000) {
        try { sessionStorage.setItem(RELOADED_AT, String(Date.now())); } catch { /* private mode */ }
        window.location.reload();
        // Keep showing the spinner until the reload replaces the page.
        return new Promise<never>(() => {});
      }
      throw err;
    }),
  );
}
