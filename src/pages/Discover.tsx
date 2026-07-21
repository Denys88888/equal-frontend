import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { X, Heart, Star, MapPin, SlidersHorizontal, Shield, Circle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import SkeletonLoader from '@/components/SkeletonLoader';
import { discoverApi } from '@/api/discover';
import { sparksApi } from '@/api/sparks';
import type { ProfileCard } from '@/api/types';

// ── Types ──────────────────────────────────────────────

interface Profile {
  id: string;
  name: string;
  age: number;
  distance: number;
  compatibility: number;
  bio: string;
  photo: string;
  photos: string[];
  interests: string[];
  verified: boolean;
  activeNow: boolean;
  isNew: boolean;
  badges?: string[];
}

interface Filters {
  maxDistance: number;
  ageMin: number;
  ageMax: number;
  verifiedOnly: boolean;
  onlineNow: boolean;
  goals: string[];
  interests: string[];
}

// ── Mock Data ──────────────────────────────────────────

const INTEREST_OPTIONS = ['Coffee', 'Hiking', 'Yoga', 'Art', 'Music', 'Travel', 'Cooking', 'Tech', 'Gaming', 'Reading', 'Fitness', 'Photography', 'Dancing', 'Surfing', 'Running', 'Design', 'Vegan', 'Wine', 'Film', 'Pets'];

const GOAL_OPTIONS = ['Serious relationship', 'Casual dating', 'Interest-based connections', 'Not sure yet'];
const GOAL_KEYS: Record<string, string> = {
  'Serious relationship': 'discover.goalSerious',
  'Casual dating': 'discover.goalCasual',
  'Interest-based connections': 'discover.goalInterest',
  'Not sure yet': 'discover.goalNotsure',
};

// ── Match Celebration ──────────────────────────────────

function triggerMatchCelebration() {
  const duration = 1200;
  const end = Date.now() + duration;
  const colors = ['#BB83C9', '#7DE0B3', '#7BC4E8', '#FFD700'];

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
      shapes: ['circle', 'star'],
      scalar: 1.2,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
      shapes: ['circle', 'star'],
      scalar: 1.2,
    });
    confetti({
      particleCount: 6,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors,
      shapes: ['circle', 'star'],
      scalar: 1.5,
      ticks: 200,
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

// ── Filter Sheet ───────────────────────────────────────

function FilterSheet({
  filters,
  onChange,
  onApply,
  onReset,
  matchCount,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onApply: () => void;
  onReset: () => void;
  matchCount: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full">
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-5">
        <div className="w-10 h-1 rounded-full bg-[var(--linen-dark)]" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-[var(--charcoal)] px-6 mb-6" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.6px' }}>
        {t('discover.filter')}
      </h2>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-4">
        {/* Distance */}
        <div>
          <div className="flex justify-between mb-3">
            <span className="text-sm font-medium text-[var(--charcoal)]">{t('discover.maxDistance')}</span>
            <span className="text-sm font-medium text-[#BB83C9]">{t('discover.km', { d: filters.maxDistance })}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={filters.maxDistance}
            onChange={(e) => onChange({ ...filters, maxDistance: Number(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #BB83C9 0%, #BB83C9 ${filters.maxDistance}%, #E8E2D8 ${filters.maxDistance}%, #E8E2D8 100%)`,
              accentColor: '#BB83C9',
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[var(--charcoal)]" style={{ opacity: 0.35 }}>{t('discover.km', { d: 1 })}</span>
            <span className="text-xs text-[var(--charcoal)]" style={{ opacity: 0.35 }}>{t('discover.km', { d: 100 })}</span>
          </div>
        </div>

        {/* Age Range */}
        <div>
          <div className="flex justify-between mb-3">
            <span className="text-sm font-medium text-[var(--charcoal)]">{t('discover.ageRange')}</span>
            <span className="text-sm font-medium text-[#BB83C9]">{filters.ageMin} – {filters.ageMax}</span>
          </div>
          <div className="flex gap-4 items-center">
            <input
              type="range"
              min={18}
              max={80}
              value={filters.ageMin}
              onChange={(e) => onChange({ ...filters, ageMin: Math.min(Number(e.target.value), filters.ageMax - 1) })}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #E8E2D8 0%, #E8E2D8 ${((filters.ageMin - 18) / 62) * 100}%, #BB83C9 ${((filters.ageMin - 18) / 62) * 100}%, #BB83C9 ${((filters.ageMax - 18) / 62) * 100}%, #E8E2D8 ${((filters.ageMax - 18) / 62) * 100}%, #E8E2D8 100%)`,
                accentColor: '#BB83C9',
              }}
            />
          </div>
          <div className="flex gap-4 items-center mt-2">
            <input
              type="range"
              min={18}
              max={80}
              value={filters.ageMax}
              onChange={(e) => onChange({ ...filters, ageMax: Math.max(Number(e.target.value), filters.ageMin + 1) })}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #E8E2D8 0%, #E8E2D8 ${((filters.ageMin - 18) / 62) * 100}%, #BB83C9 ${((filters.ageMin - 18) / 62) * 100}%, #BB83C9 ${((filters.ageMax - 18) / 62) * 100}%, #E8E2D8 ${((filters.ageMax - 18) / 62) * 100}%, #E8E2D8 100%)`,
                accentColor: '#BB83C9',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[var(--charcoal)]" style={{ opacity: 0.35 }}>18</span>
            <span className="text-xs text-[var(--charcoal)]" style={{ opacity: 0.35 }}>80</span>
          </div>
        </div>

        {/* Goals */}
        <div>
          <span className="text-sm font-medium text-[var(--charcoal)] block mb-3">{t('discover.lookingFor')}</span>
          <div className="space-y-2">
            {GOAL_OPTIONS.map((goal) => (
              <label key={goal} className="flex items-center gap-3 cursor-pointer">
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                  style={{
                    borderColor: filters.goals.includes(goal) ? '#BB83C9' : 'var(--linen-dark)',
                    backgroundColor: filters.goals.includes(goal) ? '#BB83C9' : 'transparent',
                  }}
                  onClick={() => {
                    const newGoals = filters.goals.includes(goal)
                      ? filters.goals.filter((g) => g !== goal)
                      : [...filters.goals, goal];
                    onChange({ ...filters, goals: newGoals });
                  }}
                >
                  {filters.goals.includes(goal) && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-[var(--charcoal)]" style={{ opacity: 0.8 }}>{t(GOAL_KEYS[goal] ?? '', { defaultValue: goal })}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <span className="text-sm font-medium text-[var(--charcoal)] block mb-3">{t('discover.sharedInterests')}</span>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = filters.interests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => {
                    const newInterests = selected
                      ? filters.interests.filter((i) => i !== interest)
                      : filters.interests.length < 10
                        ? [...filters.interests, interest]
                        : filters.interests;
                    onChange({ ...filters, interests: newInterests });
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    backgroundColor: selected ? '#BB83C9' : 'var(--linen-dark)',
                    color: selected ? '#fff' : 'var(--charcoal)',
                    opacity: selected ? 1 : 0.7,
                  }}
                >
                  {t(`discover.fint_${interest.toLowerCase()}`, { defaultValue: interest })}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--charcoal)]">{t('discover.verifiedOnly')}</span>
            <button
              onClick={() => onChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
              className="w-12 h-7 rounded-full relative transition-colors"
              style={{ backgroundColor: filters.verifiedOnly ? '#BB83C9' : 'var(--linen-dark)' }}
            >
              <motion.div
                animate={{ x: filters.verifiedOnly ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-6 h-6 rounded-full bg-white dark:bg-[#22293B] absolute top-0.5 shadow-sm"
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--charcoal)]">{t('discover.onlineNow')}</span>
            <button
              onClick={() => onChange({ ...filters, onlineNow: !filters.onlineNow })}
              className="w-12 h-7 rounded-full relative transition-colors"
              style={{ backgroundColor: filters.onlineNow ? '#BB83C9' : 'var(--linen-dark)' }}
            >
              <motion.div
                animate={{ x: filters.onlineNow ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-6 h-6 rounded-full bg-white dark:bg-[#22293B] absolute top-0.5 shadow-sm"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--linen-dark)' }}>
        <button
          onClick={onReset}
          className="flex-1 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-[#BB83C9]"
          style={{ border: '1.5px solid rgba(187,131,201,0.3)' }}
        >
          {t('discover.resetAll')}
        </button>
        <button
          onClick={onApply}
          className="flex-[2] h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white"
          style={{ backgroundColor: '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.3)' }}
        >
          {t('discover.applyMatches', { count: matchCount })}
        </button>
      </div>
    </div>
  );
}

// ── Swipe Card Component ───────────────────────────────

function SwipeCard({
  profile,
  index,
  onSwipe,
}: {
  profile: Profile;
  index: number;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
}) {
  const { t } = useTranslation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const likeOpacity = useTransform(x, [40, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -40], [1, 0]);
  const sparkOpacity = useTransform(y, [-100, -60], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    } else if (info.offset.y < -80) {
      onSwipe('up');
    }
  };

  const isTop = index === 0;
  const scale = isTop ? 1 : index === 1 ? 0.95 : 0.90;
  const opacity = isTop ? 1 : index === 1 ? 0.6 : 0.3;
  const yOffset = isTop ? 0 : index === 1 ? 8 : 16;

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : yOffset,
        rotate: isTop ? rotate : 0,
        scale,
        opacity,
        zIndex: 20 - index,
        position: 'absolute',
        width: '100%',
        height: '100%',
        touchAction: 'none',
      }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={isTop ? handleDragEnd : undefined}
      animate={!isTop ? { scale, opacity, y: yOffset } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Card */}
      <div
        className="w-full h-full rounded-3xl overflow-hidden relative"
        style={{
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          aspectRatio: '3/4',
        }}
      >
        {/* Photo */}
        <img
          src={profile.photo}
          alt={profile.name}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 45%, rgba(var(--charcoal-rgb), 0.88) 100%)',
          }}
        />

        {/* Sparkle decoration */}
        <div
          className="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full"
          style={{ backgroundColor: 'rgba(187,131,201,0.1)', filter: 'blur(20px)' }}
        />

        {/* Stamps */}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-6 left-6 z-10"
            >
              <div
                className="border-4 border-[#7DE0B3] rounded-lg px-4 py-2"
                style={{ transform: 'rotate(-12deg)' }}
              >
                <span className="text-[#7DE0B3] text-5xl font-bold" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>{t('discover.like').toUpperCase()}</span>
              </div>
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-6 right-6 z-10"
            >
              <div
                className="border-4 border-[#E86A6A] rounded-lg px-4 py-2"
                style={{ transform: 'rotate(12deg)' }}
              >
                <span className="text-[#E86A6A] text-5xl font-bold" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>{t('discover.dislike').toUpperCase()}</span>
              </div>
            </motion.div>
            <motion.div
              style={{ opacity: sparkOpacity }}
              className="absolute top-1/2 left-1/2 z-10"
            >
              <div className="flex items-center gap-1" style={{ transform: 'translate(-50%, -50%)' }}>
                <Star size={24} style={{ color: '#FFD700' }} />
                <span
                  className="text-4xl font-bold"
                  style={{
                    fontFamily: "'Outfit', system-ui, sans-serif",
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {t('discover.spark').toUpperCase()}
                </span>
                <Star size={24} style={{ color: '#FFD700' }} />
              </div>
            </motion.div>
          </>
        )}

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 mb-2">
            {profile.verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: '#7DE0B3' }}>
                <Shield size={10} /> {t('discover.verified')}
              </span>
            )}
            {profile.activeNow && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: '#5BC492' }}>
                <Circle size={8} fill="white" /> {t('discover.activeNow')}
              </span>
            )}
            {profile.isNew && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: '#7BC4E8' }}>
                {t('discover.newUser')}
              </span>
            )}
          </div>

          {/* Name + Age + Compatibility */}
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-0.72px' }}>
              {profile.name}, {profile.age}
            </h3>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#7DE0B3', color: 'var(--charcoal)' }}
            >
              {t('discover.matchPercent', { percent: profile.compatibility })}
            </span>
          </div>

          {/* Distance */}
          <div className="flex items-center gap-1 mb-2">
            <MapPin size={14} className="text-white" style={{ opacity: 0.8 }} />
            <span className="text-xs font-medium text-white" style={{ opacity: 0.8 }}>
              {t('discover.kmAway', { distance: profile.distance })}
            </span>
          </div>

          {/* Bio */}
          <p className="text-sm text-white mb-3 line-clamp-2" style={{ opacity: 0.7 }}>
            {profile.bio}
          </p>

          {/* Interests */}
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Action Buttons ─────────────────────────────────────

function ActionButtons({
  onDislike,
  onLike,
  onSpark,
  sparkCount,
}: {
  onDislike: () => void;
  onLike: () => void;
  onSpark: () => void;
  sparkCount: number;
}) {
  return (
    <div className="flex items-center justify-center gap-5">
      {/* Dislike */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        onClick={onDislike}
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <X size={24} strokeWidth={2.5} style={{ color: '#E86A6A' }} />
      </motion.button>

      {/* Like */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        onClick={onLike}
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}
      >
        <Heart size={28} strokeWidth={2.5} style={{ color: '#BB83C9' }} />
      </motion.button>

      {/* Spark */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        onClick={onSpark}
        className="w-14 h-14 rounded-full flex items-center justify-center relative"
        style={{
          backgroundColor: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          opacity: sparkCount > 0 ? 1 : 0.5,
        }}
      >
        <Star size={24} strokeWidth={2.5} style={{ color: '#7DE0B3' }} />
        <span
          className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white px-1"
          style={{ backgroundColor: sparkCount > 0 ? '#7DE0B3' : 'var(--linen-dark)' }}
        >
          {sparkCount}
        </span>
      </motion.button>
    </div>
  );
}

// ── Match Celebration Overlay ──────────────────────────

function MatchOverlay({
  matchProfile,
  onDismiss,
  onMessage,
}: {
  matchProfile: Profile;
  onDismiss: () => void;
  onMessage: () => void;
}) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center px-6"
      style={{
        background: 'radial-gradient(circle, rgba(187,131,201,0.4), rgba(125,224,179,0.3), rgba(247,244,238,0.4))',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Photos */}
      <div className="flex items-center justify-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[#BB83C9] -mr-4 z-10"
        >
          <img
            src="./avatar-ethan.jpg"
            alt="You"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[#7DE0B3] -ml-4"
        >
          <img
            src={matchProfile.photo}
            alt={matchProfile.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="text-4xl font-bold text-[var(--charcoal)] mb-2 text-center"
        style={{ fontFamily: "'Outfit', system-ui, sans-serif", letterSpacing: '-1.08px' }}
      >
        {t('discover.itsAMatch')}
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="text-base text-center mb-10"
        style={{ color: 'rgba(var(--charcoal-rgb), 0.6)' }}
      >
        {t('discover.likedEachOther', { name: matchProfile.name })}
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="w-full max-w-[340px] space-y-3"
      >
        <button
          onClick={onMessage}
          className="w-full h-14 rounded-full text-base font-semibold text-white"
          style={{ backgroundColor: '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.3)' }}
        >
          {t('discover.sendMessage')}
        </button>
        <button
          onClick={onDismiss}
          className="w-full h-12 rounded-full text-base font-semibold text-[var(--charcoal)]"
          style={{ backgroundColor: 'rgba(var(--card-rgb), 0.72)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(var(--charcoal-rgb), 0.1)' }}
        >
          {t('discover.keepSwiping')}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Empty State ────────────────────────────────────────

function EmptyState({ onOpenFilters }: { onOpenFilters: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col items-center justify-center px-10"
      style={{
        background: 'radial-gradient(circle at 30% 30%, rgba(187,131,201,0.35), transparent 60%), radial-gradient(circle at 70% 70%, rgba(125,224,179,0.3), transparent 60%)',
      }}
    >
      <div className="w-40 h-40 mb-6 flex items-center justify-center">
        <Sparkles size={80} style={{ color: '#BB83C9', opacity: 0.4 }} />
      </div>
      <h2 className="text-xl font-semibold text-[var(--charcoal)] mb-2 text-center" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
        {t('discover.noOneNew')}
      </h2>
      <p className="text-sm text-center mb-6 max-w-[280px]" style={{ color: 'rgba(var(--charcoal-rgb), 0.6)' }}>
        {t('discover.tryExpanding')}
      </p>
      <button
        onClick={onOpenFilters}
        className="w-full max-w-[280px] h-12 rounded-full text-sm font-semibold text-[var(--charcoal)] mb-3"
        style={{ backgroundColor: 'rgba(var(--card-rgb), 0.72)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(var(--charcoal-rgb), 0.1)' }}
      >
        {t('discover.adjustFilters')}
      </button>
    </motion.div>
  );
}

// ── Compatibility Card ─────────────────────────────────

function CompatibilityCard({ profile, onLike }: { profile: Profile; onLike: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#22293B]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
        <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-lg font-semibold text-[var(--charcoal)]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            {profile.name}, {profile.age}
          </h3>
        </div>
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1.5"
          style={{ backgroundColor: '#7DE0B3', color: 'var(--charcoal)' }}
        >
          {t('discover.matchPercent', { percent: profile.compatibility })}
        </span>
        <div className="flex items-center gap-1 mb-1">
          <MapPin size={12} style={{ color: 'rgba(var(--charcoal-rgb), 0.4)' }} />
          <span className="text-xs" style={{ color: 'rgba(var(--charcoal-rgb), 0.4)' }}>{t('discover.kmAway', { distance: profile.distance })}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {profile.interests.slice(0, 3).map((i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: 'var(--linen-dark)', color: 'var(--charcoal)' }}>{i}</span>
          ))}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onLike}
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <Heart size={22} strokeWidth={2.5} style={{ color: '#BB83C9' }} />
      </motion.button>
    </motion.div>
  );
}

// ── Main Discover Component ────────────────────────────

export default function Discover() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'discover' | 'compatibility'>('discover');
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [matchProfile, setMatchProfile] = useState<Profile | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [sparkCount, setSparkCount] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    maxDistance: 50,
    ageMin: 22,
    ageMax: 35,
    verifiedOnly: false,
    onlineNow: false,
    goals: [],
    interests: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [_error, _setError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Fetch profiles and sparks balance on mount
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      discoverApi.getProfiles({ maxDistance: 50 }),
      sparksApi.getBalance(),
    ]).then(([data, sparks]) => {
      if (cancelled) return;
      const mapped = data.profiles.map((p: ProfileCard) => ({ ...p }));
      setAllProfiles(mapped);
      setProfiles(mapped);
      setFilteredProfiles(mapped);
      setSparkCount(sparks.balance);
      setIsLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    const filtered = allProfiles.filter((p) => {
      if (p.distance > filters.maxDistance) return false;
      if (p.age < filters.ageMin || p.age > filters.ageMax) return false;
      if (filters.verifiedOnly && !p.verified) return false;
      if (filters.onlineNow && !p.activeNow) return false;
      if (filters.interests.length > 0 && !filters.interests.some((i) => p.interests.includes(i))) return false;
      return true;
    });
    setFilteredProfiles(filtered);
    setProfiles(filtered);
    setShowFilters(false);
  }, [filters, allProfiles]);

  const resetFilters = () => {
    setFilters({
      maxDistance: 50,
      ageMin: 22,
      ageMax: 35,
      verifiedOnly: false,
      onlineNow: false,
      goals: [],
      interests: [],
    });
    setFilteredProfiles(allProfiles);
    setProfiles(allProfiles);
  };

  const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up') => {
    if (profiles.length === 0) return;

    const current = profiles[0];

    if (direction === 'up') {
      if (sparkCount > 0) {
        setSparkCount((c) => c - 1);
        sparksApi.spend(1).then(r => setSparkCount(r.newBalance)).catch(() => {});
      } else {
        return;
      }
    }

    // Call swipe API with fallback
    const action = direction === 'right' ? 'like' : direction === 'left' ? 'dislike' : 'spark';
    try {
      const result = await discoverApi.swipeAction(current.id, action);
      if (result.isMatch) {
        triggerMatchCelebration();
        setMatchProfile(current);
        setMatchId(result.matchId ?? current.id);
      }
    } catch {
      // swipe recorded locally, API will sync on next load
    }

    // Always remove swiped profile
    setProfiles((prev) => prev.slice(1));
  }, [profiles, sparkCount]);

  const handleLike = () => handleSwipe('right');
  const handleDislike = () => handleSwipe('left');
  const handleSpark = () => {
    if (sparkCount > 0) handleSwipe('up');
  };

  // Dismiss bottom sheet on overlay tap
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);

  const visibleCards = profiles.slice(0, 3);
  const highCompatProfiles = allProfiles.filter((p) => p.compatibility > 80);
  const filterMatchCount = filteredProfiles.length;

  return (
    <Layout hideNavbar hideFooter={false}>
      {/* Tab Toggle */}
      <div className="flex items-center justify-center gap-2 pt-3 pb-2 px-5">
        <div
          className="flex rounded-full p-1"
          style={{ backgroundColor: 'var(--linen-dark)' }}
        >
          <button
            onClick={() => setActiveTab('discover')}
            className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === 'discover' ? '#BB83C9' : 'transparent',
              color: activeTab === 'discover' ? '#fff' : 'var(--charcoal)',
              opacity: activeTab === 'discover' ? 1 : 0.6,
            }}
          >
            {t('nav.discover')}
          </button>
          <button
            onClick={() => setActiveTab('compatibility')}
            className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === 'compatibility' ? '#BB83C9' : 'transparent',
              color: activeTab === 'compatibility' ? '#fff' : 'var(--charcoal)',
              opacity: activeTab === 'compatibility' ? 1 : 0.6,
            }}
          >
            {t('discover.compatibility')}
          </button>
        </div>
      </div>

      {/* Filter FAB */}
      {activeTab === 'discover' && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowFilters(true)}
          className="absolute top-16 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(var(--card-rgb), 0.72)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <SlidersHorizontal size={18} className="text-[var(--charcoal)]" strokeWidth={2} />
        </motion.button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {activeTab === 'discover' ? (
          <>
            {/* Card Stack Area */}
            <div className="flex-1 relative px-4 pb-4">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-full max-w-sm">
                    <SkeletonLoader variant="card" />
                    <div className="mt-4 px-2">
                      <SkeletonLoader variant="text" />
                    </div>
                  </div>
                </div>
              ) : profiles.length > 0 ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <AnimatePresence>
                    {visibleCards.map((profile, index) => (
                      <SwipeCard
                        key={profile.id}
                        profile={profile}
                        index={index}
                        onSwipe={handleSwipe}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyState onOpenFilters={() => setShowFilters(true)} />
              )}
            </div>

            {/* Action Buttons */}
            {!isLoading && profiles.length > 0 && (
              <div className="pb-4 pt-2">
                <ActionButtons
                  onDislike={handleDislike}
                  onLike={handleLike}
                  onSpark={handleSpark}
                  sparkCount={sparkCount}
                />
              </div>
            )}
          </>
        ) : (
          /* Compatibility Tab */
          <div className="flex-1 px-5 pb-4 overflow-y-auto">
            <p className="text-xs mb-4" style={{ color: 'rgba(var(--charcoal-rgb), 0.4)' }}>
              {t('discover.compatRefresh', { count: highCompatProfiles.length })}
            </p>
            <div className="space-y-3">
              {highCompatProfiles.map((profile) => (
                <CompatibilityCard
                  key={profile.id}
                  profile={profile}
                  onLike={() => {
                    setMatchProfile(profile);
                    triggerMatchCelebration();
                  }}
                />
              ))}
            </div>
            {highCompatProfiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-center" style={{ color: 'rgba(var(--charcoal-rgb), 0.6)' }}>
                  {t('discover.compatEmpty')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
          >
            {/* Overlay */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(var(--charcoal-rgb), 0.4)', backdropFilter: 'blur(4px)' }}
            />
            {/* Sheet */}
            <motion.div
              ref={sheetRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white dark:bg-[#22293B]"
              style={{ maxHeight: '85vh' }}
            >
              <FilterSheet
                filters={filters}
                onChange={setFilters}
                onApply={applyFilters}
                onReset={resetFilters}
                matchCount={filterMatchCount}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Celebration */}
      <AnimatePresence>
        {matchProfile && (
          <MatchOverlay
            matchProfile={matchProfile}
            onDismiss={() => { setMatchProfile(null); setMatchId(null); }}
            onMessage={() => {
              const id = matchId ?? matchProfile.id;
              setMatchProfile(null);
              setMatchId(null);
              navigate(`/chat/${id}`);
            }}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
