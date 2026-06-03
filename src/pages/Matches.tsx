import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { Search, SlidersHorizontal, Trash2, Circle, Sparkles, ExternalLink, X, Utensils } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import PartnerOffers from '@/components/PartnerOffers';
import SkeletonLoader from '@/components/SkeletonLoader';
import { matchesApi } from '@/api/matches';
import { useToast } from '@/hooks/useToast';

// ── Types ──────────────────────────────────────────────

interface Match {
  id: string;
  name: string;
  photo: string;
  compatibility: number;
  isNew: boolean;
  sparkUsed: boolean;
  isOnline: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isTyping?: boolean;
  hasConversation: boolean;
}

// ── Mock Data ──────────────────────────────────────────

const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    name: 'Sarah',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    compatibility: 87,
    isNew: true,
    sparkUsed: false,
    isOnline: true,
    lastMessage: '',
    lastMessageTime: '',
    unreadCount: 0,
    hasConversation: false,
  },
  {
    id: 'm2',
    name: 'Emma',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
    compatibility: 92,
    isNew: true,
    sparkUsed: true,
    isOnline: false,
    lastMessage: '',
    lastMessageTime: '',
    unreadCount: 0,
    hasConversation: false,
  },
  {
    id: 'm3',
    name: 'Liam',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    compatibility: 78,
    isNew: false,
    sparkUsed: false,
    isOnline: true,
    lastMessage: 'Hey! How\'s your day going? 😊',
    lastMessageTime: '2m',
    unreadCount: 2,
    hasConversation: true,
  },
  {
    id: 'm4',
    name: 'Olivia',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    compatibility: 95,
    isNew: false,
    sparkUsed: false,
    isOnline: true,
    lastMessage: 'I love that coffee shop too! We should go together sometime ☕',
    lastMessageTime: '1h',
    unreadCount: 1,
    hasConversation: true,
  },
  {
    id: 'm5',
    name: 'Noah',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    compatibility: 71,
    isNew: false,
    sparkUsed: false,
    isOnline: false,
    lastMessage: 'Just sent you a photo from my trip!',
    lastMessageTime: '3h',
    unreadCount: 0,
    hasConversation: true,
  },
  {
    id: 'm6',
    name: 'Ava',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face',
    compatibility: 84,
    isNew: false,
    sparkUsed: false,
    isOnline: false,
    lastMessage: 'That book recommendation was amazing, thank you! 📚',
    lastMessageTime: '1d',
    unreadCount: 0,
    hasConversation: true,
  },
  {
    id: 'm7',
    name: 'Sophia',
    photo: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop&crop=face',
    compatibility: 90,
    isNew: false,
    sparkUsed: true,
    isOnline: true,
    lastMessage: '',
    lastMessageTime: '',
    unreadCount: 0,
    isTyping: false,
    hasConversation: false,
  },
  {
    id: 'm8',
    name: 'Ethan',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    compatibility: 80,
    isNew: false,
    sparkUsed: false,
    isOnline: false,
    lastMessage: 'Are you free this weekend? There\'s a great hiking trail I want to check out',
    lastMessageTime: '2d',
    unreadCount: 0,
    hasConversation: true,
  },
  {
    id: 'm9',
    name: 'Mia',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    compatibility: 88,
    isNew: false,
    sparkUsed: false,
    isOnline: true,
    isTyping: true,
    lastMessage: 'Haha that\'s hilarious! 😂',
    lastMessageTime: 'Now',
    unreadCount: 0,
    hasConversation: true,
  },
  {
    id: 'm10',
    name: 'Charlotte',
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop&crop=face',
    compatibility: 91,
    isNew: true,
    sparkUsed: false,
    isOnline: false,
    lastMessage: '',
    lastMessageTime: '',
    unreadCount: 0,
    hasConversation: false,
  },
];

// ── Typing Indicator ───────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs" style={{ color: 'rgba(35,35,35,0.4)' }}>typing</span>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#E8E2D8' }}
            animate={{ scale: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── New Match Avatar ───────────────────────────────────

function NewMatchItem({ match, index }: { match: Match; index: number }) {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        delay: index * 0.05,
      }}
      whileTap={{ scale: 0.92 }}
      onClick={() => navigate(`/chat/${match.id}`)}
      className="flex flex-col items-center gap-2 flex-shrink-0"
      style={{ width: 80 }}
    >
      <div className="relative">
        <div
          className="w-[72px] h-[72px] rounded-full overflow-hidden"
          style={{ border: '3px solid #BB83C9' }}
        >
          <img
            src={match.photo}
            alt={match.name}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Spark indicator */}
        {match.sparkUsed && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#FFD700' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
        )}
        {/* Online indicator */}
        {match.isOnline && (
          <div
            className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
            style={{ backgroundColor: '#5BC492' }}
          />
        )}
      </div>
      <span
        className="text-xs font-semibold text-[#232323] text-center truncate w-full"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        {match.name}
      </span>
      <span
        className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ backgroundColor: '#7DE0B3', color: '#232323' }}
      >
        {match.compatibility}%
      </span>
    </motion.button>
  );
}

// ── Conversation Row ───────────────────────────────────

function ConversationRow({
  match,
  index,
  onDelete,
}: {
  match: Match;
  index: number;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const x = useRef(0);

  const handleDrag = (_: unknown, info: PanInfo) => {
    x.current = info.offset.x;
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -120) {
      setIsDeleting(true);
    } else {
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    onDelete(match.id);
  };

  // Format message preview
  const getMessagePreview = () => {
    if (match.isTyping) {
      return <TypingIndicator />;
    }
    if (!match.lastMessage) return null;

    let prefix = '';
    if (match.lastMessage.includes('photo') || match.lastMessage.includes('image')) {
      prefix = 'Photo ';
    } else if (match.lastMessage.includes('voice') || match.lastMessage.includes('audio')) {
      prefix = 'Voice ';
    } else if (match.lastMessage.includes('gift')) {
      prefix = 'Gift ';
    }

    return (
      <span
        className="text-sm truncate block"
        style={{
          color: match.unreadCount > 0 ? 'rgba(35,35,35,0.7)' : 'rgba(35,35,35,0.6)',
          fontWeight: match.unreadCount > 0 ? 500 : 400,
        }}
      >
        {prefix && <span style={{ opacity: 0.6 }}>{prefix}</span>}
        {match.lastMessage}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="relative overflow-hidden"
    >
      {/* Delete background */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-end px-5 bg-[#E86A6A] z-0"
          >
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 text-white font-semibold text-sm"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: isDeleting ? 0 : -160, right: 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: isDeleting ? -80 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={() => !isDeleting && navigate(`/chat/${match.id}`)}
        className="relative z-10 flex items-center gap-3 px-4 py-3 bg-white active:bg-[rgba(232,226,216,0.2)] transition-colors cursor-pointer"
        style={{
          borderBottom: '1px solid rgba(232,226,216,0.4)',
        }}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0 self-start">
          <div
            className="w-14 h-14 rounded-full overflow-hidden"
            style={{ border: match.unreadCount > 0 ? '2px solid #BB83C9' : '2px solid transparent' }}
          >
            <img
              src={match.photo}
              alt={match.name}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Online indicator */}
          {match.isOnline && (
            <div
              className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white"
              style={{ backgroundColor: '#5BC492' }}
            />
          )}
          {/* Unread badge */}
          {match.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-[#E86A6A] text-white text-[10px] font-semibold flex items-center justify-center px-1">
              {match.unreadCount}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h4
              className="text-lg font-semibold text-[#232323] truncate"
              style={{
                fontFamily: "'Outfit', system-ui, sans-serif",
                fontWeight: match.unreadCount > 0 ? 600 : 500,
              }}
            >
              {match.name}
            </h4>
            {match.lastMessageTime && (
              <span
                className="text-xs flex-shrink-0 ml-2"
                style={{
                  color: 'rgba(35,35,35,0.35)',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                }}
              >
                {match.lastMessageTime}
              </span>
            )}
          </div>
          {getMessagePreview()}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Empty State ────────────────────────────────────────

function EmptyState() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col items-center justify-center px-10 py-16"
      style={{
        background: 'radial-gradient(circle at 30% 30%, rgba(187,131,201,0.35), transparent 60%), radial-gradient(circle at 70% 70%, rgba(125,224,179,0.3), transparent 60%)',
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-[200px] h-[200px] mb-6 flex items-center justify-center rounded-full"
        style={{ backgroundColor: 'rgba(187,131,201,0.08)' }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#BB83C9" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </motion.div>
      <h2 className="text-xl font-semibold text-[#232323] mb-2 text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
        {t('matches.noMatches')}
      </h2>
      <p className="text-sm text-center mb-8 max-w-[260px]" style={{ color: 'rgba(35,35,35,0.6)' }}>
        {t('matches.startSwiping')}
      </p>
      <button
        onClick={() => navigate('/discover')}
        className="w-full max-w-[280px] h-14 rounded-full text-base font-semibold text-white"
        style={{ backgroundColor: '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.3)' }}
      >
        {t('matches.startSwiping')}
      </button>
    </motion.div>
  );
}

// ── Match Celebration Overlay ──────────────────────────

function MatchCelebration({
  matchName,
  onClose,
}: {
  matchName: string;
  onClose: () => void;
}) {
  const [showOffer, setShowOffer] = useState(false);
  const _navigate = useNavigate();
  void _navigate;

  useEffect(() => {
    // Launch confetti burst
    const colors = ['#BB83C9', '#7DE0B3', '#7BC4E8', '#FFD700'];

    const end = Date.now() + 1200;

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0.2, y: 0.5 },
        colors,
        shapes: ['circle', 'star'],
        scalar: 1.2,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 0.8, y: 0.5 },
        colors,
        shapes: ['circle', 'star'],
        scalar: 1.2,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        // Show partner offer after confetti finishes
        setTimeout(() => setShowOffer(true), 300);
      }
    };

    requestAnimationFrame(frame);
  }, []);

  const handleBookNow = () => {
    window.open('https://example.com/le-petit-bistro', '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center px-6"
      style={{
        background: 'radial-gradient(circle, rgba(187,131,201,0.85), rgba(125,224,179,0.75), rgba(247,244,238,0.95))',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.88 }}
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}
      >
        <X size={20} className="text-white" strokeWidth={2} />
      </motion.button>

      {/* Match Info */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: 0.1,
        }}
        className="flex flex-col items-center mb-8"
      >
        {/* Decorative hearts */}
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-4"
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#BB83C9" stroke="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </motion.div>

        <h2
          className="text-2xl font-semibold text-white text-center mb-1"
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            textShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          It&apos;s a Match!
        </h2>
        <p
          className="text-base text-white text-center"
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            opacity: 0.9,
            textShadow: '0 1px 8px rgba(0,0,0,0.1)',
          }}
        >
          You and {matchName} liked each other
        </p>

        {/* Chat CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="mt-5 h-12 px-8 rounded-full text-sm font-semibold text-white"
          style={{
            backgroundColor: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255,255,255,0.4)',
            fontFamily: "'Outfit', system-ui, sans-serif",
          }}
        >
          Send a Message
        </motion.button>
      </motion.div>

      {/* Partner Offer Card — appears after confetti */}
      <AnimatePresence>
        {showOffer && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
            }}
            className="w-full max-w-[320px] rounded-2xl overflow-hidden bg-white"
            style={{
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            }}
          >
            {/* Mini gradient header */}
            <div
              className="relative w-full flex items-center justify-center py-5"
              style={{
                background: 'linear-gradient(135deg, #BB83C9 0%, #D4A8DE 60%, #7DE0B3 100%)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                }}
              >
                <Utensils size={18} strokeWidth={1.5} />
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-2">
              <div
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full self-start"
                style={{ backgroundColor: '#BB83C9' }}
              >
                <Sparkles size={10} className="text-white" />
                <span
                  className="text-[10px] font-semibold text-white uppercase tracking-wide"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  Celebrate your match!
                </span>
              </div>

              <h3
                className="text-lg font-semibold text-[#232323] leading-tight"
                style={{
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  fontSize: 18,
                  lineHeight: 1.35,
                  letterSpacing: '-0.54px',
                }}
              >
                Book a table at Le Petit Bistro with 20% off
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  fontSize: 14,
                  lineHeight: 1.55,
                  letterSpacing: '-0.28px',
                  color: 'rgba(35,35,35,0.65)',
                }}
              >
                Perfect for your first date. Romantic atmosphere and candlelight dinner.
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-2 mt-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBookNow}
                  className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-semibold text-white"
                  style={{
                    backgroundColor: '#BB83C9',
                    fontFamily: "'Outfit', system-ui, sans-serif",
                    boxShadow: '0 4px 16px rgba(187,131,201,0.3)',
                  }}
                >
                  Book Now
                  <ExternalLink size={14} strokeWidth={2} />
                </motion.button>

                <motion.button
                  whileTap={{ opacity: 0.6 }}
                  onClick={() => setShowOffer(false)}
                  className="w-full py-1.5 text-sm font-semibold text-center"
                  style={{
                    color: 'rgba(35,35,35,0.5)',
                    fontFamily: "'Outfit', system-ui, sans-serif",
                    fontSize: 14,
                    background: 'none',
                    border: 'none',
                  }}
                >
                  Maybe later
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Matches Component ─────────────────────────────

export default function Matches() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showOffers, setShowOffers] = useState(true);
  const [celebrationMatch, setCelebrationMatch] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch matches from API on mount
  useEffect(() => {
    let cancelled = false;
    matchesApi.getMatches()
      .then(data => {
        if (cancelled) return;
        if (data.length > 0) {
          setMatches(data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.log('API not available, using mock data', err);
        setMatches(MOCK_MATCHES);
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const newMatches = matches.filter((m) => m.isNew);
  const conversations = matches.filter((m) => m.hasConversation);

  const filteredConversations = searchQuery
    ? conversations.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const handleDelete = useCallback((id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
    // Also call API to delete
    try {
      matchesApi.deleteMatch(id);
    } catch {
      console.log('Delete API call failed');
    }
  }, []);

  const handleSimulateMatch = useCallback(() => {
    const names = ['Ava', 'Mia', 'Isabella', 'Zoe', 'Luna', 'Chloe'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    setCelebrationMatch(randomName);
    showToast('match', `It's a Match with ${randomName}! 🎉`);
  }, [showToast]);

  const handleCloseCelebration = useCallback(() => {
    setCelebrationMatch(null);
  }, []);

  const handleDismissOffers = useCallback(() => {
    setShowOffers(false);
  }, []);

  const totalUnread = conversations.reduce((sum, m) => sum + m.unreadCount, 0);

  if (!isLoading && matches.length === 0) {
    return (
      <Layout title={t('matches.title')}>
        <EmptyState />
      </Layout>
    );
  }

  return (
    <>
      <Layout
        title={t('matches.title')}
        rightAction={
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSimulateMatch}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(187,131,201,0.12)', backdropFilter: 'blur(12px)' }}
              title="Simulate New Match"
            >
              <Sparkles size={20} style={{ color: '#BB83C9' }} strokeWidth={2} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSearch(!showSearch)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)' }}
            >
              <Search size={20} className="text-[#232323]" strokeWidth={2} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {}}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)' }}
            >
              <SlidersHorizontal size={18} className="text-[#232323]" strokeWidth={2} />
            </motion.button>
          </div>
        }
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 py-3">
                  <div
                    className="flex items-center gap-2 h-12 px-4 rounded-xl"
                    style={{ backgroundColor: 'rgba(232,226,216,0.4)', border: '1.5px solid transparent' }}
                  >
                    <Search size={18} style={{ color: 'rgba(35,35,35,0.35)' }} />
                    <input
                      type="text"
                      placeholder="Search matches..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-base text-[#232323] placeholder:text-[rgba(35,35,35,0.35)] outline-none"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                      autoFocus
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Partner Offers Section */}
          {showOffers && <PartnerOffers onDismiss={handleDismissOffers} />}

          {/* New Matches Banner */}
          {newMatches.length > 0 && (
            <div className="px-5 pt-4 pb-3">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-[11px] font-semibold uppercase tracking-widest mb-3 block"
                style={{ color: 'rgba(35,35,35,0.4)', fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '0.44px' }}
              >
                {t('matches.newMatches')}
              </motion.span>
              <div
                className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {newMatches.map((match, index) => (
                  <NewMatchItem key={match.id} match={match} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Messages Section */}
          {conversations.length > 0 && (
            <div
              className="flex-1 flex flex-col overflow-hidden rounded-t-3xl bg-white"
              style={{
                boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
                marginTop: newMatches.length > 0 ? 8 : 0,
              }}
            >
              {/* Messages Header */}
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid #E8E2D8' }}
              >
                <div className="flex items-center gap-2">
                  <h2
                    className="text-xl font-semibold text-[#232323]"
                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                  >
                    {t('matches.messages')}
                  </h2>
                  <span className="text-xs" style={{ color: 'rgba(35,35,35,0.4)' }}>
                    ({conversations.length})
                  </span>
                </div>
                {totalUnread > 0 && (
                  <div className="flex items-center gap-1">
                    <Circle size={8} fill="#BB83C9" className="text-[#BB83C9]" />
                    <span className="text-xs font-medium" style={{ color: '#BB83C9' }}>
                      {totalUnread} new
                    </span>
                  </div>
                )}
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="px-5 py-6">
                    <SkeletonLoader variant="list" count={5} />
                  </div>
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((match, index) => (
                    <ConversationRow
                      key={match.id}
                      match={match}
                      index={index}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-8">
                    <Search size={40} style={{ color: 'rgba(35,35,35,0.2)' }} className="mb-3" />
                    <p className="text-sm text-center" style={{ color: 'rgba(35,35,35,0.5)' }}>
                      No conversations match &ldquo;{searchQuery}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No conversations yet (only new matches) */}
          {conversations.length === 0 && newMatches.length > 0 && (
            <div
              className="flex-1 flex flex-col items-center justify-center px-10 bg-white rounded-t-3xl"
              style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.04)' }}
            >
              <p className="text-sm text-center mb-4" style={{ color: 'rgba(35,35,35,0.5)' }}>
                Start a conversation with one of your new matches!
              </p>
              <button
                onClick={() => navigate(`/chat/${newMatches[0].id}`)}
                className="h-12 px-8 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.3)' }}
              >
                Say Hello
              </button>
            </div>
          )}
        </div>
      </Layout>

      {/* Match Celebration Overlay */}
      <AnimatePresence>
        {celebrationMatch && (
          <MatchCelebration
            matchName={celebrationMatch}
            onClose={handleCloseCelebration}
          />
        )}
      </AnimatePresence>
    </>
  );
}
