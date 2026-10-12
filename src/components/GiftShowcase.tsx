import { useTranslation } from 'react-i18next';
import GiftAnimation from '@/components/GiftAnimation';
import { GIFTS, type GiftKind } from '@/lib/gifts';

/**
 * Gifts someone has received, by kind ("🌹 ×5 ☕ ×3"), most valuable first.
 * Counts come from the server, which only creates a paid gift once its
 * payment is checked with Pi — so they can't be inflated for free.
 */
export default function GiftShowcase({
  counts,
  emptyHint = false,
  className = '',
}: {
  counts: Partial<Record<GiftKind, number>> | null | undefined;
  /** Own profile: say why the card is empty instead of hiding it. */
  emptyHint?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const items = [...GIFTS].reverse().filter((g) => (counts?.[g.kind] ?? 0) > 0);
  if (items.length === 0 && !emptyHint) return null;

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-[var(--charcoal)] opacity-60 mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
        {t('profile.giftsReceived')}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--charcoal)]/50">{t('profile.noGiftsYet')}</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {items.map((g) => (
            <div
              key={g.kind}
              className="flex-shrink-0 flex flex-col items-center rounded-2xl px-3 py-2"
              style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', minWidth: 72 }}
              title={t(g.nameKey)}
            >
              <GiftAnimation kind={g.kind} size={44} />
              <span className="text-xs font-semibold text-[var(--charcoal)] mt-1 tabular-nums">×{counts?.[g.kind]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
