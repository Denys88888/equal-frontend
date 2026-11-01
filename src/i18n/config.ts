import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';

// Every other language is its own small file, fetched only for the language
// in use: all 35 used to sit in the main bundle — 1.9 MB of translations that
// every visitor downloaded before the first screen, to read one of them.
// English stays built in as the fallback for missing keys.
const loaders = import.meta.glob<{ default: Record<string, unknown> }>(['./locales/*.json', '!./locales/en.json']);

/** Codes of every language with a translation file. */
export const AVAILABLE_LANGUAGES = ['en', ...Object.keys(loaders).map((path) => path.slice('./locales/'.length, -'.json'.length))];

const localeFiles = {
  type: 'backend' as const,
  init() {},
  read(language: string, _namespace: string, done: (err: unknown, data?: Record<string, unknown> | boolean) => void) {
    if (language === 'en') return done(null, en);
    const load = loaders[`./locales/${language}.json`];
    // A language without a file shows English, as before.
    if (!load) return done(null, {});
    load().then((m) => done(null, m.default), (err) => done(err, false));
  },
};

/**
 * Languages written right-to-left. Without `dir="rtl"` on the document the
 * Arabic, Hebrew and Persian text renders inside a left-to-right layout:
 * punctuation lands on the wrong side, and rows built with flex-start read
 * backwards. The translations alone are not enough to make those locales usable.
 */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi']);

/** Point the document at the active language, for both direction and `:lang()`. */
function applyDirection(lng: string | undefined): void {
  const base = (lng ?? 'en').split('-')[0];
  const root = document.documentElement;
  root.lang = base;
  root.dir = RTL_LANGUAGES.has(base) ? 'rtl' : 'ltr';
}

/** Settles once the language in use has loaded (or failed to — English then). */
export const i18nReady = i18n
  .use(localeFiles)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    partialBundledLanguages: true,
    // Screens render once the language has arrived (main.tsx waits for it);
    // re-render when a file loads late or after a switch in Settings.
    react: { useSuspense: false, bindI18n: 'languageChanged loaded' },
    fallbackLng: 'en',
    lng: undefined,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng: string) => lng.split('-')[0],
    },
  });

// Once for the detected language, then again whenever the user switches.
applyDirection(i18n.resolvedLanguage ?? i18n.language);
i18n.on('languageChanged', applyDirection);

export default i18n;
