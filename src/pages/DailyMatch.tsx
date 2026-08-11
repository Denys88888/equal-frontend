import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  MessageCircle, SkipForward, Play, ShieldCheck, Star, Clock,
  Send, Gamepad2, HeartCrack, Heart, Sparkles, Mic,
} from 'lucide-react';
import Layout from '@/components/Layout';
import SkeletonLoader from '@/components/SkeletonLoader';
import IcebreakerPanel from '@/components/IcebreakerPanel';
import VibeCheck from '@/components/VibeCheck';
import VoiceIntroRecorder from '@/components/VoiceIntroRecorder';
import TruthOrDareDialog, { type TruthOrDareCard } from '@/components/TruthOrDareDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { getMe } from '@/api/users';
import { useToast } from '@/hooks/useToast';
import { usePiPayment } from '@/hooks/usePiPayment';
import { useDailySocket, type IncomingDailyMessage } from '@/hooks/useSocket';
import {
  getDailyMatch, getDailyMessages, sendDailyMessage, skipDailyMatch, logDailyMatchView,
  answerIcebreaker, skipIcebreaker, claimExtraMatch, getMyVibe, setMyVibe,
  type DailyMatch as DailyMatchModel, type DailyMatchMessage, type Vibe,
} from '@/api/dailyMatch';

const EXTRA_MATCH_PRICE = 0.2;
/** Composer cap: roughly three lines at the current font size. */
const TEXTAREA_MAX_H = 92;
/** Must match EXTRA_MATCH_MEMO on the server — it verifies the payment by memo. */
const EXTRA_MATCH_MEMO = 'Extra Daily Match';

/** "23:41" from a millisecond remainder. */
function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function celebrate() {
  const colors = ['#BB83C9', '#7DE0B3', '#7BC4E8', '#FFD700'];
  confetti({ particleCount: 80, spread: 90, origin: { y: 0.55 }, colors, shapes: ['circle', 'star'] });
}

export default function DailyMatchPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { initiatePayment } = usePiPayment();

  const [match, setMatch] = useState<DailyMatchModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<DailyMatchMessage[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showTruthOrDare, setShowTruthOrDare] = useState(false);
  const [buyingExtra, setBuyingExtra] = useState(false);
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [savingVibe, setSavingVibe] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Grow the composer with its content, capped at three lines. */
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    // Reset first: scrollHeight only shrinks if the box isn't already tall.
    el.style.height = '44px';
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_H)}px`;
  }, []);

  // Real per-user delivery time. Was hardcoded '15:00', which is only the
  // schema default — anyone who changed it was told the wrong time everywhere
  // it appears ("new match tomorrow at …", the vibe confirmation).
  const [matchTime, setMatchTime] = useState('15:00');
  // null = not known yet; false is a hard gate, so don't accuse the user of
  // missing a voice intro before the profile has actually loaded.
  const [hasVoiceIntro, setHasVoiceIntro] = useState<boolean | null>(null);

  // ── Load ────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      const data = await getDailyMatch();
      setMatch(data);
      if (data) {
        setRemaining(data.expiresInMs);
        logDailyMatchView(data.id).catch(() => {});
        const history = await getDailyMessages(data.id);
        setMessages(history.messages);
      }
    } catch {
      // A failed load must not masquerade as "no match today" — leaving match
      // null would show the wrong empty state, so surface it instead.
      showToast('error', t('common.loadFailed', { defaultValue: 'Could not load your match' }));
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getMyVibe().then((v) => setVibe(v.vibe)).catch(() => {});
    getMe()
      .then((me) => {
        const profile = me as unknown as { dailyMatchTime?: string; voiceIntroUrl?: string | null };
        if (profile.dailyMatchTime) setMatchTime(profile.dailyMatchTime);
        setHasVoiceIntro(!!profile.voiceIntroUrl);
      })
      .catch(() => {});
  }, []);

  // Live countdown; MUTUAL chats never expire so the timer stops mattering.
  useEffect(() => {
    if (!match || match.status !== 'ACTIVE') return;
    const tick = setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, prev - 1000);
        if (next === 0) load();
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [match, load]);

  useEffect(() => {
    if (match?.status === 'MUTUAL' && !celebrated) {
      setCelebrated(true);
      celebrate();
    }
  }, [match?.status, celebrated]);

  // ── Realtime ────────────────────────────────────────

  const onIncoming = useCallback((msg: IncomingDailyMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, {
      id: msg.id, senderId: msg.senderId, content: msg.content, kind: msg.kind, createdAt: msg.createdAt,
    }]));
  }, []);

  const onReveal = useCallback(() => { load(); }, [load]);

  useDailySocket(match?.id, onIncoming, onReveal);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatOpen]);

  // ── Actions ─────────────────────────────────────────

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !match || sending) return;
    setSending(true);
    setDraft('');
    // Collapse the grown composer back to one line along with the text.
    requestAnimationFrame(autoResize);
    try {
      const saved = await sendDailyMessage(match.id, text);
      setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
    } catch (err) {
      setDraft(text);
      // The server throttles this route to 1 message / 5s. A generic "could not
      // send" reads as a failure the user can't act on; naming the limit tells
      // them the message is fine and they just need a moment.
      const status = (err as { status?: number })?.status;
      showToast(
        'error',
        status === 429
          ? t('dailyMatch.tooFast', { defaultValue: 'Too fast — wait 5 seconds.' })
          : t('chat.sendFailed', { defaultValue: 'Could not send message' }),
      );
    } finally {
      setSending(false);
    }
  };

  const handleSkip = async () => {
    if (!match) return;
    setShowSkipConfirm(false);
    try {
      await skipDailyMatch(match.id);
      await load();
    } catch {
      showToast('error', t('admin.actionFailed', { defaultValue: 'Action failed' }));
    }
  };

  const handleIcebreakerAnswer = async (answer: string) => {
    if (!match) return;
    try {
      const updated = await answerIcebreaker(match.id, answer);
      setMatch(updated);
    } catch {
      showToast('error', t('admin.actionFailed', { defaultValue: 'Action failed' }));
    }
  };

  const handleIcebreakerSkip = async () => {
    if (!match) return;
    try {
      const updated = await skipIcebreaker(match.id);
      setMatch(updated);
    } catch {
      showToast('error', t('admin.actionFailed', { defaultValue: 'Action failed' }));
    }
  };

  const handleTruthOrDare = async (card: TruthOrDareCard) => {
    if (!match) return;
    const label = card.type === 'truth'
      ? t('dailyMatch.truth', { defaultValue: 'Truth' })
      : t('dailyMatch.dare', { defaultValue: 'Dare' });
    try {
      const saved = await sendDailyMessage(match.id, `${label}: ${card.text}`, 'SYSTEM');
      setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
    } catch {
      showToast('error', t('chat.sendFailed', { defaultValue: 'Could not send message' }));
    }
  };

  const handleBuyExtra = async () => {
    if (buyingExtra) return;
    setBuyingExtra(true);
    try {
      // The Pi payment must clear before the server hands out a match.
      const result = await initiatePayment(EXTRA_MATCH_PRICE, EXTRA_MATCH_MEMO, {});
      if (!result.success) return;
      const fresh = await claimExtraMatch();
      setMatch(fresh);
      setRemaining(fresh.expiresInMs);
      setMessages([]);
      setChatOpen(false);
      celebrate();
    } catch {
      showToast('error', t('dailyMatch.extraFailed', { defaultValue: 'No one available right now — try again later' }));
    } finally {
      setBuyingExtra(false);
    }
  };

  const handleVibe = async (next: Vibe) => {
    setSavingVibe(true);
    try {
      // Tapping the current vibe means "let me change it" — clear locally so
      // the picker comes back instead of re-saving the same value.
      if (vibe === next) {
        setVibe(null);
        return;
      }
      await setMyVibe(next);
      setVibe(next);
    } catch {
      showToast('error', t('admin.actionFailed', { defaultValue: 'Action failed' }));
    } finally {
      setSavingVibe(false);
    }
  };

  // ── Render ──────────────────────────────────────────

  if (loading) {
    return (
      <Layout title={t('dailyMatch.title', { defaultValue: 'Daily Match' })} showNotifications>
        <div className="px-5 pt-5"><SkeletonLoader variant="card" /></div>
      </Layout>
    );
  }

  const isTerminal = !match || match.status === 'EXPIRED' || match.status === 'REJECTED';

  return (
    <Layout title={t('dailyMatch.title', { defaultValue: 'Daily Match' })} showNotifications>
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-4">
        {/* A profile with no voice intro is excluded from matching server-side.
            Without saying so here, a new user would just see "no match yet"
            forever with nothing indicating why or what to do about it. */}
        {hasVoiceIntro === false && (
          <>
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ backgroundColor: 'rgba(240,184,74,0.12)', border: '1.5px solid rgba(240,184,74,0.35)' }}
            >
              <Mic size={18} className="text-[#B8860B] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--charcoal)]" style={{ lineHeight: 1.5 }}>
                {t('dailyMatch.voiceGate', {
                  defaultValue: 'Record a voice intro to join Daily Match — profiles without one are not matched.',
                })}
              </p>
            </div>
            <VoiceIntroRecorder onSaved={() => { setHasVoiceIntro(true); load(); }} />
          </>
        )}

        <VibeCheck current={vibe} matchTime={matchTime} onSelect={handleVibe} saving={savingVibe} />

        {isTerminal && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(232,106,106,0.14)' }}>
              <HeartCrack size={28} className="text-[#E86A6A]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--charcoal)]"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {match?.status === 'REJECTED'
                ? t('dailyMatch.rejectedTitle', { defaultValue: 'You skipped this match' })
                : match?.status === 'EXPIRED'
                  ? t('dailyMatch.expiredTitle', { defaultValue: 'Match expired' })
                  : t('dailyMatch.noMatchTitle', { defaultValue: 'No match yet' })}
            </h2>
            <p className="text-sm text-[var(--charcoal)]/55 mt-1.5">
              {match?.status === 'REJECTED'
                ? t('dailyMatch.rejectedBody', { defaultValue: 'Your new match arrives tomorrow' })
                : t('dailyMatch.expiredBody', { time: matchTime, defaultValue: `Your new match arrives tomorrow at ${matchTime}` })}
            </p>
            <button
              onClick={handleBuyExtra}
              disabled={buyingExtra}
              className="w-full mt-5 h-12 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: '#BB83C9' }}
            >
              <Sparkles size={16} />
              {t('dailyMatch.extraMatch', { price: EXTRA_MATCH_PRICE, defaultValue: `Extra match (${EXTRA_MATCH_PRICE} Pi)` })}
            </button>
          </div>
        )}

        {match && !isTerminal && !chatOpen && (
          <MatchCard
            match={match}
            remaining={remaining}
            audioRef={audioRef}
            onStartChat={() => setChatOpen(true)}
            onSkip={() => setShowSkipConfirm(true)}
          />
        )}

        {match && !isTerminal && chatOpen && (
          <div className="flex flex-col" style={{ minHeight: '60vh' }}>
            {match.status === 'MUTUAL' ? (
              <div className="rounded-2xl p-4 mb-3 text-center"
                style={{ backgroundColor: 'rgba(125,224,179,0.14)', border: '1.5px solid rgba(125,224,179,0.4)' }}>
                <Heart size={22} className="mx-auto mb-1 text-[#5BC492]" fill="#7DE0B3" />
                <p className="text-sm font-semibold text-[var(--charcoal)]">
                  {t('dailyMatch.mutualTitle', { defaultValue: 'Match unlocked!' })}
                </p>
                <p className="text-xs text-[var(--charcoal)]/55 mt-0.5">
                  {t('dailyMatch.mutualBody', { defaultValue: 'You both wrote — this chat stays open forever' })}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-3 py-2 rounded-xl"
                style={{ backgroundColor: 'rgba(240,184,74,0.12)' }}>
                <Clock size={15} className="text-[#F0B84A]" />
                <span className="text-sm font-semibold" style={{ color: '#B8860B' }}>
                  {t('dailyMatch.timeLeft', { defaultValue: 'Time left' })}: {formatCountdown(remaining)}
                </span>
              </div>
            )}

            <IcebreakerPanel
              icebreaker={match.icebreaker}
              partnerName={match.partner.name}
              onAnswer={handleIcebreakerAnswer}
              onSkip={handleIcebreakerSkip}
            />

            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 mb-3" style={{ maxHeight: '45vh' }}>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} isMine={m.senderId === user?.id} />
              ))}
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowTruthOrDare(true)}
                aria-label={t('dailyMatch.truthOrDare', { defaultValue: 'Truth or Dare' })}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(187,131,201,0.14)' }}
              >
                <Gamepad2 size={19} className="text-[#BB83C9]" />
              </button>
              <textarea
                value={draft}
                ref={textareaRef}
                onChange={(e) => { setDraft(e.target.value); autoResize(); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                rows={1}
                maxLength={2000}
                placeholder={t('dailyMatch.typeMessage', { defaultValue: 'Write a message…' })}
                className="flex-1 rounded-2xl px-4 py-2.5 text-base outline-none resize-none border-[1.5px] border-transparent focus:border-[#BB83C9]"
                style={{ backgroundColor: 'var(--card-bg)', color: 'var(--charcoal)', height: 44, maxHeight: TEXTAREA_MAX_H }}
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                aria-label={t('dailyMatch.send', { defaultValue: 'Send' })}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                style={{ backgroundColor: '#BB83C9' }}
              >
                <Send size={18} color="#fff" />
              </button>
            </div>
            <p className="text-[11px] text-center text-[var(--charcoal)]/35 mt-2">
              {t('dailyMatch.textOnly', { defaultValue: 'Daily Match chat is text only' })}
            </p>
          </div>
        )}
      </div>

      <Dialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <DialogContent className="max-w-[320px] rounded-2xl border-0" style={{ backgroundColor: 'var(--card-bg)' }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[var(--charcoal)]"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {t('dailyMatch.skipConfirmTitle', { defaultValue: 'Skip this match?' })}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--charcoal)]/60">
            {t('dailyMatch.skipConfirmBody', { defaultValue: "You'll get a new match tomorrow. This one won't come back." })}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowSkipConfirm(false)}
              className="flex-1 h-11 rounded-full text-sm font-semibold border-[1.5px]"
              style={{ borderColor: 'var(--linen-dark)', color: 'var(--charcoal)' }}
            >
              {t('dailyMatch.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 h-11 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: '#E86A6A' }}
            >
              {t('dailyMatch.skipConfirmYes', { defaultValue: 'Yes, skip' })}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <TruthOrDareDialog
        open={showTruthOrDare}
        onOpenChange={setShowTruthOrDare}
        onAccept={handleTruthOrDare}
      />
    </Layout>
  );
}

// ── Sub-components ────────────────────────────────────

function MatchCard({
  match, remaining, audioRef, onStartChat, onSkip,
}: {
  match: DailyMatchModel;
  remaining: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onStartChat: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const p = match.partner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[20px] overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
    >
      {p.avatar ? (
        <img src={p.avatar} alt={p.name} className="w-full object-cover" style={{ aspectRatio: '4/5' }} />
      ) : (
        <div className="w-full flex items-center justify-center"
          style={{ aspectRatio: '4/5', background: 'linear-gradient(135deg, #BB83C9, #7BC4E8)' }}>
          <span className="text-6xl font-bold text-white">{p.name.slice(0, 1).toUpperCase()}</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-semibold text-[var(--charcoal)]"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.5px' }}>
            {p.name}{p.age ? `, ${p.age}` : ''}
          </h2>
          {p.verified && <ShieldCheck size={17} className="text-[#5BC492]" />}
          <span className="flex items-center gap-0.5 text-xs" style={{ color: '#F0B84A' }}>
            <Star size={13} fill="#F0B84A" />
            {Math.round(p.reputation / 20)}
          </span>
        </div>

        {p.city && <p className="text-sm text-[var(--charcoal)]/45 mt-0.5">{p.city}</p>}
        {p.bio && <p className="text-sm text-[var(--charcoal)]/70 mt-2" style={{ lineHeight: 1.5 }}>{p.bio}</p>}

        {p.languages.length > 0 && (
          <p className="text-xs text-[var(--charcoal)]/45 mt-2">
            {t('dailyMatch.languages', { defaultValue: 'Languages' })}: {p.languages.join(', ')}
          </p>
        )}

        {p.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {p.interests.slice(0, 8).map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(187,131,201,0.12)', color: '#9A63A8' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {p.voiceIntroUrl && (
          <>
            <button
              onClick={() => audioRef.current?.play()}
              className="w-full mt-3 h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 border-[1.5px]"
              style={{ borderColor: 'var(--linen-dark)', color: 'var(--charcoal)' }}
            >
              <Play size={16} />
              {t('dailyMatch.listenVoice', { defaultValue: 'Listen to voice' })}
            </button>
            <audio ref={audioRef} src={p.voiceIntroUrl} preload="none" />
          </>
        )}

        {match.status === 'ACTIVE' && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <Clock size={14} className="text-[#F0B84A]" />
            <span className="text-xs font-semibold" style={{ color: '#B8860B' }}>
              {t('dailyMatch.timeLeft', { defaultValue: 'Time left' })}: {formatCountdown(remaining)}
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onSkip}
            className="flex-1 h-12 rounded-full text-sm font-semibold flex items-center justify-center gap-2 border-[1.5px]"
            style={{ borderColor: 'var(--linen-dark)', color: 'var(--charcoal)' }}
          >
            <SkipForward size={16} />
            {t('dailyMatch.skip', { defaultValue: 'Skip' })}
          </button>
          <button
            onClick={onStartChat}
            className="flex-[2] h-12 rounded-full text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.3)' }}
          >
            <MessageCircle size={16} />
            {t('dailyMatch.startChat', { defaultValue: 'Start chatting' })}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({ message, isMine }: { message: DailyMatchMessage; isMine: boolean }) {
  // Truth or Dare cards arrive as SYSTEM and render as a neutral centered
  // plaque — a React node, never innerHTML.
  if (message.kind === 'SYSTEM') {
    return (
      <div className="flex justify-center">
        <div className="rounded-xl px-3 py-2 max-w-[85%] text-center"
          style={{ backgroundColor: 'rgba(var(--charcoal-rgb), 0.06)' }}>
          <span className="text-xs text-[var(--charcoal)]/65" style={{ lineHeight: 1.45 }}>
            {message.content}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className="rounded-2xl px-3.5 py-2 max-w-[78%]"
        style={{
          backgroundColor: isMine ? '#BB83C9' : 'var(--card-bg)',
          color: isMine ? '#fff' : 'var(--charcoal)',
          boxShadow: isMine ? 'none' : '0 1px 6px rgba(0,0,0,0.05)',
        }}
      >
        <span className="text-sm" style={{ lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{message.content}</span>
      </div>
    </div>
  );
}
