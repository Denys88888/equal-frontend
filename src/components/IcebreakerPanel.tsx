import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Dices } from 'lucide-react';
import type { DailyMatchIcebreaker } from '@/api/dailyMatch';

/**
 * Icebreaker Roulette.
 *
 * Both sides answer the same question blind; answers only appear once both are
 * in. The hiding is enforced on the server (partnerAnswer arrives as null until
 * reveal), so this component never has the other answer to leak early.
 */
export default function IcebreakerPanel({
  icebreaker,
  partnerName,
  onAnswer,
  onSkip,
}: {
  icebreaker: DailyMatchIcebreaker;
  partnerName: string;
  onAnswer: (answer: string) => Promise<void>;
  onSkip: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  // Both skipped, or the reveal already happened and the chat moved on.
  if (!icebreaker.key) return null;
  if (icebreaker.mySkipped && icebreaker.partnerSkipped) return null;

  const question = t(`dailyMatch.icebreakers.${icebreaker.key}`, { defaultValue: '' });
  if (!question) return null;

  const submit = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      await onAnswer(text);
      setDraft('');
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onSkip();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{ backgroundColor: 'rgba(187,131,201,0.08)', border: '1.5px solid rgba(187,131,201,0.25)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Dices size={16} className="text-[#BB83C9]" />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#BB83C9' }}>
          {t('dailyMatch.icebreakerLabel', { defaultValue: 'Icebreaker' })}
        </span>
      </div>

      <p
        className="text-base font-semibold text-[var(--charcoal)] mb-3"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.4 }}
      >
        {question}
      </p>

      {/* Your answer: input until submitted, then read-only */}
      {icebreaker.myAnswer ? (
        <div className="rounded-xl px-3 py-2 mb-2" style={{ backgroundColor: 'var(--card-bg)' }}>
          <p className="text-[11px] uppercase tracking-wider opacity-40 text-[var(--charcoal)] mb-0.5">
            {t('dailyMatch.yourAnswer', { defaultValue: 'Your answer' })}
          </p>
          <p className="text-sm text-[var(--charcoal)]">{icebreaker.myAnswer}</p>
        </div>
      ) : !icebreaker.mySkipped ? (
        <div className="flex gap-2 mb-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder={t('dailyMatch.yourAnswer', { defaultValue: 'Your answer' })}
            maxLength={500}
            className="flex-1 rounded-xl px-3 h-10 text-sm outline-none border-[1.5px] border-transparent focus:border-[#BB83C9]"
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--charcoal)' }}
          />
          <button
            onClick={submit}
            disabled={!draft.trim() || busy}
            className="px-4 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: '#BB83C9' }}
          >
            {t('dailyMatch.icebreakerSend', { defaultValue: 'Answer' })}
          </button>
        </div>
      ) : null}

      {/* Partner's answer: placeholder until the server reveals it */}
      <AnimatePresence mode="wait">
        {icebreaker.revealed && icebreaker.partnerAnswer ? (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl px-3 py-2"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            <p className="text-[11px] uppercase tracking-wider opacity-40 text-[var(--charcoal)] mb-0.5">
              {partnerName}
            </p>
            <p className="text-sm text-[var(--charcoal)]">{icebreaker.partnerAnswer}</p>
          </motion.div>
        ) : (
          <motion.p
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-center italic text-[var(--charcoal)]/40 py-2"
          >
            {t('dailyMatch.waitingForPartner', { defaultValue: 'Waiting for their answer…' })}
          </motion.p>
        )}
      </AnimatePresence>

      {!icebreaker.mySkipped && !icebreaker.myAnswer && (
        <button
          onClick={skip}
          disabled={busy}
          className="w-full mt-2 text-xs font-medium text-[var(--charcoal)]/45"
        >
          {t('dailyMatch.icebreakerSkip', { defaultValue: 'Skip icebreaker' })}
        </button>
      )}
    </div>
  );
}
