import i18n from 'i18next';

/**
 * Dates and times in the app's language, not the device's.
 *
 * Every screen used to call toLocaleDateString() / toLocaleTimeString() with no
 * locale (or rendered the raw ISO string), so a Russian interface on an English
 * phone showed "06:58 PM" and "Wednesday, Aug 12", and the Matches list and
 * Admin showed "2026-09-28T14:45:44.158Z" verbatim.
 */

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The interface language as an Intl locale ("en", "ru", "fil"…). */
export function appLocale(): string {
  return i18n.resolvedLanguage || i18n.language || 'en';
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 14:05 / 2:05 PM, as the language writes it. */
export function formatTime(value: DateInput): string {
  const d = toDate(value);
  return d ? d.toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' }) : '';
}

/** 12 Aug 2026 by default; pass Intl options for another shape. */
export function formatDate(value: DateInput, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  const d = toDate(value);
  return d ? d.toLocaleDateString(appLocale(), options) : '';
}

/** "Today" / "Yesterday" / "Wednesday, 12 Aug" — for chat day dividers. */
export function formatDayLabel(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '';
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (days === 0) return i18n.t('chat.today');
  if (days === 1) return i18n.t('chat.yesterday');
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(appLocale(), {
    weekday: 'long', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * Compact stamp for a list row: the time today, "Yesterday", the weekday this
 * week, then the date (with the year once it is not this year).
 */
export function formatListStamp(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '';
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (days <= 0) return formatTime(d);
  if (days === 1) return i18n.t('chat.yesterday');
  if (days < 7) return d.toLocaleDateString(appLocale(), { weekday: 'short' });
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(appLocale(), { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}
