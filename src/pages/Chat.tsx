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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────

type MessageType = 'text' | 'voice' | 'gift' | 'image';

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

interface ConversationData {
  matchName: string;
  matchAvatar: string;
  isOnline: boolean;
  lastSeen?: string;
  isVerified: boolean;
  messages: Message[];
  icebreakers: string[];
  sharedInterests: string[];
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
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
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

// ── Mock Data ────────────────────────────────────────────

const CONVERSATIONS: Record<string, ConversationData> = {
  'match-1': {
    matchName: 'Sophie',
    matchAvatar: 'https://i.pravatar.cc/150?img=5',
    isOnline: true,
    isVerified: true,
    sharedInterests: ['Hiking', 'Coffee', 'Indie Music'],
    icebreakers: [
      "I see you love hiking too — favorite trail?",
      "What's the best coffee spot in your city?",
      "Your taste in music is impeccable — go-to concert?",
    ],
    messages: [
      { id: 'm1', type: 'text', content: 'Hey Sophie! 👋 Great to match with you!', sender: 'me', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 9), read: true },
      { id: 'm2', type: 'text', content: 'Hey! Thanks, excited to chat! Your profile stood out to me.', sender: 'them', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 9 + 300000), read: true },
      { id: 'm3', type: 'text', content: 'I noticed you listed hiking as an interest! Have you done any cool trails lately?', sender: 'me', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 10), read: true },
      { id: 'm4', type: 'text', content: 'Yes! I actually did the coastal trail at Big Sur last weekend. The views were absolutely unreal! 🌊', sender: 'them', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 10 + 600000), read: true },
      { id: 'm5', type: 'text', content: 'Oh wow, Big Sur is on my bucket list! How long was the hike?', sender: 'me', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 11), read: true },
      { id: 'm6', type: 'text', content: 'About 8 miles round trip. Took us around 5 hours with breaks for photos. Totally worth it!', sender: 'them', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 11 + 450000), read: true },
      { id: 'm7', type: 'text', content: 'That sounds perfect. I need to plan a trip there soon!', sender: 'me', timestamp: new Date(Date.now() - 86400000 + 3600000 * 10), read: true },
      { id: 'm8', type: 'text', content: 'You definitely should! I can share some recommendations if you want.', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 10 + 200000), read: true },
      { id: 'm9', type: 'text', content: 'That would be amazing, thank you! 😊', sender: 'me', timestamp: new Date(Date.now() - 86400000 + 3600000 * 11), read: true },
      { id: 'm10', type: 'text', content: 'So what else are you into besides hiking?', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 11 + 400000), read: true },
      { id: 'm11', type: 'text', content: 'I\'m a big coffee person. I probably spend way too much time at local cafes haha', sender: 'me', timestamp: new Date(Date.now() - 86400000 + 3600000 * 12), read: true },
      { id: 'm12', type: 'text', content: 'Haha same! There\'s this amazing place near me that roasts their own beans. Best latte I\'ve ever had.', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 12 + 350000), read: true },
      { id: 'm13', type: 'gift', content: 'Sophie sent you a coffee ☕', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 13), read: true, giftType: 'coffee', giftPrice: '1π' },
      { id: 'm14', type: 'text', content: 'Aww thank you! That\'s so sweet! 🥰', sender: 'me', timestamp: new Date(Date.now() - 86400000 + 3600000 * 13 + 180000), read: true },
      { id: 'm15', type: 'text', content: 'You\'re welcome! I figured a virtual coffee was the least I could do ☕', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 13 + 360000), read: true },
      { id: 'm16', type: 'text', content: 'By the way, are you going to the indie music festival next month?', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 14), read: true },
      { id: 'm17', type: 'text', content: 'I was thinking about it! Arctic Monkeys and Tame Impala are headlining, right?', sender: 'me', timestamp: new Date(Date.now() - 86400000 + 3600000 * 14 + 500000), read: true },
      { id: 'm18', type: 'text', content: 'Yes! And Phoebe Bridgers too. The lineup is incredible.', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 14 + 900000), read: true },
      { id: 'm19', type: 'voice', content: 'voice', sender: 'me', timestamp: new Date(Date.now() - 86400000 + 3600000 * 15), duration: '0:08', read: true },
      { id: 'm20', type: 'text', content: 'Haha your voice note is too funny! 😂', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 15 + 300000), read: true },
      { id: 'm21', type: 'text', content: 'Hey! Are you free to chat this evening?', sender: 'me', timestamp: new Date(Date.now() - 3600000 * 2), read: true },
      { id: 'm22', type: 'text', content: 'Yes! Just got back from a run. Give me 20 min to shower and I\'m all yours!', sender: 'them', timestamp: new Date(Date.now() - 3600000 * 1.5), read: true },
      { id: 'm23', type: 'text', content: 'Sounds perfect, no rush! 💪', sender: 'me', timestamp: new Date(Date.now() - 3600000), read: false },
    ],
  },
  'match-2': {
    matchName: 'Emma',
    matchAvatar: 'https://i.pravatar.cc/150?img=9',
    isOnline: false,
    lastSeen: '2h ago',
    isVerified: true,
    sharedInterests: ['Photography', 'Travel', 'Yoga'],
    icebreakers: [
      "Love your travel photos! Where was your favorite trip?",
      "How did you get into photography?",
      "Morning yoga or evening yoga? 🧘‍♀️",
    ],
    messages: [
      { id: 'e1', type: 'text', content: 'Hi Emma! Your photos are absolutely stunning 📸', sender: 'me', timestamp: new Date(Date.now() - 86400000 * 3 + 3600000 * 10), read: true },
      { id: 'e2', type: 'text', content: 'Thank you so much! I\'ve been practicing photography for about 3 years now.', sender: 'them', timestamp: new Date(Date.now() - 86400000 * 3 + 3600000 * 11), read: true },
      { id: 'e3', type: 'text', content: 'That\'s impressive! Do you shoot mostly digital or film?', sender: 'me', timestamp: new Date(Date.now() - 86400000 * 3 + 3600000 * 11 + 400000), read: true },
      { id: 'e4', type: 'text', content: 'Both actually! Film has this warmth that digital can\'t replicate, but digital is so much more flexible.', sender: 'them', timestamp: new Date(Date.now() - 86400000 * 3 + 3600000 * 12), read: true },
      { id: 'e5', type: 'text', content: 'I totally agree. I\'ve been meaning to get into film photography.', sender: 'me', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 9), read: true },
      { id: 'e6', type: 'text', content: 'You should! Start with a simple point-and-shoot. The Contax T2 is legendary but pricey.', sender: 'them', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 10), read: true },
      { id: 'e7', type: 'text', content: 'I\'ll look into it! Any tips for a beginner?', sender: 'me', timestamp: new Date(Date.now() - 86400000 + 3600000 * 8), read: true },
      { id: 'e8', type: 'text', content: 'Start with Portra 400 film — very forgiving and beautiful colors!', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 9), read: true },
      { id: 'e9', type: 'voice', content: 'voice', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 9 + 600000), duration: '0:05', read: true },
      { id: 'e10', type: 'text', content: 'Thanks for the voice tip! That\'s really helpful 🙏', sender: 'me', timestamp: new Date(Date.now() - 3600000 * 5), read: true },
      { id: 'e11', type: 'text', content: 'Of course! Let me know how your first roll turns out 😊', sender: 'them', timestamp: new Date(Date.now() - 3600000 * 4), read: true },
    ],
  },
  'match-3': {
    matchName: 'Olivia',
    matchAvatar: 'https://i.pravatar.cc/150?img=12',
    isOnline: true,
    isVerified: false,
    sharedInterests: ['Cooking', 'Netflix', 'Dogs'],
    icebreakers: [
      "What's your go-to comfort food to cook?",
      "Any Netflix recommendations? I'm looking for something new!",
      "Dog person, huh? Tell me about your pup! 🐕",
    ],
    messages: [
      { id: 'o1', type: 'text', content: 'Hey Olivia! Your dog is adorable! What\'s their name?', sender: 'me', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 14), read: true },
      { id: 'o2', type: 'text', content: 'Thank you! His name is Cooper and he\'s a golden retriever. Absolute sweetheart! 🐕', sender: 'them', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 14 + 500000), read: true },
      { id: 'o3', type: 'text', content: 'Goldens are the best! How old is he?', sender: 'me', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 15), read: true },
      { id: 'o4', type: 'text', content: 'He\'s 3! Still acts like a puppy though haha', sender: 'them', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000 * 15 + 400000), read: true },
      { id: 'o5', type: 'text', content: 'That\'s the best age! Full of energy but past the destructive puppy phase 😅', sender: 'me', timestamp: new Date(Date.now() - 86400000 + 3600000 * 10), read: true },
      { id: 'o6', type: 'text', content: 'Exactly! Though he still chews on shoes when he\'s bored 😂', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 10 + 600000), read: true },
      { id: 'o7', type: 'text', content: 'Haha that\'s Cooper\'s signature move', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 11), read: true },
      { id: 'o8', type: 'gift', content: 'Olivia sent you a coffee ☕', sender: 'them', timestamp: new Date(Date.now() - 86400000 + 3600000 * 12), read: true, giftType: 'coffee', giftPrice: '1π' },
      { id: 'o9', type: 'text', content: 'Aww thanks for the coffee! ☕ Now I have energy to take Cooper to the park!', sender: 'me', timestamp: new Date(Date.now() - 86400000 + 3600000 * 12 + 200000), read: true },
      { id: 'o10', type: 'text', content: 'Perfect timing! I\'m actually baking some cookies right now. Wish I could share through the app! 🍪', sender: 'them', timestamp: new Date(Date.now() - 3600000 * 3), read: true },
      { id: 'o11', type: 'text', content: 'Now that\'s a feature they need to add! What kind of cookies?', sender: 'me', timestamp: new Date(Date.now() - 3600000 * 2), read: true },
      { id: 'o12', type: 'text', content: 'Chocolate chip, classic! They\'re almost done. The whole apartment smells amazing!', sender: 'them', timestamp: new Date(Date.now() - 3600000), read: false },
    ],
  },
};

// ── TypingIndicator ──────────────────────────────────────

const TypingDot = React.memo(function TypingDot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block w-1.5 h-1.5 rounded-full bg-[#232323]"
      style={{ opacity: 0.35, margin: '0 2px' }}
      animate={{ scale: [0.4, 1, 0.4] }}
      transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
});

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="inline-flex items-center px-3 py-2 rounded-full" style={{ backgroundColor: '#E8E2D8' }}>
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
  if (message.type === 'gift') {
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
          <p className="text-sm font-medium mt-1.5 text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            {message.content}
          </p>
          {message.giftPrice && (
            <span className="text-xs mt-1 font-medium" style={{ color: '#BB83C9', fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {message.giftPrice}
            </span>
          )}
          <span className="text-[11px] mt-1" style={{ color: 'rgba(35,35,35,0.3)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </motion.div>
    );
  }

  // Voice message
  if (message.type === 'voice') {
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
              backgroundColor: isSent ? '#BB83C9' : 'rgba(232,226,216,0.6)',
              borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: isSent ? '#fff' : '#BB83C9' }}
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
                color: isSent ? 'rgba(255,255,255,0.8)' : 'rgba(35,35,35,0.5)',
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              }}
            >
              {message.duration}
            </span>
          </div>
          <div className={cn('flex items-center gap-1 mt-1', isSent ? 'justify-end' : 'justify-start')}>
            <span style={{ color: 'rgba(35,35,35,0.3)', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }}>
              {formatTime(message.timestamp)}
            </span>
            {isSent && message.read && (
              <CheckCheck size={12} style={{ color: 'rgba(35,35,35,0.25)' }} />
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
            backgroundColor: isSent ? '#BB83C9' : 'rgba(232,226,216,0.6)',
            borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <p
            className="text-base leading-relaxed break-words whitespace-pre-wrap"
            style={{
              color: isSent ? '#fff' : '#232323',
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
          <span style={{ color: 'rgba(35,35,35,0.3)', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11 }}>
            {formatTime(message.timestamp)}
          </span>
          {isSent && message.read && (
            <CheckCheck size={12} style={{ color: 'rgba(35,35,35,0.25)' }} />
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
      <div className="flex-1 h-px" style={{ backgroundColor: '#E8E2D8' }} />
      <span
        className="text-xs font-medium flex-shrink-0"
        style={{ color: 'rgba(35,35,35,0.35)', fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 12 }}
      >
        {date}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: '#E8E2D8' }} />
    </div>
  );
}

// ── IcebreakerChips ──────────────────────────────────────

function IcebreakerChips({ chips, onSend }: { chips: string[]; onSend: (text: string) => void }) {
  return (
    <div className="px-4 mb-3">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-xs font-medium mb-2"
        style={{ color: 'rgba(35,35,35,0.4)', fontFamily: "'Outfit', system-ui, sans-serif" }}
      >
        Start the conversation
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
              backgroundColor: '#fff',
              color: '#232323',
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
  { name: 'Coffee', icon: 'coffee', price: '1', description: 'Buy them a virtual coffee' },
  { name: 'Rose', icon: 'rose', price: '2', description: 'A classic romantic gesture' },
  { name: 'Song', icon: 'song', price: '1.5', description: 'Share a song recommendation' },
  { name: 'Spark', icon: 'spark', price: 'Free', description: 'Send your earned Spark' },
];

function GiftBottomSheet({
  isOpen,
  onClose,
  onSendGift,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (giftType: string, giftName: string) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSendGift(GIFT_OPTIONS[selected].icon, GIFT_OPTIONS[selected].name);
      onClose();
      setSelected(0);
    }, 1500);
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
            style={{ backgroundColor: 'rgba(35,35,35,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
            className="fixed bottom-0 left-0 right-0 z-[200] w-full max-w-[430px] mx-auto rounded-t-3xl"
            style={{ backgroundColor: '#fff', maxHeight: '60vh' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#E8E2D8' }} />
            </div>
            <div className="px-6 pb-6">
              <h3
                className="text-xl font-semibold mb-5"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: '#232323', letterSpacing: '-0.6px' }}
              >
                Send a Gift
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {GIFT_OPTIONS.map((gift, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelected(i)}
                    className="flex flex-col items-center p-4 rounded-2xl transition-colors"
                    style={{
                      backgroundColor: selected === i ? 'rgba(187,131,201,0.06)' : '#fff',
                      border: selected === i ? '1.5px solid #BB83C9' : '1.5px solid #E8E2D8',
                    }}
                  >
                    <GiftIconComponent type={gift.icon} size={36} />
                    <span
                      className="text-base font-semibold mt-2"
                      style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: '#232323' }}
                    >
                      {gift.name}
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
                          Free
                        </span>
                      )}
                    </div>
                    <span
                      className="text-xs mt-1 text-center"
                      style={{ color: 'rgba(35,35,35,0.5)', fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                      {gift.description}
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <img src="/pi-logo.svg" alt="Pi" className="w-4 h-4" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-sm" style={{ color: 'rgba(35,35,35,0.6)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  Your balance: 12.5 Pi
                </span>
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
                    Processing...
                  </div>
                ) : (
                  `Send ${GIFT_OPTIONS[selected].name}`
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

function RecordingOverlay({ isRecording, onCancel }: { isRecording: boolean; onCancel: () => void }) {
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
          style={{ backgroundColor: 'rgba(35,35,35,0.5)' }}
          onClick={onCancel}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: '#E86A6A' }}
          >
            <div className="w-4 h-4 rounded-full bg-white" />
          </motion.div>
          <h3
            className="text-xl font-semibold text-white mb-1"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            Recording...
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
            Tap anywhere to cancel
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
              backgroundColor: '#fff',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              minWidth: 200,
            }}
          >
            <button
              onClick={() => { onViewProfile(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#F7F4EE] transition-colors"
            >
              <User size={18} style={{ color: '#232323' }} />
              <span className="text-sm font-medium" style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: '#232323' }}>
                View Profile
              </span>
            </button>
            <button
              onClick={() => { onMute(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#F7F4EE] transition-colors"
            >
              <BellOff size={18} style={{ color: '#232323' }} />
              <span className="text-sm font-medium" style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: '#232323' }}>
                Mute Notifications
              </span>
            </button>
            <button
              onClick={() => { onBlock(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#F7F4EE] transition-colors"
            >
              <UserX size={18} style={{ color: '#232323' }} />
              <span className="text-sm font-medium" style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: '#232323' }}>
                Block User
              </span>
            </button>
            <div className="h-px" style={{ backgroundColor: '#E8E2D8' }} />
            <button
              onClick={() => { onReport(); onClose(); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#F7F4EE] transition-colors"
            >
              <Flag size={18} style={{ color: '#E86A6A' }} />
              <span className="text-sm font-medium" style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: '#E86A6A' }}>
                Report
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
              backgroundColor: '#232323',
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversation = CONVERSATIONS[matchId || ''] || CONVERSATIONS['match-1'];
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showGiftSheet, setShowGiftSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [showIcebreakers, setShowIcebreakers] = useState(conversation.messages.length < 5);

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

  // Simulate typing indicator occasionally
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === 'me') {
      const timer = setTimeout(() => {
        setIsTyping(true);
        const replyTimer = setTimeout(() => {
          setIsTyping(false);
          // Auto-reply with contextual message
          const replies = [
            'That\'s really interesting! Tell me more 😊',
            'Haha totally agree!',
            'I was just thinking the same thing!',
            'Wow, I didn\'t know that!',
            'Haha you\'re so funny! 😂',
          ];
          const reply: Message = {
            id: `auto-${Date.now()}`,
            type: 'text',
            content: replies[Math.floor(Math.random() * replies.length)],
            sender: 'them',
            timestamp: new Date(),
            read: false,
          };
          setMessages((prev) => [...prev, reply]);
        }, 3000);
        return () => clearTimeout(replyTimer);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      type: 'text',
      content: text.trim(),
      sender: 'me',
      timestamp: new Date(),
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setShowIcebreakers(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  }, []);

  const handleSendGift = useCallback(
    (giftType: string, giftName: string) => {
      const giftMsg: Message = {
        id: `gift-${Date.now()}`,
        type: 'gift',
        content: `You sent ${conversation.matchName} a ${giftName.toLowerCase()} ${giftType === 'coffee' ? '\u2615' : giftType === 'rose' ? '\ud83c\udf39' : giftType === 'song' ? '\ud83c\udfb5' : '\u2728'}`,
        sender: 'me',
        timestamp: new Date(),
        giftType: giftType as 'coffee' | 'rose' | 'song' | 'spark',
        read: false,
      };
      setMessages((prev) => [...prev, giftMsg]);
      showToast(`${giftName} sent!`);
    },
    [conversation.matchName, showToast]
  );

  const handleAutoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '40px';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  // Voice recording simulation
  const handleMicPress = useCallback(() => {
    if (inputText.trim()) {
      handleSendMessage(inputText);
      return;
    }
    setIsRecording(true);
  }, [inputText, handleSendMessage]);

  const handleRecordingCancel = useCallback(() => {
    setIsRecording(false);
  }, []);

  // Simulate voice message send after recording
  useEffect(() => {
    if (!isRecording) return;
    const timer = setTimeout(() => {
      setIsRecording(false);
      const voiceMsg: Message = {
        id: `voice-${Date.now()}`,
        type: 'voice',
        content: 'voice',
        sender: 'me',
        timestamp: new Date(),
        duration: '0:04',
        read: false,
      };
      setMessages((prev) => [...prev, voiceMsg]);
    }, 4000);
    return () => clearTimeout(timer);
  }, [isRecording]);

  const handleIcebreakerSend = useCallback(
    (text: string) => {
      handleSendMessage(text);
    },
    [handleSendMessage]
  );

  // Dropdown actions
  const handleViewProfile = () => navigate(`/profile`);
  const handleMute = () => showToast('Notifications muted');
  const handleBlock = () => {
    showToast('User blocked');
    setTimeout(() => navigate('/matches'), 1500);
  };
  const handleReport = () => showToast('Report submitted');

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);
  const hasText = inputText.trim().length > 0;

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: '#F7F4EE' }}>
      <div className="w-full max-w-[430px] relative flex flex-col" style={{ backgroundColor: '#F7F4EE' }}>
        {/* ── Chat Header ── */}
        <div
          className="sticky top-0 z-40 flex items-center justify-between px-3"
          style={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            paddingTop: 'env(safe-area-inset-top)',
            height: 'calc(56px + env(safe-area-inset-top))',
            borderBottom: '1px solid rgba(232,226,216,0.5)',
          }}
        >
          {/* Left: Back + Avatar + Name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.12 }}
              onClick={() => navigate('/matches')}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)' }}
            >
              <ChevronLeft size={24} className="text-[#232323]" strokeWidth={2} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleViewProfile}
              className="flex items-center gap-2 min-w-0"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={conversation.matchAvatar}
                  alt={conversation.matchName}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: conversation.isOnline ? '2px solid #BB83C9' : '2px solid transparent' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${conversation.matchName}&background=BB83C9&color=fff`;
                  }}
                />
                {conversation.isOnline && (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#7DE0B3] border-2 border-white"
                  />
                )}
              </div>
              <div className="min-w-0 text-left">
                <p
                  className="text-base font-semibold truncate"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: '#232323', letterSpacing: '-0.32px', lineHeight: 1.3 }}
                >
                  {conversation.matchName}
                </p>
                <p
                  className="text-xs truncate"
                  style={{
                    fontFamily: "'Outfit', system-ui, sans-serif",
                    color: conversation.isOnline ? '#7DE0B3' : 'rgba(35,35,35,0.4)',
                  }}
                >
                  {conversation.isOnline ? 'Active now' : conversation.lastSeen || 'Offline'}
                </p>
              </div>
            </motion.button>
          </div>

          {/* Right: Video + More */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className="w-10 h-10 rounded-full flex items-center justify-center"
            >
              <Video size={22} style={{ color: 'rgba(35,35,35,0.6)' }} strokeWidth={2} />
            </motion.button>
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.12 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
              >
                <MoreVertical size={20} style={{ color: 'rgba(35,35,35,0.6)' }} />
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
            backgroundColor: '#F7F4EE',
            padding: '8px 0 16px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <RecordingOverlay isRecording={isRecording} onCancel={handleRecordingCancel} />

          {groupedMessages.map((group) => (
            <div key={group.date}>
              <DateDivider date={group.date} />
              {group.items.map((msg) => (
                <div key={msg.id} className="px-4">
                  <ChatBubble message={msg} />
                </div>
              ))}
            </div>
          ))}

          {isTyping && (
            <div className="px-4">
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Icebreakers ── */}
        <AnimatePresence>
          {showIcebreakers && messages.length < 5 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <IcebreakerChips chips={conversation.icebreakers} onSend={handleIcebreakerSend} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Message Input ── */}
        <div
          className="flex-shrink-0 z-40"
          style={{
            backgroundColor: '#fff',
            borderTop: '1px solid rgba(232,226,216,0.5)',
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

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleAutoResize();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputText);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full resize-none outline-none px-4 py-2.5 text-base"
                style={{
                  backgroundColor: 'rgba(232,226,216,0.4)',
                  borderRadius: 24,
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  color: '#232323',
                  fontSize: 16,
                  lineHeight: 1.5,
                  minHeight: 40,
                  maxHeight: 120,
                  letterSpacing: '-0.32px',
                }}
                onFocus={(e) => {
                  (e.target as HTMLTextAreaElement).style.backgroundColor = 'rgba(232,226,216,0.6)';
                  (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(187,131,201,0.15)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLTextAreaElement).style.backgroundColor = 'rgba(232,226,216,0.4)';
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
                  <Mic size={22} style={{ color: 'rgba(35,35,35,0.5)' }} strokeWidth={2} />
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
        />

        {/* ── Toast ── */}
        <Toast message={toast.message} isVisible={toast.visible} onClose={hideToast} />
      </div>
    </div>
  );
}
