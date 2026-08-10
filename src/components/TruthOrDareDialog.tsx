import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { motion } from 'framer-motion';
import { Gamepad2, RefreshCw, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TRUTH_COUNT = 25;
const DARE_COUNT = 25;

export interface TruthOrDareCard {
  type: 'truth' | 'dare';
  key: string;
  text: string;
}

/** Picks a random card, resolving its text from the active locale. */
export function drawCard(t: TFunction): TruthOrDareCard {
  const type: 'truth' | 'dare' = Math.random() < 0.5 ? 'truth' : 'dare';
  const count = type === 'truth' ? TRUTH_COUNT : DARE_COUNT;
  const prefix = type === 'truth' ? 't' : 'd';
  const key = `${prefix}${Math.floor(Math.random() * count) + 1}`;
  return { type, key, text: t(`truthOrDare.${type}.${key}`, { defaultValue: '' }) };
}

/**
 * Truth or Dare. An accepted card is posted into the chat as a SYSTEM message
 * (rendered as a React node by the chat, never as innerHTML).
 */
export default function TruthOrDareDialog({
  open,
  onOpenChange,
  onAccept,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAccept: (card: TruthOrDareCard) => Promise<void> | void;
}) {
  const { t } = useTranslation();
  const [card, setCard] = useState<TruthOrDareCard | null>(null);
  const [busy, setBusy] = useState(false);

  const next = useCallback(() => setCard(drawCard(t)), [t]);

  // Fresh card each time the dialog opens, so reopening isn't a repeat.
  useEffect(() => {
    if (open) setCard(drawCard(t));
  }, [open, t]);

  const accept = async () => {
    if (!card || busy) return;
    setBusy(true);
    try {
      await onAccept(card);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const isTruth = card?.type === 'truth';
  const accent = isTruth ? '#7BC4E8' : '#E86A6A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-2xl border-0" style={{ backgroundColor: 'var(--card-bg)' }}>
        <DialogHeader>
          <DialogTitle
            className="text-lg font-semibold text-[var(--charcoal)] flex items-center gap-2"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            <Gamepad2 size={20} className="text-[#BB83C9]" />
            {t('dailyMatch.truthOrDare', { defaultValue: 'Truth or Dare' })}
          </DialogTitle>
        </DialogHeader>

        {card && (
          <motion.div
            key={`${card.type}-${card.key}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-5 text-center"
            style={{ backgroundColor: `${accent}18`, border: `1.5px solid ${accent}55` }}
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: accent }}
            >
              {isTruth
                ? t('dailyMatch.truth', { defaultValue: 'Truth' })
                : t('dailyMatch.dare', { defaultValue: 'Dare' })}
            </span>
            <p
              className="text-base font-semibold text-[var(--charcoal)] mt-2"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.45 }}
            >
              {card.text}
            </p>
          </motion.div>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={next}
            disabled={busy}
            className="flex-1 h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 border-[1.5px]"
            style={{ borderColor: 'var(--linen-dark)', color: 'var(--charcoal)' }}
          >
            <RefreshCw size={16} />
            {t('dailyMatch.nextCard', { defaultValue: 'Next card' })}
          </button>
          <button
            onClick={accept}
            disabled={busy || !card?.text}
            className="flex-1 h-11 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ backgroundColor: '#BB83C9' }}
          >
            <Check size={16} />
            {t('dailyMatch.accept', { defaultValue: 'Accept' })}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
