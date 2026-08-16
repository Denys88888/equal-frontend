import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Flame, EyeOff, Send, MessageCircleQuestion, Flag } from 'lucide-react';
import { askApi, type AskItem, type AskQuote } from '@/api/ask';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { usePiPayment } from '@/hooks/usePiPayment';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];
const MAX_LEN = 500;
const MIN_LEN = 10;
const ACCENT = '#BB83C9';

/**
 * Equal Ask block on someone else's profile: the "ask me anything" form plus
 * the public feed of answers.
 *
 * The price shown on the button always comes from the server quote — the
 * client never adds up the surcharges itself, so a tampered checkbox can't
 * buy an urgent question for free.
 */
export default function AskSection({
  targetIdOrUsername,
  targetName,
  onCountsChange,
}: {
  targetIdOrUsername: string;
  targetName: string;
  /** Lets the parent profile header show "15 questions · 12 answers". */
  onCountsChange?: (counts: { answered: number; total: number }) => void;
}) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { initiatePayment } = usePiPayment();

  const [items, setItems] = useState<AskItem[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [quote, setQuote] = useState<AskQuote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // ── Feed ────────────────────────────────────────────────

  const loadFeed = useCallback(async () => {
    try {
      const feed = await askApi.getFeed(targetIdOrUsername);
      setItems(feed.questions);
      setAnsweredCount(feed.answeredCount);
      setTotalCount(feed.totalCount);
      onCountsChange?.({ answered: feed.answeredCount, total: feed.totalCount });
    } catch {
      // A profile with no Q&A yet is not an error state — show the empty view.
    } finally {
      setLoading(false);
    }
  }, [targetIdOrUsername, onCountsChange]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  // ── Quote ───────────────────────────────────────────────
  // Re-quoted whenever the paid options change, so the button label is always
  // the amount the server will actually demand.

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    askApi
      .getQuote(targetIdOrUsername, { isAnonymous, isUrgent })
      .then((q) => { if (!cancelled) setQuote(q); })
      .catch(() => { if (!cancelled) setQuote(null); });
    return () => { cancelled = true; };
  }, [targetIdOrUsername, isAnonymous, isUrgent, isAuthenticated]);

  // ── Submit ──────────────────────────────────────────────

  const handleSubmit = async () => {
    const text = content.trim();
    if (text.length < MIN_LEN) {
      // Deliberately `min`, not `count` — `count` would trigger i18next's
      // pluralisation lookup and miss the plain key.
      showToast('error', t('ask.tooShort', { defaultValue: `Please write at least ${MIN_LEN} characters`, min: MIN_LEN }));
      return;
    }
    setSubmitting(true);
    try {
      // Re-quote at submit time: the price can change if another question went
      // out from a second tab since the checkbox was last touched.
      const fresh = await askApi.getQuote(targetIdOrUsername, { isAnonymous, isUrgent });
      setQuote(fresh);

      if (fresh.price > 0) {
        const result = await initiatePayment(fresh.price, fresh.memo, {});
        if (!result.success) {
          if (result.error) showToast('error', result.error);
          setSubmitting(false);
          return;
        }
      }

      await askApi.ask(targetIdOrUsername, { content: text, isAnonymous, isUrgent });
      setContent('');
      setIsUrgent(false);
      setIsAnonymous(false);
      showToast('success', t('ask.sent', { defaultValue: 'Question sent! You’ll be notified when it’s answered.' }));
      void loadFeed();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    if (!isAuthenticated) {
      showToast('error', t('ask.loginToAsk', { defaultValue: 'Log in to ask a question' }));
      return;
    }
    // Optimistic: the server returns the authoritative count right after.
    setItems((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, likes: q.likes + (q.likedByMe ? -1 : 1), likedByMe: !q.likedByMe } : q,
      ),
    );
    try {
      const res = await askApi.like(id);
      setItems((prev) =>
        prev.map((q) => (q.id === id ? { ...q, likes: res.likes, likedByMe: res.likedByMe } : q)),
      );
    } catch (e: unknown) {
      void loadFeed();
      showToast('error', e instanceof Error ? e.message : String(e));
    }
  };

  const handleReport = async (id: string) => {
    try {
      await askApi.report(id);
      showToast('success', t('ask.reported', { defaultValue: 'Reported. We’ll review it shortly.' }));
      void loadFeed();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : String(e));
    }
  };

  const remaining = MAX_LEN - content.length;
  const canSubmit = content.trim().length >= MIN_LEN && !submitting && isAuthenticated;

  const submitLabel = () => {
    if (submitting) return t('ask.sending', { defaultValue: 'Sending…' });
    if (quote && quote.price > 0) {
      return t('ask.submitPaid', { defaultValue: `Send · ${quote.price} Pi`, price: quote.price });
    }
    return t('ask.submit', { defaultValue: 'Send' });
  };

  return (
    <div className="px-5 mt-8" ref={formRef} id="equal-ask">
      {/* Header + counters */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-lg font-bold text-[var(--charcoal)] flex items-center gap-2"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          <MessageCircleQuestion size={20} style={{ color: ACCENT }} />
          {t('ask.title', { defaultValue: 'Equal Ask' })}
        </h3>
        <span
          className="text-xs text-[var(--charcoal)] opacity-50"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('ask.counts', {
            defaultValue: `${totalCount} questions · ${answeredCount} answers`,
            total: totalCount,
            answered: answeredCount,
          })}
        </span>
      </div>

      {/* Ask form */}
      {isAuthenticated ? (
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--linen-dark)' }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
            placeholder={t('ask.placeholder', { defaultValue: 'What would you like to know?' })}
            rows={3}
            className="w-full bg-transparent resize-none outline-none text-[15px] text-[var(--charcoal)] placeholder:opacity-40"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          />
          <div className="flex items-center justify-end">
            <span
              className="text-[11px] tabular-nums"
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                color: remaining < 50 ? '#E86A6A' : 'var(--charcoal)',
                opacity: remaining < 50 ? 1 : 0.4,
              }}
            >
              {content.length}/{MAX_LEN}
            </span>
          </div>

          {/* Paid options */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={() => setIsAnonymous((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                backgroundColor: isAnonymous ? ACCENT : 'var(--linen-dark)',
                color: isAnonymous ? '#fff' : 'var(--charcoal)',
              }}
            >
              <EyeOff size={13} /> {t('ask.anonymous', { defaultValue: 'Anonymous' })}
            </button>
            <button
              type="button"
              onClick={() => setIsUrgent((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                backgroundColor: isUrgent ? '#E8944A' : 'var(--linen-dark)',
                color: isUrgent ? '#fff' : 'var(--charcoal)',
              }}
            >
              <Flame size={13} /> {t('ask.urgent', { defaultValue: 'Urgent (0.2 Pi)' })}
            </button>
          </div>

          {/* Price line — server-quoted, never computed here */}
          {quote && (
            <p
              className="text-[11px] mt-2.5 text-[var(--charcoal)] opacity-60"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {quote.free
                ? t('ask.freeToday', { defaultValue: 'Your free question for today' })
                : t('ask.limitReached', {
                    defaultValue: `Limit: 1 question/day. This one costs ${quote.price} Pi`,
                    price: quote.price,
                  })}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 rounded-full text-white text-[15px] font-semibold flex items-center justify-center gap-2 mt-3"
            style={{
              backgroundColor: canSubmit ? ACCENT : 'var(--linen-dark)',
              color: canSubmit ? '#fff' : 'var(--charcoal)',
              boxShadow: canSubmit ? '0 4px 16px rgba(187,131,201,0.4)' : 'none',
              fontFamily: "'Outfit', system-ui, sans-serif",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            <Send size={17} /> {submitLabel()}
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--linen-dark)' }}
        >
          <p
            className="text-sm text-[var(--charcoal)] opacity-70"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {t('ask.loginToAsk', { defaultValue: 'Log in to ask a question' })}
          </p>
        </div>
      )}

      {/* Feed */}
      <div className="mt-5 space-y-3">
        {loading ? null : items.length === 0 ? (
          <p
            className="text-sm text-center text-[var(--charcoal)] opacity-50 py-6"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {t('ask.noQuestions', { defaultValue: 'No questions yet. Be the first!' })}
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.2), ease: easeOutExpo }}
                className="rounded-2xl p-4"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--linen-dark)' }}
              >
                {/* Question */}
                <div className="flex items-center gap-2 mb-1.5">
                  {q.isUrgent && <Flame size={12} style={{ color: '#E8944A' }} />}
                  <span
                    className="text-[11px] text-[var(--charcoal)] opacity-50"
                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    {q.asker
                      ? t('ask.asks', { defaultValue: `${q.asker.name} asks`, name: q.asker.name })
                      : t('ask.anonymousAsks', { defaultValue: 'Anonymous asks' })}
                  </span>
                </div>
                <p
                  className="text-sm text-[var(--charcoal)] opacity-70 leading-snug"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {q.content}
                </p>

                {/* Answer bubble */}
                {q.answer && (
                  <div
                    className="mt-3 rounded-2xl rounded-tl-md px-4 py-3"
                    style={{ backgroundColor: 'rgba(187,131,201,0.12)' }}
                  >
                    <p
                      className="text-[15px] text-[var(--charcoal)] leading-relaxed"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.55 }}
                    >
                      {q.answer}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => handleLike(q.id)}
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{
                      fontFamily: "'Outfit', system-ui, sans-serif",
                      color: q.likedByMe ? ACCENT : 'var(--charcoal)',
                      opacity: q.likedByMe ? 1 : 0.5,
                    }}
                  >
                    <Heart size={14} fill={q.likedByMe ? ACCENT : 'none'} /> {q.likes}
                  </button>
                  {q.answeredAt && (
                    <span
                      className="text-[11px] text-[var(--charcoal)] opacity-40"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      {new Date(q.answeredAt).toLocaleDateString()}
                    </span>
                  )}
                  {isAuthenticated && (
                    <button
                      onClick={() => handleReport(q.id)}
                      className="ml-auto text-[var(--charcoal)] opacity-30 hover:opacity-60 transition-opacity"
                      aria-label={t('ask.report', { defaultValue: 'Report' })}
                    >
                      <Flag size={13} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <p className="sr-only">{targetName}</p>
    </div>
  );
}
