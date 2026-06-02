import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  MapPin,
  Shield,
  Flame,
  ThumbsUp,
  Star,
  Settings,
  ChevronRight,
  Check,
  Lock,
  Trophy,
  Sparkles,
  MessageCircle,
  Calendar,
  Heart,
  X,
  Camera,
  Award,
  CheckCircle2,
  Zap,
  Users,
  HelpCircle,
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Layout from '@/components/Layout';

/* ───────────────────── Mock User Data ───────────────────── */

const mockUser = {
  name: 'Sarah',
  age: 26,
  location: 'San Francisco, CA',
  distance: '2 miles away',
  bio: 'Coffee enthusiast, hiking lover, and board game nerd. Looking for someone to share adventures and lazy Sundays with. I believe the best connections start with genuine curiosity.',
  photos: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=600&fit=crop',
  ],
  interests: ['Coffee', 'Hiking', 'Board Games', 'Photography', 'Yoga', 'Travel', 'Cooking', 'Music'],
  goals: 'Serious relationship',
  trustScore: 82,
  sparkBalance: 12,
  verified: true,
  isOwnProfile: true,
};

const goalConfig: Record<string, { color: string; icon: typeof Heart }> = {
  'Serious relationship': { color: '#BB83C9', icon: Heart },
  'Casual dating': { color: '#7BC4E8', icon: Star },
  'Interest-based connections': { color: '#7DE0B3', icon: Users },
  'Not sure yet': { color: '#F0B84A', icon: HelpCircle },
};

/* ───────────────────── Easing Tokens ───────────────────── */

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];
const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];
/* ───────────────────── Animated Counter ───────────────────── */

function AnimatedCounter({ target, duration = 800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true });

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    let animFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      }
    };
    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [inView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

/* ───────────────────── Trust Score Circle ───────────────────── */

function TrustScoreCircle({ score }: { score: number }) {
  const { ref, inView } = useInView({ triggerOnce: true });
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const progress = inView ? score / 100 : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const zoneColor = score <= 40 ? '#E86A6A' : score <= 75 ? '#F0B84A' : '#7DE0B3';

  return (
    <div ref={ref} className="flex flex-col items-center">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#E8E2D8"
          strokeWidth="6"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={zoneColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: easeOutExpo }}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: 80, height: 80 }}>
        <span className="text-2xl font-bold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          <AnimatedCounter target={score} />
        </span>
        <span className="text-xs text-[#232323] opacity-40" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>/100</span>
      </div>
    </div>
  );
}

/* ───────────────────── Trust Score Gradient Bar ───────────────────── */

function TrustScoreBar({ score }: { score: number }) {
  const { ref, inView } = useInView({ triggerOnce: true });

  return (
    <div ref={ref} className="relative w-full mt-4">
      <div className="w-full h-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #E86A6A 0%, #E86A6A 40%, #F0B84A 40%, #F0B84A 75%, #7DE0B3 75%, #7DE0B3 100%)',
            width: inView ? '100%' : '0%',
            transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#232323]"
        initial={{ left: '0%' }}
        animate={{ left: `${score}%` }}
        transition={{ duration: 0.8, ease: easeSpring, delay: 0.2 }}
        style={{ transform: 'translate(-50%, -50%)' }}
      />
    </div>
  );
}

/* ───────────────────── Spark Balance Card ───────────────────── */

function SparkBalanceCard({ balance }: { balance: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, ease: easeOutExpo }}
      className="mx-5 mt-6 p-5 rounded-[20px] bg-white"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(125,224,179,0.15)' }}>
            <Zap size={22} className="text-[#7DE0B3]" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            Your Sparks
          </h3>
        </div>
        <span className="text-xl font-bold text-[#7DE0B3]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {balance}
        </span>
      </div>
      <p className="mt-3 text-sm text-[#232323] opacity-60" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.55 }}>
        Sparks are earned through activity — not bought. Send them to show someone special attention.
      </p>
      <div className="mt-4 space-y-2">
        {[
          { text: 'Verify your identity', amount: '+5 Sparks', done: true },
          { text: 'Complete your profile', amount: '+3 Sparks', done: true },
          { text: 'Join a club', amount: '+1 Spark/day', done: false },
          { text: 'Invite a friend', amount: '+10 Sparks', done: false },
        ].map((item) => (
          <div key={item.text} className="flex items-center justify-between text-sm">
            <span className={item.done ? 'text-[#7DE0B3]' : 'text-[#232323]'} style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {item.done ? <Check size={14} className="inline mr-1" /> : <span className="inline mr-1 opacity-30">○</span>}
              {item.text}
            </span>
            <span className={item.done ? 'text-[#7DE0B3] font-medium' : 'text-[#232323] opacity-40'} style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {item.amount}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ───────────────────── Photo Lightbox ───────────────────── */

function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] bg-[#232323] flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4 z-10">
        <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <X size={24} className="text-white" strokeWidth={2} />
        </button>
        <span className="text-sm text-white font-medium" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          {current + 1} / {photos.length}
        </span>
        <div className="w-10" />
      </div>
      <div className="flex-1 flex items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={photos[current]}
          alt={`Photo ${current + 1}`}
          className="max-w-full max-h-full object-contain rounded-xl"
        />
      </div>
      <div className="flex justify-center gap-2 p-6">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
            className="w-2 h-2 rounded-full transition-all"
            style={{ backgroundColor: i === current ? '#BB83C9' : 'rgba(255,255,255,0.3)' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ═════════════════════════ MAIN PROFILE PAGE ═════════════════════════ */

export default function Profile() {
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [bio, setBio] = useState(mockUser.bio);
  const [showBioEdit, setShowBioEdit] = useState(false);
  const [editBioText, setEditBioText] = useState(mockUser.bio);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showBadgeDetail, setShowBadgeDetail] = useState<string | null>(null);

  const trustZone = mockUser.trustScore <= 40 ? 'Building Trust' : mockUser.trustScore <= 75 ? 'Getting There' : 'Highly Trusted';
  const trustZoneColor = mockUser.trustScore <= 40 ? '#E86A6A' : mockUser.trustScore <= 75 ? '#F0B84A' : '#7DE0B3';

  const goalInfo = goalConfig[mockUser.goals] || goalConfig['Not sure yet'];
  const GoalIcon = goalInfo.icon;

  const handleSaveBio = () => {
    setBio(editBioText);
    setShowBioEdit(false);
  };

  const badges = [
    { id: 'verified', name: 'Verified Identity', icon: Shield, color: '#7DE0B3', earned: true, desc: 'Complete selfie verification to earn this badge' },
    { id: 'party', name: 'Life of the Party', icon: Sparkles, color: '#7BC4E8', earned: true, desc: 'Join 3+ clubs to earn this badge' },
    { id: 'pro', name: 'Dating Pro', icon: Trophy, color: '#BB83C9', earned: true, desc: 'Complete 3 real meetups with positive feedback' },
    { id: 'spark', name: 'Spark Giver', icon: Zap, color: '#FFD700', earned: false, desc: 'Send 10 Sparks to earn this badge' },
    { id: 'chatty', name: 'Conversationalist', icon: MessageCircle, color: '#7DE0B3', earned: false, desc: 'Send 50 messages to earn this badge' },
    { id: 'event', name: 'Event Goer', icon: Calendar, color: '#F0B84A', earned: false, desc: 'Attend 2 events to earn this badge' },
    { id: 'profile', name: 'Profile Pro', icon: Award, color: '#7BC4E8', earned: true, desc: 'Complete 100% of your profile' },
    { id: 'trust', name: 'Trust Builder', icon: Heart, color: '#BB83C9', earned: true, desc: 'Reach a Trust Score above 80' },
  ];

  return (
    <Layout
      title="Profile"
      rightAction={
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.12 }}
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(12px)' }}
        >
          <Settings size={22} className="text-[#232323]" strokeWidth={2} />
        </motion.button>
      }
    >
      <div className="flex flex-col pb-8">

        {/* ─────────────── Hero Section ─────────────── */}
        <div className="relative w-full" style={{ height: '45vh', maxHeight: 400 }}>
          <img
            src={mockUser.photos[0]}
            alt={`${mockUser.name}'s profile`}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(35,35,35,0.9) 100%)' }}
          />
          {/* Edit photo button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onClick={() => setIsEditMode(!isEditMode)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(12px)' }}
          >
            <Pencil size={20} className="text-white" strokeWidth={2} />
          </motion.button>

          {/* Profile info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[28px] font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.15 }}>
                {mockUser.name}, {mockUser.age}
              </h1>
              {mockUser.verified && (
                <div className="w-5 h-5 rounded-full bg-[#7DE0B3] flex items-center justify-center">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-white opacity-80" strokeWidth={2} />
              <span className="text-sm text-white opacity-80 font-medium" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {mockUser.location}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-white opacity-50" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {mockUser.distance}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7DE0B3] text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                87% Match
              </span>
            </div>
          </div>
        </div>

        {/* ─────────────── Trust Score Card ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOutExpo, delay: 0.1 }}
          className="relative -mt-5 mx-0 bg-white rounded-t-[24px] p-6 z-10"
          style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Trust Score
            </h3>
            <button
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-[#232323]"
              style={{ backgroundColor: 'rgba(35,35,35,0.1)' }}
              title="Your Trust Score helps us show you to quality matches. It increases with verification, activity, and positive feedback."
            >
              i
            </button>
          </div>

          {/* Score Circle */}
          <div className="flex flex-col items-center mb-4 relative">
            <TrustScoreCircle score={mockUser.trustScore} />
            <p className="mt-2 text-base font-semibold" style={{ color: trustZoneColor, fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {trustZone}
            </p>
          </div>

          {/* Score Progress Bar */}
          <TrustScoreBar score={mockUser.trustScore} />

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { icon: Shield, label: 'Verification', score: '+30', desc: 'Verify to earn', color: '#BB83C9' },
              { icon: Flame, label: 'Activity', score: '+32', desc: 'Stay active', color: '#F0B84A' },
              { icon: ThumbsUp, label: 'Feedback', score: '+20', desc: 'Get positive reviews', color: '#7DE0B3' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center">
                <item.icon size={20} style={{ color: item.color }} strokeWidth={2} />
                <span className="mt-1.5 text-xs font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  {item.label}
                </span>
                <span className="text-xs font-bold" style={{ color: item.color, fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  {item.score}
                </span>
                <span className="text-[10px] text-[#232323] opacity-40" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─────────────── Bio & Interests ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
          className="px-5 mt-6"
        >
          {/* Bio */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                About
              </h4>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setEditBioText(bio); setShowBioEdit(true); }}
              >
                <Pencil size={16} className="text-[#BB83C9]" strokeWidth={2} />
              </motion.button>
            </div>
            {bio ? (
              <p className="text-base text-[#232323] leading-relaxed" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
                {bio}
              </p>
            ) : (
              <div className="text-center py-4">
                <p className="text-base text-[#232323] opacity-35" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  Add a bio to help people get to know you
                </p>
                <button
                  onClick={() => { setEditBioText(''); setShowBioEdit(true); }}
                  className="mt-2 text-base font-semibold text-[#BB83C9]"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  Add Bio
                </button>
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                Interests
              </h4>
              <Pencil size={16} className="text-[#BB83C9] opacity-50" strokeWidth={2} />
            </div>
            <div className="flex flex-wrap gap-2">
              {mockUser.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm text-[#232323]"
                  style={{ backgroundColor: '#E8E2D8', fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Dating Goals */}
          <div className="mb-2">
            <h4 className="text-base font-semibold text-[#232323] mb-3" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Looking for
            </h4>
            <div
              className="inline-flex items-center gap-2.5 px-4 py-3 rounded-[16px] bg-white border-2"
              style={{ borderColor: goalInfo.color, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <GoalIcon size={20} style={{ color: goalInfo.color }} strokeWidth={2} />
              <span className="text-sm font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {mockUser.goals}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ─────────────── Photo Gallery ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
          className="px-5 mt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                Photos
              </h4>
              <span className="text-xs text-[#232323] opacity-40" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {mockUser.photos.length}/9
              </span>
            </div>
            <button className="text-base font-semibold text-[#BB83C9]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Edit
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {mockUser.photos.map((photo, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: easeOutExpo }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLightboxIndex(index)}
                className="relative aspect-square rounded-xl overflow-hidden"
              >
                <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                {index === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#BB83C9] text-white text-[10px] font-semibold" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    Main
                  </div>
                )}
              </motion.button>
            ))}
            {mockUser.photos.length < 9 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="aspect-square rounded-xl border-2 border-dashed border-[#E8E2D8] flex items-center justify-center"
              >
                <Camera size={24} className="text-[#232323] opacity-30" strokeWidth={2} />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ─────────────── Badges Row ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
          className="mt-6"
        >
          <div className="px-5 mb-3">
            <h4 className="text-base font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Achievements
            </h4>
          </div>
          <div
            className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
          >
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <motion.button
                  key={badge.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBadgeDetail(badge.id)}
                  className="flex-shrink-0 snap-start flex flex-col items-center justify-center w-[80px] h-[100px] rounded-[16px] bg-white p-3"
                  style={{
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    opacity: badge.earned ? 1 : 0.3,
                  }}
                >
                  <div className="relative">
                    <Icon size={32} style={{ color: badge.earned ? badge.color : '#999' }} strokeWidth={2} />
                    {!badge.earned && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock size={14} className="text-[#232323] opacity-60" strokeWidth={2} />
                      </div>
                    )}
                  </div>
                  <span className="mt-2 text-xs font-semibold text-[#232323] text-center leading-tight" style={{ fontFamily: "'Outfit', system-ui, sans-serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {badge.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ─────────────── Spark Balance ─────────────── */}
        <SparkBalanceCard balance={mockUser.sparkBalance} />

        {/* ─────────────── Settings Link ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, ease: easeOutExpo }}
          className="px-5 mt-6"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
            onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-[16px] bg-white text-left"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center gap-3">
              <Settings size={22} className="text-[#232323] opacity-60" strokeWidth={2} />
              <span className="text-base font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                Settings
              </span>
            </div>
            <ChevronRight size={20} className="text-[#232323] opacity-30" strokeWidth={2} />
          </motion.button>
        </motion.div>

        {/* Bottom padding for footer */}
        <div className="h-4" />
      </div>

      {/* ─────────────── Bio Edit Dialog ─────────────── */}
      <Dialog open={showBioEdit} onOpenChange={setShowBioEdit}>
        <DialogContent className="rounded-[20px] max-w-[340px] bg-white border-0" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Edit Bio
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editBioText}
            onChange={(e) => setEditBioText(e.target.value)}
            placeholder="Tell people about yourself..."
            className="mt-2 min-h-[120px] rounded-xl border-[1.5px] border-transparent bg-[rgba(232,226,216,0.4)] text-base text-[#232323] placeholder:text-[#232323] placeholder:opacity-35 focus:border-[#BB83C3] focus:ring-[3px] focus:ring-[rgba(187,131,201,0.15)] resize-none"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          />
          <div className="flex gap-3 mt-4">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowBioEdit(false)}
              className="flex-1 h-12 rounded-full border border-[rgba(35,35,35,0.1)] bg-[rgba(255,255,255,0.72)] text-base font-semibold text-[#232323]"
              style={{ backdropFilter: 'blur(12px)', fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveBio}
              className="flex-1 h-12 rounded-full bg-[#BB83C9] text-white text-base font-semibold"
              style={{ boxShadow: '0 4px 16px rgba(187,131,201,0.3)', fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Save
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─────────────── Badge Detail Dialog ─────────────── */}
      <Dialog open={!!showBadgeDetail} onOpenChange={() => setShowBadgeDetail(null)}>
        <DialogContent className="rounded-[20px] max-w-[300px] bg-white border-0 text-center" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          {(() => {
            const badge = badges.find((b) => b.id === showBadgeDetail);
            if (!badge) return null;
            const Icon = badge.icon;
            return (
              <>
                <div className="flex flex-col items-center py-2">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: badge.earned ? `${badge.color}20` : 'rgba(232,226,216,0.4)' }}
                  >
                    <Icon size={32} style={{ color: badge.earned ? badge.color : '#999' }} strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-semibold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    {badge.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#232323] opacity-60" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    {badge.desc}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{
                    backgroundColor: badge.earned ? 'rgba(125,224,179,0.15)' : 'rgba(240,184,74,0.15)',
                    color: badge.earned ? '#5BC492' : '#F0B84A',
                  }}>
                    {badge.earned ? (
                      <><CheckCircle2 size={12} strokeWidth={2} /> Earned</>
                    ) : (
                      <><Lock size={12} strokeWidth={2} /> Locked</>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─────────────── Photo Lightbox ─────────────── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={mockUser.photos}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
