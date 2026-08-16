import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Heart, Share2, X, Send } from 'lucide-react';
import Layout from '@/components/Layout';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';
import { askApi, type AskItem } from '@/api/ask';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];
const ACCENT = '#BB83C9';
const MAX_ANSWER = 1000;

type Tab = 'inbox' | 'answered';

/** Answer composer. Kept in-file — it is meaningless outside this screen. */
function AnswerDialog({
  question,
  onClose,
  onAnswered,
}: {
  question: AskItem | null;
  onClose: () => void;
  onAnswered: () => void;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setText(''); }, [question?.id]);

  if (!question) return null;

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await askApi.answer(question.id, text.trim());
      showToast('success', t('ask.answerSent', { defaultValue: 'Answer published!' }));
      onAnswered();
      onClose();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.28, ease: easeOutExpo }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5"
          style={{ backgroundColor: 'var(--card-bg)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3
              className="text-lg font-bold text-[var(--charcoal)]"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {t('ask.answerTitle', { defaultValue: 'Your answer' })}
            </h3>
            <button onClick={onClose} className="text-[var(--charcoal)] opacity-40">
              <X size={20} />
            </button>
          </div>

          <p
            className="text-sm text-[var(--charcoal)] opacity-60 mb-3 leading-snug"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {question.content}
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_ANSWER))}
            placeholder={t('ask.answerPlaceholder', { defaultValue: 'Write your answer…' })}
            rows={5}
            autoFocus
            className="w-full rounded-2xl p-3 resize-none outline-none text-[15px] text-[var(--charcoal)] placeholder:opacity-40"
            style={{
              fontFamily: "'Outfit', system-ui, sans-serif",
              backgroundColor: 'var(--linen)',
              border: '1px solid var(--linen-dark)',
            }}
          />
          <div className="flex items-center justify-between mt-1">
            <span
              className="text-[11px] text-[var(--charcoal)] opacity-40"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {t('ask.rewardHint', { defaultValue: 'Answering earns you a spark' })}
            </span>
            <span
              className="text-[11px] text-[var(--charcoal)] opacity-40 tabular-nums"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              {text.length}/{MAX_ANSWER}
            </span>
          </div>

          <button
            onClick={submit}
            disabled={!text.trim() || saving}
            className="w-full h-12 rounded-full text-white text-[15px] font-semibold flex items-center justify-center gap-2 mt-4"
            style={{
              backgroundColor: text.trim() ? ACCENT : 'var(--linen-dark)',
              color: text.trim() ? '#fff' : 'var(--charcoal)',
              fontFamily: "'Outfit', system-ui, sans-serif",
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Send size={17} /> {saving ? t('ask.sending', { defaultValue: 'Sending…' }) : t('ask.publish', { defaultValue: 'Publish answer' })}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * "My questions" — the two sides of Equal Ask that belong to the signed-in
 * user: what is waiting for an answer, and what they have already published.
 */
export default function MyAsks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { profile } = useAuth();

  const [tab, setTab] = useState<Tab>('inbox');
  const [inbox, setInbox] = useState<AskItem[]>([]);
  const [answered, setAnswered] = useState<AskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState<AskItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [i, a] = await Promise.all([askApi.getInbox(), askApi.getAnswered()]);
      setInbox(i);
      setAnswered(a);
    } catch {
      // Empty state covers the failure — no error screen for an empty inbox.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleReject = async (id: string) => {
    setInbox((prev) => prev.filter((q) => q.id !== id));
    try {
      await askApi.reject(id);
    } catch (e: unknown) {
      void load();
      showToast('error', e instanceof Error ? e.message : String(e));
    }
  };

  const handleShare = async (questionId: string) => {
    const username = profile?.username ?? '';
    const url = `${window.location.origin}/#/u/${encodeURIComponent(username)}?q=${questionId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('success', t('ask.linkCopied', { defaultValue: 'Link copied!' }));
    } catch {
      showToast('error', t('ask.copyFailed', { defaultValue: 'Could not copy the link' }));
    }
  };

  const list = tab === 'inbox' ? inbox : answered;

  return (
    <Layout title={t('ask.myAsks', { defaultValue: 'My questions' })} showBack onBack={() => navigate(-1)}>
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-3">
          {(['inbox', 'answered'] as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 h-10 rounded-full text-sm font-semibold transition-colors"
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                backgroundColor: tab === key ? ACCENT : 'var(--linen-dark)',
                color: tab === key ? '#fff' : 'var(--charcoal)',
              }}
            >
              {key === 'inbox'
                ? `${t('ask.inbox', { defaultValue: 'Incoming' })}${inbox.length ? ` (${inbox.length})` : ''}`
                : t('ask.answeredTab', { defaultValue: 'Answered' })}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="px-5 pt-4">
            <SkeletonLoader variant="card" />
          </div>
        ) : list.length === 0 ? (
          <p
            className="text-sm text-center text-[var(--charcoal)] opacity-50 px-8 py-12"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {tab === 'inbox'
              ? t('ask.noIncoming', { defaultValue: 'No new questions. Share your profile to get some!' })
              : t('ask.noAnswered', { defaultValue: 'You haven’t answered anything yet.' })}
          </p>
        ) : (
          <div className="px-5 mt-4 space-y-3">
            {list.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.24), ease: easeOutExpo }}
                className="rounded-2xl p-4"
                style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--linen-dark)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {q.isUrgent && <Flame size={12} style={{ color: '#E8944A' }} />}
                  <span
                    className="text-[11px] text-[var(--charcoal)] opacity-50"
                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    {q.asker
                      ? t('ask.asks', { defaultValue: `${q.asker.name} asks`, name: q.asker.name })
                      : t('ask.anonymousAsks', { defaultValue: 'Anonymous asks' })}
                    {' · '}
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p
                  className="text-[15px] text-[var(--charcoal)] leading-snug"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {q.content}
                </p>

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

                {tab === 'inbox' ? (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setAnswering(q)}
                      className="flex-1 h-10 rounded-full text-white text-sm font-semibold"
                      style={{ backgroundColor: ACCENT, fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      {t('ask.answer', { defaultValue: 'Answer' })}
                    </button>
                    <button
                      onClick={() => handleReject(q.id)}
                      className="flex-1 h-10 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: 'var(--linen-dark)',
                        color: 'var(--charcoal)',
                        fontFamily: "'Outfit', system-ui, sans-serif",
                      }}
                    >
                      {t('ask.reject', { defaultValue: 'Reject' })}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-3">
                    <span
                      className="flex items-center gap-1.5 text-xs font-medium text-[var(--charcoal)] opacity-50"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      <Heart size={14} /> {q.likes}
                    </span>
                    <button
                      onClick={() => handleShare(q.id)}
                      className="ml-auto flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: ACCENT, fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      <Share2 size={14} /> {t('ask.share', { defaultValue: 'Share' })}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnswerDialog question={answering} onClose={() => setAnswering(null)} onAnswered={load} />
    </Layout>
  );
}
