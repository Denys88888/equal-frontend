import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateSettings } from '@/api/users';

const SYNCED_KEY = 'equal_locale_synced';

/**
 * Tells the server which language the interface is in, so push notifications
 * arrive in it. They used to be written in whatever language each backend
 * author used — English for matches and messages, Russian for Daily Match —
 * whatever the reader's language.
 *
 * Sent after sign-in and whenever the language changes; the last value sent
 * for this user is remembered so an ordinary reload costs no request.
 */
export function useLocaleSync(userId: string | undefined) {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language;

  useEffect(() => {
    if (!userId || !locale) return;
    const marker = `${userId}:${locale}`;
    let already: string | null = null;
    try { already = localStorage.getItem(SYNCED_KEY); } catch { /* storage blocked */ }
    if (already === marker) return;

    updateSettings({ locale })
      .then(() => { try { localStorage.setItem(SYNCED_KEY, marker); } catch { /* storage blocked */ } })
      // Non-critical: unset marker means it retries on the next launch.
      .catch(() => {});
  }, [userId, locale]);
}
