import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircleQuestion, ChevronRight } from 'lucide-react';
import { askApi } from '@/api/ask';

const ACCENT = '#BB83C9';

/**
 * Compact Equal Ask entry point.
 *
 * On your own profile it counts what is waiting for you and opens the inbox;
 * on someone else's it scrolls down to the ask form rather than navigating
 * away from the profile you are reading.
 */
export default function AskWidget({
  targetIdOrUsername,
  variant,
}: {
  targetIdOrUsername: string;
  variant: 'self' | 'public';
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [answered, setAnswered] = useState(0);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;
    askApi
      .getFeed(targetIdOrUsername)
      .then((feed) => {
        if (cancelled) return;
        setAnswered(feed.answeredCount);
        setTotal(feed.totalCount);
      })
      .catch(() => {});

    if (variant === 'self') {
      askApi
        .getInbox()
        .then((rows) => { if (!cancelled) setPending(rows.length); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [targetIdOrUsername, variant]);

  const handleClick = () => {
    if (variant === 'self') {
      navigate('/my-asks');
      return;
    }
    document.getElementById('equal-ask')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--linen-dark)' }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: 'rgba(187,131,201,0.14)' }}
      >
        <MessageCircleQuestion size={18} style={{ color: ACCENT }} />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span
            className="text-[15px] font-semibold text-[var(--charcoal)]"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {t('ask.title', { defaultValue: 'Equal Ask' })}
          </span>
          {variant === 'self' && pending > 0 && (
            <span
              className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: '#E8944A', fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {pending}
            </span>
          )}
        </div>
        <span
          className="text-xs text-[var(--charcoal)] opacity-50"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('ask.counts', {
            defaultValue: `${total} questions · ${answered} answers`,
            total,
            answered,
          })}
        </span>
      </div>
      <span
        className="text-xs font-semibold shrink-0"
        style={{ color: ACCENT, fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {variant === 'self'
          ? t('ask.myAsks', { defaultValue: 'My questions' })
          : t('ask.askButton', { defaultValue: 'Ask a question' })}
      </span>
      <ChevronRight size={16} className="text-[var(--charcoal)] opacity-30 shrink-0" />
    </motion.button>
  );
}
