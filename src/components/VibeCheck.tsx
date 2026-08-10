import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Brain, Flame, MessageCircle, Moon } from 'lucide-react';
import type { Vibe } from '@/api/dailyMatch';

const VIBES: { key: Vibe; icon: typeof Brain; color: string }[] = [
  { key: 'deep', icon: Brain, color: '#BB83C9' },
  { key: 'flirt', icon: Flame, color: '#E86A6A' },
  { key: 'chat', icon: MessageCircle, color: '#7BC4E8' },
  { key: 'quiet', icon: Moon, color: '#7DE0B3' },
];

/**
 * Today's vibe. Matching gives a +50 score bonus when both sides picked the
 * same one, so this is a real input to pairing rather than decoration.
 */
export default function VibeCheck({
  current,
  matchTime,
  onSelect,
  saving,
}: {
  current: Vibe | null;
  matchTime: string;
  onSelect: (vibe: Vibe) => void;
  saving?: boolean;
}) {
  const { t } = useTranslation();

  if (current) {
    return (
      <div
        className="rounded-2xl p-4 text-center"
        style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      >
        <p className="text-sm text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {t('dailyMatch.vibeSaved', {
            vibe: t(`dailyMatch.vibes.${current}`, { defaultValue: current }),
            time: matchTime,
            defaultValue: `Today you're in the mood for ${current}. Your Daily Match arrives at ${matchTime}!`,
          })}
        </p>
        <button
          onClick={() => onSelect(current)}
          className="mt-3 text-xs font-semibold"
          style={{ color: '#BB83C9' }}
        >
          {t('dailyMatch.vibeChange', { defaultValue: 'Change vibe' })}
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <h3
        className="text-sm font-semibold text-[var(--charcoal)] mb-3 text-center"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {t('dailyMatch.vibeTitle', { defaultValue: "What's your vibe today?" })}
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {VIBES.map(({ key, icon: Icon, color }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.97 }}
            disabled={saving}
            onClick={() => onSelect(key)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl py-5 border-[1.5px]"
            style={{ borderColor: 'var(--linen-dark)', backgroundColor: 'var(--card-bg)', opacity: saving ? 0.6 : 1 }}
          >
            <Icon size={26} style={{ color }} />
            <span
              className="text-sm font-semibold text-[var(--charcoal)] text-center px-2"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {t(`dailyMatch.vibes.${key}`, { defaultValue: key })}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
