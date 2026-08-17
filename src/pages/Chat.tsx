import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Video,
  MoreVertical,
  Gift,
  Mic,
  Send,
  Play,
  Pause,
  UserX,
  Flag,
  BellOff,
  User,
  CheckCheck,
  Coffee,
  Music,
  Sparkles,
  Rose,
  Image as ImageIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import ReportDialog from '@/components/ReportDialog';
import SkeletonLoader from '@/components/SkeletonLoader';
import { messagesApi } from '@/api/messages';
import { api } from '@/api/client';
import type { Message as ApiMessage } from '@/api/types';
import { useSocket, type IncomingMessage } from '@/hooks/useSocket';
import { useAuth } from '@/context/AuthContext';
import { usePiPayment } from '@/hooks/usePiPayment';

// ── Types ────────────────────────────────────────────────

type MessageType = 'TEXT' | 'VOICE' | 'IMAGE' | 'GIFT' | 'SYSTEM';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  sender: 'me' | 'them';
  timestamp: Date;
  duration?: string;
  giftType?: 'coffee' | 'rose' | 'song' | 'spark';
  giftPrice?: string;
  read?: boolean;
}


// ── Helpers ──────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === d.toDateString();
  if (isToday) return i18next.t('chat.today');
  if (isYesterday) return i18next.t('chat.yesterday');
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupMessagesByDate(messages: Message[]): { date: string; items: Message[] }[] {
  const groups: { date: string; items: Message[] }[] = [];
  let currentDate = '';
  let currentItems: Message[] = [];

  messages.forEach((msg) => {
    const dateStr = formatDateDivider(msg.timestamp);
    if (dateStr !== currentDate) {
      if (currentItems.length > 0) groups.push({ date: currentDate, items: currentItems });
      currentDate = dateStr;
      currentItems = [msg];
    } else {
      currentItems.push(msg);
    }
  });
  if (currentItems.length > 0) groups.push({ date: currentDate, items: currentItems });
  return groups;
}

// ── TypingIndicator ──────────────────────────────────────

const TypingDot = React.memo(function TypingDot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--charcoal)]"
      style={{ opacity: 0.35, margin: '0 2px' }}
      animate={{ scale: [0.4, 1, 0.4] }}
      transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
});

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="inline-flex items-center px-3 py-2 rounded-full" style={{ backgroundColor: 'var(--linen-dark)' }}>
        <TypingDot delay={0} />
        <TypingDot delay={0.15} />
        <TypingDot delay={0.3} />
      </div>
    </div>
  );
}

// ── GiftIcon Component ───────────────────────────────────

function GiftIconComponent({ type, size = 36 }: { type: string; size?: number }) {
  switch (type) {
    case 'coffee': return <Coffee size={size} style={{ color: '#F0B84A' }} />;
    case 'rose': return <Rose size={size} style={{ color: '#E86A6A' }} />;
    case 'song': return <Music size={size} style={{ color: '#BB83C9' }} />;
    case 'spark': return <Sparkles size={size} style={{ color: '#7DE0B3' }} />;
    default: return <Gift size={size} style={{ color: '#F0B84A' }} />;
  }
}

// ── Waveform Component ───────────────────────────────────

const Waveform = React.memo(function Waveform({ isPlaying, sent }: { isPlaying: boolean; sent: boolean }) {
  const bars = useMemo(() => Array.from({ length: 20 }, () => 0.3 + Math.random() * 0.7), []);
  const barColor = sent ? 'rgba(255,255,255,0.7)' : '#BB83C9';

  return (
    <div className="flex items-center gap-[2px] h-6">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full"
          style={{ backgroundColor: barColor }}
          initial={{ height: 4 }}
          animate={{
            height: isPlaying ? [4, Math.max(4, h * 20), 4] : 4 + h * 10,
          }}
          transition={{
            duration: 0.4,
            repeat: isPlaying ? Infinity : 0,
            delay: i * 0.02,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// ── ChatBubble ───────────────────────────────────────────

function ChatBubble({ message }: { message: Message }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isSent = message.sender === 'me';

  // Gift message
  if (message.type === 'GIFT') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
        className="flex justify-center my-3"
      >
        <div
          className="flex flex-col items-center px-5 py-3 rounded-[20px] text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.15))',
            border: '1px dashed rgba(255,215,0,0.3)',
            maxWidth: '60%',
          }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.2, 1] }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
          >
            <GiftIconComponent type={message.giftType || 'coffee'} size={28} />
          </motion.div>
          <p className="text-sm font-medium mt-1.5 text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            {message.content}
          </p>
          {message.giftPrice && (
            <span className="text-xs mt-1 font-medium" style={{ color: '#BB83C9', fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {message.giftPrice}
            </span>
          )}
          <span className="text-[11px] mt-1" style={{ color: 'rgba(var(--charcoal-rgb), 0.3)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </motion.div>
    );
  }

  // Voice message
  if (message.type === 'VOICE') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
        className={cn('flex mb-1', isSent ? 'justify-end' : 'justify-start')}
      >
        <div className="max-w-[75%]">
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{
              backgroundColor: isSent ? '#BB83C9' : 'rgba(var(--linen-rgb), 0.6)',
              borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: isSent ? 'var(--card-bg)' : '#BB83C9' }}
            >
              {isPlaying ? (
                <Pause size={14} style={{ color: isSent ? '#BB83C9' : '#fff' }} />
              ) : (
                <Play size={14} style={{ color: isSent ? '#BB83C9' : '#fff' }} className="ml-0.5" />
              )}
            </button>
            <Waveform isPlaying={isPlaying} sent={isSent} />
            <span
              className="text-xs flex-shrink-0"
              style={{
                color: isSent ? 'rgba(255,255,255,0.8)' : 'rgba(var(--charcoal-rgb), 0.5)',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              }}
            >
              {message.duration}
            </span>
          </div>
          <div className={cn('flex items-center gap-1 mt-1', isSent ? 'justify-end' : 'justify-start')}>
            <span style={{ color: 'rgba(var(--charcoal-rgb), 0.3)', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }}>
              {formatTime(message.timestamp)}
            </span>
            {isSent && message.read && (
              <CheckCheck size={12} style={{ color: 'rgba(var(--charcoal-rgb), 0.25)' }} />
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Photo — content holds the image URL, so it must not fall through to the
  // text branch (which would render the raw URL as a message).
  if (message.type === 'IMAGE') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
        className={cn('flex mb-1', isSent ? 'justify-end' : 'justify-start')}
      >
        <div className="max-w-[75%]">
          <img
            src={message.content}
            alt=""
            loading="lazy"
            className="w-full object-cover"
            style={{
              borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              maxHeight: 320,
            }}
          />
          <div className={cn('flex items-center gap-1 mt-1', isSent ? 'justify-end' : 'justify-start')}>
            <span style={{ color: 'rgba(var(--charcoal-rgb), 0.3)', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }}>
              {formatTime(message.timestamp)}
            </span>
            {isSent && message.read && (
              <CheckCheck size={12} style={{ color: 'rgba(var(--charcoal-rgb), 0.25)' }} />
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Text message
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      className={cn('flex mb-1', isSent ? 'justify-end' : 'justify-start')}
    >
      <div className="max-w-[75%]">
        <div
          className="px-4 py-3"
          style={{
            backgroundColor: isSent ? '#BB83C9' : 'rgba(var(--linen-rgb), 0.6)',
            borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <p
            className="text-base leading-relaxed break-words whitespace-pre-wrap"
            style={{
              color: isSent ? '#fff' : 'var(--charcoal)',
              fontFamily: "'Outfit', system-ui, sans-serif",
              fontSize: 16,
              lineHeight: 1.6,
              letterSpacing: '-0.32px',
            }}
          >
            {message.content}
          </p>
        </div>
        <div className={cn('flex items-center gap-1 mt-1', isSent ? 'justify-end' : 'justify-start')}>
          <span style={{ color: 'rgba(var(--charcoal-rgb), 0.3)', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }}>
            {formatTime(message.timestamp)}
          </span>
          {isSent && message.read && (
            <CheckCheck size={12} style={{ color: 'rgba(var(--charcoal-rgb), 0.25)' }} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── DateDivider ──────────────────────────────────────────

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center my-5 gap-4 px-4">
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--linen-dark)' }} />
      <span
        className="text-xs font-medium flex-shrink-0"
        style={{ color: 'rgba(var(--charcoal-rgb), 0.35)', fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 12 }}
      >
        {date}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--linen-dark)' }} />
    </div>
  );
}

// ── IcebreakerChips ──────────────────────────────────────

function IcebreakerChips({ chips, onSend }: { chips: string[]; onSend: (text: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="px-4 mb-3">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-xs font-medium mb-2"
        style={{ color: 'rgba(var(--charcoal-rgb), 0.4)', fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {t('chat.icebreakers')}
      </motion.p>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {chips.map((chip, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSend(chip)}
            className="flex-shrink-0 snap-start px-4 py-3 rounded-full text-sm text-left"
            style={{
              backgroundColor: 'var(--card-bg)',
              color: 'var(--charcoal)',
              fontFamily: "'Outfit', system-ui, sans-serif",
              fontSize: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              lineHeight: 1.55,
              maxWidth: 280,
            }}
          >
            {chip}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── GiftBottomSheet ──────────────────────────────────────

const GIFT_OPTIONS = [
  { name: 'Coffee', nameKey: 'chat.giftCoffee', icon: 'coffee', price: '1', description: 'chat.giftCoffeeDesc' },
  { name: 'Rose', nameKey: 'chat.giftRose', icon: 'rose', price: '2', description: 'chat.giftRoseDesc' },
  { name: 'Song', nameKey: 'chat.giftSong', icon: 'song', price: '1.5', description: 'chat.giftSongDesc' },
  { name: 'Spark', nameKey: 'chat.giftSpark', icon: 'spark', price: 'Free', description: 'chat.giftSparkDesc' },
];

function GiftBottomSheet({
  isOpen,
  onClose,
  onSendGift,
  matchName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (giftType: string, giftName: string) => void;
  matchName: string;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [selected, setSelected] = useState(0);
  const { initiatePayment, isProcessing } = usePiPayment();

  const handleSend = async () => {
    const gift = GIFT_OPTIONS[selected];
    const price = parseFloat(gift.price);
    if (!isNaN(price) && price > 0) {
      const result = await initiatePayment(price, `Gift: ${gift.name} to ${matchName}`, { gift: gift.icon });
      if (!result.success) {
        // A dropped error here meant the gift sheet just sat there after a
        // declined or cancelled payment, with nothing explaining why.
        if (result.error) showToast('error', result.error);
        return;
      }
    }
    onSendGift(gift.icon, gift.name);
    onClose();
    setSelected(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200]"
            style={{ backgroundColor: 'rgba(var(--charcoal-rgb), 0.4)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
            className="fixed bottom-0 left-0 right-0 z-[200] w-full max-w-[430px] mx-auto rounded-t-3xl overflow-y-auto"
            style={{ backgroundColor: 'var(--card-bg)', maxHeight: '85vh' }}
          >
            <div className="flex justify-center pt-3 pb-2 sticky top-0" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--linen-dark)' }} />
            </div>
            <div className="px-6 pb-6">
              <h3
                className="text-xl font-semibold mb-5"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--charcoal)', letterSpacing: '-0.6px' }}
              >
                {t('chat.sendAGift')}
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {GIFT_OPTIONS.map((gift, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelected(i)}
                    className="flex flex-col items-center p-4 rounded-2xl transition-colors"
                    style={{
                      backgroundColor: selected === i ? 'rgba(187,131,201,0.06)' : 'var(--card-bg)',
                      border: selected === i ? '1.5px solid #BB83C9' : '1.5px solid var(--linen-dark)',
                    }}
                  >
                    <GiftIconComponent type={gift.icon} size={36} />
                    <span
                      className="text-base font-semibold mt-2"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--charcoal)' }}
                    >
                      {t(gift.nameKey, { defaultValue: gift.name })}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      {gift.price !== 'Free' && (
                        <span
                          className="text-xs font-medium"
                          style={{ color: '#BB83C9', fontFamily: "'Outfit', system-ui, sans-serif" }}
                        >
                          {gift.price} π
                        </span>
                      )}
                      {gift.price === 'Free' && (
                        <span
                          className="text-xs font-medium"
                          style={{ color: '#7DE0B3', fontFamily: "'Outfit', system-ui, sans-serif" }}
                        >
                          {t('chat.free')}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-xs mt-1 text-center"
                      style={{ color: 'rgba(var(--charcoal-rgb), 0.5)', fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      {t(gift.description)}
                    </span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={isProcessing}
                className="w-full h-14 rounded-full font-semibold text-white text-base flex items-center justify-center"
                style={{
                  backgroundColor: '#BB83C9',
                  boxShadow: '0 4px 16px rgba(187,131,201,0.3)',
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    {t('chat.processing')}
                  </div>
                ) : (
                  `Send ${GIFT_OPTIONS[selected].icon === 'coffee' ? t('chat.giftCoffee') : GIFT_OPTIONS[selected].name}`
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── RecordingOverlay ─────────────────────────────────────

function RecordingOverlay({ isRecording, onCancel, onSend }: { isRecording: boolean; onCancel: () => void; onSend: () => void }) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center"
          style={{ backgroundColor: 'rgba(var(--charcoal-rgb), 0.5)' }}
          onClick={onCancel}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            role="button"
            aria-label={t('chat.tapToSend', { defaultValue: 'Tap to send' })}
            onClick={(e) => { e.stopPropagation(); onSend(); }}
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4 cursor-pointer"
            style={{ backgroundColor: '#E86A6A' }}
          >
            <div className="w-4 h-4 rounded-full bg-white dark:bg-[#22293B]" />
          </motion.div>
          <h3
            className="text-xl font-semibold text-white mb-1"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {t('chat.recording')}
          </h3>
          <p
            className="text-white text-opacity-80"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            {formatElapsed(elapsed)}
          </p>
          <p
            className="text-sm mt-3 text-white text-opacity-50"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {t('chat.tapCircleToSend', { defaultValue: 'Tap the circle to send · tap outside to cancel' })}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── DropdownMenu ─────────────────────────────────────────

function ChatDropdownMenu({
  isOpen,
  onClose,
  onViewProfile,
  onMute,
  onBlock,
  onReport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onViewProfile: () => void;
  onMute: () => void;
  onBlock: () => void;
  onReport: () => void;
}) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-14 right-3 z-[201] rounded-2xl overflow-hidden shadow-xl"
            style={{
              backgroundColor: 'var(--card-bg)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              minWidth: 200,
            }}
          >
            <button
              onClick={() => { onViewProfile(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[var(--linen)] transition-colors"
            >
              <User size={18} style={{ color: 'var(--charcoal)' }} />
              <span className="text-sm font-medium" style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--charcoal)' }}>
                {t('chat.viewProfile')}
              </span>
            </button>
            <button
              onClick={() => { onMute(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[var(--linen)] transition-colors"
            >
              <BellOff size={18} style={{ color: 'var(--charcoal)' }} />
              <span className="text-sm font-medium" style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--charcoal)' }}>
                {t('chat.muteNotifications')}
              </span>
            </button>
            <button
              onClick={() => { onBlock(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[var(--linen)] transition-colors"
            >
              <UserX size={18} style={{ color: 'var(--charcoal)' }} />
              <span className="text-sm font-medium" style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--charcoal)' }}>
                {t('chat.block')}
              </span>
            </button>
            <div className="h-px" style={{ backgroundColor: 'var(--linen-dark)' }} />
            <button
              onClick={() => { onReport(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[var(--linen)] transition-colors"
            >
              <Flag size={18} style={{ color: '#E86A6A' }} />
              <span className="text-sm font-medium" style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: '#E86A6A' }}>
                {t('chat.report')}
              </span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Toast ────────────────────────────────────────────────

function Toast({ message, isVisible, onClose }: { message: string; isVisible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
          className="fixed top-4 left-0 right-0 z-[300] flex justify-center px-4"
        >
          <div
            className="px-5 py-3 rounded-full text-sm text-white font-medium"
            style={{
              backgroundColor: 'var(--charcoal)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              fontFamily: "'Outfit', system-ui, sans-serif",
            }}
          >
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Chat Component ──────────────────────────────────

export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showGiftSheet, setShowGiftSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [showIcebreakers, setShowIcebreakers] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  // Distinct from "no messages": lets the thread say the history failed to load
  // instead of silently rendering as an empty conversation.
  const [loadFailed, setLoadFailed] = useState(false);
  // Bumped by Retry to re-run the loader effect.
  const [reloadKey, setReloadKey] = useState(0);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState({
    matchName: '',
    matchAvatar: '',
    isOnline: false,
    isVerified: false,
    sharedInterests: [] as string[],
    icebreakers: [] as string[],
  });

  // Real-time socket — receive messages from partner
  const { sendTypingStart, sendTypingStop } = useSocket(
    matchId,
    useCallback((msg: IncomingMessage) => {
      if (!partnerId || msg.senderId !== partnerId) return;
      setMessages((prev) => {
        // The REST route echoes to the whole match room, so the same message can
        // also arrive via a refetch — key off the real id when we have one.
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
        return [
          ...prev,
          {
            id: msg.id ?? `ws-${Date.now()}`,
            type: msg.type ?? 'TEXT',
            content: msg.content,
            sender: 'them' as const,
            timestamp: new Date(msg.createdAt),
            read: false,
            ...(msg.giftType
              ? { giftType: msg.giftType as 'coffee' | 'rose' | 'song' | 'spark' }
              : {}),
          },
        ];
      });
    }, [partnerId]),
    useCallback(() => setIsTyping(true), []),
    useCallback(() => setIsTyping(false), []),
    useCallback((userId: string, isOnline: boolean) => {
      if (userId === partnerId) setMatchInfo((prev) => ({ ...prev, isOnline }));
    }, [partnerId]),
  );

  // Load messages from API on mount
  useEffect(() => {
    if (!matchId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    messagesApi.getMessages(matchId)
      .then(data => {
        if (cancelled) return;
        // Always replace mock messages with real API result (even if empty)
        const converted: Message[] = data.messages.map((m: ApiMessage) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(converted);
        setShowIcebreakers(converted.length < 5);
        if (data.partnerId) setPartnerId(data.partnerId);
        setMatchInfo({
          matchName: data.matchName || '',
          matchAvatar: data.matchAvatar || '',
          isOnline: data.isOnline ?? false,
          isVerified: data.isVerified ?? false,
          sharedInterests: data.sharedInterests ?? [],
          icebreakers: data.icebreakers ?? [],
        });
        setIsLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        // Do NOT clear to []. Wiping the thread made a failed fetch look like a
        // conversation where nothing was ever said — in the app's core screen.
        console.error('[chat] message history load failed:', e);
        setLoadFailed(true);
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [matchId, reloadKey]);

  const { showToast: showGlobalToast } = useToast();

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // isTyping is controlled by real socket typing events (see useSocket hook)

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    setInputText('');
    setShowIcebreakers(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    // Try API first, fallback to local
    try {
      if (matchId) {
        const msg = await messagesApi.sendMessage(matchId, trimmed, 'TEXT');
        const converted: Message = {
          ...msg,
          timestamp: new Date(msg.timestamp),
        };
        setMessages((prev) => [...prev, converted]);
        return;
      }
    } catch {
    }

    // Local fallback
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      type: 'TEXT',
      content: trimmed,
      sender: 'me',
      timestamp: new Date(),
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
  }, [matchId]);

  const handleSendGift = useCallback(
    async (giftType: string, giftName: string) => {
      const content = t('chat.giftMsgContent', { partner: matchInfo.matchName, gift: `${giftName.toLowerCase()} ${giftType === 'coffee' ? '\u2615' : giftType === 'rose' ? '\ud83c\udf39' : giftType === 'song' ? '\ud83c\udfb5' : '\u2728'}` });
      const optimistic: Message = {
        id: `gift-${Date.now()}`,
        type: 'GIFT',
        content,
        sender: 'me',
        timestamp: new Date(),
        giftType: giftType as 'coffee' | 'rose' | 'song' | 'spark',
        read: false,
      };
      setMessages((prev) => [...prev, optimistic]);
      if (!matchId) return;
      try {
        // The Pi payment already went through \u2014 the gift must be persisted or the
        // recipient never sees what was paid for.
        const saved = await messagesApi.sendMessage(matchId, content, 'GIFT', giftType);
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...m, id: saved.id ?? m.id } : m))
        );
        showToast(t('chat.giftSent', { name: giftName }));
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        showToast(t('chat.giftFailed', { defaultValue: 'Could not deliver gift \u2014 please contact support' }));
      }
    },
    [matchId, matchInfo.matchName, showToast, t]
  );

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleSendPhoto = useCallback(async (file: File) => {
    if (!matchId) return;
    const localUrl = URL.createObjectURL(file);
    const optimistic: Message = {
      id: `img-${Date.now()}`,
      type: 'IMAGE',
      content: localUrl,
      sender: 'me',
      timestamp: new Date(),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await messagesApi.sendImage(matchId, file);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, id: saved.id ?? m.id, content: saved.content ?? m.content } : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      showToast(t('chat.photoFailed', { defaultValue: 'Could not send photo' }));
    }
  }, [matchId, showToast, t]);

  const handleAutoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '40px';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  // Voice recording — real capture via MediaRecorder, uploaded on release
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const recordStartRef = useRef<number>(0);

  const stopTracks = useCallback(() => {
    recorderRef.current?.stream.getTracks().forEach((tr) => tr.stop());
    recorderRef.current = null;
  }, []);

  const handleMicPress = useCallback(async () => {
    if (inputText.trim()) {
      handleSendMessage(inputText);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showToast(t('chat.voiceUnsupported', { defaultValue: 'Voice messages are not supported on this device' }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      cancelledRef.current = false;
      recordStartRef.current = Date.now();
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stopTracks();
        const seconds = Math.round((Date.now() - recordStartRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        if (cancelledRef.current || !matchId || blob.size === 0 || seconds < 1) return;
        const optimistic: Message = {
          id: `voice-${Date.now()}`,
          type: 'VOICE',
          content: URL.createObjectURL(blob),
          sender: 'me',
          timestamp: new Date(),
          duration: `0:${String(seconds).padStart(2, '0')}`,
          read: false,
        };
        setMessages((prev) => [...prev, optimistic]);
        try {
          const saved = await messagesApi.sendVoice(matchId, blob);
          setMessages((prev) =>
            prev.map((m) => (m.id === optimistic.id ? { ...m, id: saved.id ?? m.id, content: saved.content ?? m.content } : m))
          );
        } catch {
          setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
          showToast(t('chat.voiceFailed', { defaultValue: 'Could not send voice message' }));
        }
      };
      recorderRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch {
      showToast(t('chat.micDenied', { defaultValue: 'Microphone access is needed for voice messages' }));
    }
  }, [inputText, handleSendMessage, matchId, showToast, t, stopTracks]);

  const handleRecordingSend = useCallback(() => {
    cancelledRef.current = false;
    setIsRecording(false);
    recorderRef.current?.stop();
  }, []);

  const handleRecordingCancel = useCallback(() => {
    cancelledRef.current = true;
    setIsRecording(false);
    if (recorderRef.current) recorderRef.current.stop();
    else stopTracks();
  }, [stopTracks]);

  // Release the mic if the user navigates away mid-recording
  useEffect(() => stopTracks, [stopTracks]);

  const handleIcebreakerSend = useCallback(
    (text: string) => {
      handleSendMessage(text);
    },
    [handleSendMessage]
  );

  // Dropdown actions
  // Used to navigate to your own /profile — before PublicProfile existed
  // there was nowhere else to send it, but now it should show the partner.
  const handleViewProfile = () => { if (partnerId) navigate(`/profile/${partnerId}`); };
  const handleMute = () => showToast(t('chat.mutedNotifs'));
  // Block and report confirm only after the server actually accepted. Telling
  // someone they blocked a person who can still message them is worse than an
  // error message — these are the two actions where a fake success is unsafe.
  const handleBlock = async () => {
    if (!partnerId) return;
    try {
      await api.post(`/users/${partnerId}/block`, {});
      showToast(t('chat.userBlocked'));
      setTimeout(() => navigate('/matches'), 1500);
    } catch (e: unknown) {
      showGlobalToast('error', e instanceof Error ? e.message : t('chat.blockFailed', { defaultValue: 'Could not block — please try again' }));
    }
  };
  const handleReport = () => setReportDialogOpen(true);
  const handleReportSubmit = async (reason: string, description: string) => {
    if (!partnerId) return;
    try {
      await api.post(`/users/${partnerId}/report`, { reason, description });
      showGlobalToast('success', 'Report submitted. We\'ll review it shortly.');
    } catch (e: unknown) {
      showGlobalToast('error', e instanceof Error ? e.message : t('chat.reportFailed', { defaultValue: 'Could not send the report — please try again' }));
    }
  };

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);
  const hasText = inputText.trim().length > 0;

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: 'var(--linen)' }}>
      <div className="w-full max-w-[430px] relative flex flex-col" style={{ backgroundColor: 'var(--linen)' }}>
        {/* ── Chat Header ── */}
        <div
          className="sticky top-0 z-40 flex items-center justify-between px-3"
          style={{
            backgroundColor: 'rgba(var(--card-rgb), 0.85)',
            backdropFilter: 'blur(12px)',
            paddingTop: 'env(safe-area-inset-top)',
            height: 'calc(56px + env(safe-area-inset-top))',
            borderBottom: '1px solid rgba(var(--linen-rgb), 0.5)',
          }}
        >
          {/* Left: Back + Avatar + Name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.12 }}
              onClick={() => navigate('/matches')}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(var(--card-rgb), 0.72)', backdropFilter: 'blur(12px)' }}
            >
              <ChevronLeft size={24} className="text-[var(--charcoal)]" strokeWidth={2} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleViewProfile}
              className="flex items-center gap-2 min-w-0"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={matchInfo.matchAvatar}
                  alt={matchInfo.matchName}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: matchInfo.isOnline ? '2px solid #BB83C9' : '2px solid transparent' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${matchInfo.matchName}&background=BB83C9&color=fff`;
                  }}
                />
                {matchInfo.isOnline && (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#7DE0B3] border-2 border-white"
                  />
                )}
              </div>
              <div className="min-w-0 text-left">
                <p
                  className="text-base font-semibold truncate"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--charcoal)', letterSpacing: '-0.32px', lineHeight: 1.3 }}
                >
                  {matchInfo.matchName}
                </p>
                <p
                  className="text-xs truncate"
                  style={{
                    fontFamily: "'Outfit', system-ui, sans-serif",
                    color: matchInfo.isOnline ? '#7DE0B3' : 'rgba(var(--charcoal-rgb), 0.4)',
                  }}
                >
                  {matchInfo.isOnline ? t('chat.activeNow') : t('chat.offline')}
                </p>
              </div>
            </motion.button>
          </div>

          {/* Right: Video + More */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.12 }}
              onClick={() => navigate(`/video/${matchId}`)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
            >
              <Video size={22} style={{ color: 'rgba(var(--charcoal-rgb), 0.6)' }} strokeWidth={2} />
            </motion.button>
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.12 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
              >
                <MoreVertical size={20} style={{ color: 'rgba(var(--charcoal-rgb), 0.6)' }} />
              </motion.button>
              <ChatDropdownMenu
                isOpen={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
                onViewProfile={handleViewProfile}
                onMute={handleMute}
                onBlock={handleBlock}
                onReport={handleReport}
              />
            </div>
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto relative"
          style={{
            backgroundColor: 'var(--linen)',
            padding: '8px 0 16px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <RecordingOverlay isRecording={isRecording} onCancel={handleRecordingCancel} onSend={handleRecordingSend} />

          {isLoading ? (
            <div className="px-6 py-8 space-y-4">
              <div className="flex justify-start"><SkeletonLoader variant="text" className="w-[60%]" /></div>
              <div className="flex justify-end"><SkeletonLoader variant="text" className="w-[50%]" /></div>
              <div className="flex justify-start"><SkeletonLoader variant="text" className="w-[70%]" /></div>
              <div className="flex justify-end"><SkeletonLoader variant="text" className="w-[45%]" /></div>
            </div>
          ) : loadFailed ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[var(--charcoal)] opacity-60" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {t('chat.historyLoadFailed', { defaultValue: "Couldn't load this conversation." })}
              </p>
              <button
                onClick={() => { setLoadFailed(false); setReloadKey((k) => k + 1); }}
                className="mt-2 text-sm font-semibold"
                style={{ color: '#BB83C9', fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {t('common.retry', { defaultValue: 'Retry' })}
              </button>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                <DateDivider date={group.date} />
                {group.items.map((msg) => (
                  <div key={msg.id} className="px-4">
                    <ChatBubble message={msg} />
                  </div>
                ))}
              </div>
            ))
          )}

          {isTyping && (
            <div className="px-4">
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Icebreakers ── */}
        <AnimatePresence>
          {!isLoading && showIcebreakers && messages.length < 5 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <IcebreakerChips chips={matchInfo.icebreakers} onSend={handleIcebreakerSend} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Message Input ── */}
        <div
          className="flex-shrink-0 z-40"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderTop: '1px solid rgba(var(--linen-rgb), 0.5)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="flex items-end gap-1.5 px-2 py-2">
            {/* Gift Button */}
            <motion.button
              whileTap={{ rotate: [-5, 5, 0] }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowGiftSheet(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
            >
              <Gift size={22} style={{ color: '#F0B84A' }} strokeWidth={2} />
            </motion.button>

            {/* Attach photo */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) handleSendPhoto(file);
              }}
            />
            <motion.button
              whileTap={{ scale: 0.85 }}
              transition={{ duration: 0.15 }}
              onClick={() => photoInputRef.current?.click()}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
            >
              <ImageIcon size={22} style={{ color: '#7BC4E8' }} strokeWidth={2} />
            </motion.button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleAutoResize();
                  if (user?.id) {
                    sendTypingStart(user.id);
                    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                    typingTimerRef.current = setTimeout(() => sendTypingStop(user.id!), 2000);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputText);
                  }
                }}
                placeholder={t('chat.typeMessage')}
                rows={1}
                className="w-full resize-none outline-none px-4 py-2.5 text-base"
                style={{
                  backgroundColor: 'rgba(var(--linen-rgb), 0.4)',
                  borderRadius: 24,
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  color: 'var(--charcoal)',
                  fontSize: 16,
                  lineHeight: 1.5,
                  minHeight: 40,
                  maxHeight: 120,
                  letterSpacing: '-0.32px',
                }}
                onFocus={(e) => {
                  (e.target as HTMLTextAreaElement).style.backgroundColor = 'rgba(var(--linen-rgb), 0.6)';
                  (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(187,131,201,0.15)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLTextAreaElement).style.backgroundColor = 'rgba(var(--linen-rgb), 0.4)';
                  (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Mic / Send Button */}
            <AnimatePresence mode="wait">
              {hasText ? (
                <motion.button
                  key="send"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => handleSendMessage(inputText)}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
                  style={{ backgroundColor: '#BB83C9' }}
                >
                  <Send size={20} className="text-white" strokeWidth={2} />
                </motion.button>
              ) : (
                <motion.button
                  key="mic"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleMicPress}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
                >
                  <Mic size={22} style={{ color: 'rgba(var(--charcoal-rgb), 0.5)' }} strokeWidth={2} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Gift Bottom Sheet ── */}
        <GiftBottomSheet
          isOpen={showGiftSheet}
          onClose={() => setShowGiftSheet(false)}
          onSendGift={handleSendGift}
          matchName={matchInfo.matchName}
        />

        {/* ── Report Dialog ── */}
        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          userName={matchInfo.matchName}
          onSubmit={handleReportSubmit}
        />

        {/* ── Toast ── */}
        <Toast message={toast.message} isVisible={toast.visible} onClose={hideToast} />
      </div>
    </div>
  );
}
