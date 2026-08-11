import { useEffect } from 'react';
import { getMe } from '@/api/users';
import { updateMatchPrefs } from '@/api/dailyMatch';

const SYNCED_KEY = 'equal_match_prefs_synced_for';

/**
 * Seeds the Daily Match pairing inputs from the device.
 *
 * `languages` and `timezone` are matching filters, but nothing in the app ever
 * asked the user for them — so every account sat on an empty language list and
 * the default Europe/Warsaw timezone, which meant matches were scored and
 * scheduled on data nobody had supplied.
 *
 * The browser already knows both, so they are inferred once per user and only
 * for fields the user has not set themselves — a stored language list is never
 * overwritten, so an explicit choice always wins.
 */
export function useMatchPrefsSync(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    // Once per user, not once per mount — this is a write, not a read.
    if (localStorage.getItem(SYNCED_KEY) === userId) return;

    let cancelled = false;

    (async () => {
      try {
        const me = (await getMe()) as unknown as {
          languages?: string[];
          timezone?: string;
        };
        if (cancelled) return;

        const payload: { languages?: string[]; timezone?: string } = {};

        if (!me.languages || me.languages.length === 0) {
          // navigator.languages is ordered by preference; "en-GB" and "en-US"
          // both mean "en" for pairing purposes.
          const detected = Array.from(
            new Set(
              (navigator.languages?.length ? navigator.languages : [navigator.language])
                .filter(Boolean)
                .map((l) => l.split('-')[0].toLowerCase()),
            ),
          ).slice(0, 5);
          if (detected.length > 0) payload.languages = detected;
        }

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Only overwrite the schema default, never a timezone already stored.
        if (tz && (!me.timezone || me.timezone === 'Europe/Warsaw') && tz !== me.timezone) {
          payload.timezone = tz;
        }

        if (Object.keys(payload).length > 0) {
          await updateMatchPrefs(payload);
        }
        localStorage.setItem(SYNCED_KEY, userId);
      } catch {
        // Non-critical: leaving the flag unset means it retries next session.
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);
}
