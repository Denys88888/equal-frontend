import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

/**
 * Shown in place of a list's empty state when the fetch actually failed.
 *
 * The distinction matters more than it looks: every list in this app used to
 * fall back to `[]` on error, so "the request failed" and "there is genuinely
 * nothing here" rendered identically. On a moderation queue or a revenue
 * ledger that difference is the whole point of the screen.
 */
export default function LoadErrorNotice({
  onRetry,
  message,
}: {
  onRetry: () => void;
  /** Overrides the generic copy where a screen can be more specific. */
  message?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
      <AlertCircle size={20} style={{ color: '#E86A6A' }} className="mb-2" />
      <p
        className="text-sm text-[var(--charcoal)] opacity-70"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {message ?? t('common.loadFailed', { defaultValue: "Couldn't load this — check your connection." })}
      </p>
      <button
        onClick={onRetry}
        className="mt-2 text-sm font-semibold"
        style={{ color: '#BB83C9', fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {t('common.retry', { defaultValue: 'Retry' })}
      </button>
    </div>
  );
}
