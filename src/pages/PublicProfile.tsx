import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShieldCheck, MessageCircle, Check, MoreVertical, UserX, Flag, Link2 } from 'lucide-react';
import Layout from '@/components/Layout';
import SkeletonLoader from '@/components/SkeletonLoader';
import ReportDialog from '@/components/ReportDialog';
import AskSection from '@/components/AskSection';
import { useToast } from '@/hooks/useToast';
import { api } from '@/api/client';
import { getPublicProfile, discoverApi, type PublicProfile as PublicProfileData } from '@/api/discover';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/** Block/Report menu — reachable from clubs pre-match, so this screen needs
    the same safety actions Chat already has, not just Like/Message. */
function ProfileMenu({
  isOpen,
  onClose,
  onBlock,
  onReport,
}: {
  isOpen: boolean;
  onClose: () => void;
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
            style={{ backgroundColor: 'var(--card-bg)', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', minWidth: 200 }}
          >
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

/**
 * Another user's profile. Didn't exist anywhere in the app before — club post
 * "Meet [author]" and club-member "Meet" both had nowhere to send a tap.
 */
export default function PublicProfile() {
  // Reachable as /profile/:userId (in-app taps) and /u/:username (shared
  // links). Both resolve the same way server-side, so one component serves both.
  const { userId, username } = useParams<{ userId?: string; username?: string }>();
  const handle = userId ?? username ?? '';
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liking, setLiking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [askCounts, setAskCounts] = useState({ answered: 0, total: 0 });

  useEffect(() => {
    if (!handle) return;
    setIsLoading(true);
    setNotFound(false);
    getPublicProfile(handle)
      .then(setProfile)
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [handle]);

  /**
   * Share preview tags. This is a client-rendered SPA, so crawlers that don't
   * execute JS still see index.html's defaults — these help the in-app share
   * sheet and any renderer that does run scripts.
   */
  useEffect(() => {
    if (!profile) return;
    const prevTitle = document.title;
    document.title = t('ask.ogTitle', { defaultValue: `Ask ${profile.name} anything on Equal`, name: profile.name });

    const setMeta = (attr: 'property' | 'name', key: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    const desc = t('ask.ogDescription', {
      defaultValue: `${askCounts.answered} questions answered. What would you like to know?`,
      answered: askCounts.answered,
    });
    setMeta('property', 'og:title', document.title);
    setMeta('property', 'og:description', desc);
    if (profile.photo) setMeta('property', 'og:image', profile.photo);
    setMeta('name', 'description', desc);

    return () => { document.title = prevTitle; };
  }, [profile, askCounts.answered, t]);

  const handleCopyLink = async () => {
    if (!profile) return;
    const url = `${window.location.origin}/#/u/${encodeURIComponent(handle)}`;
    const text = t('ask.shareText', {
      defaultValue: `Ask me anything, anonymously 💜 ${url}`,
      url,
    });
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', t('ask.linkCopied', { defaultValue: 'Link copied!' }));
    } catch {
      showToast('error', t('ask.copyFailed', { defaultValue: 'Could not copy the link' }));
    }
  };

  // These all take a real user id, never the URL handle — /u/:username resolves
  // to an id server-side and profile.id is that resolved value.
  const handleLike = async () => {
    if (!profile) return;
    setLiking(true);
    try {
      const result = await discoverApi.swipeAction(profile.id, 'like');
      if (result.isMatch) {
        showToast('match', t('discover.itsAMatch', { defaultValue: "It's a match!" }));
        setProfile({ ...profile, isMatch: true, matchId: result.matchId ?? null, alreadyLiked: true });
      } else {
        setProfile({ ...profile, alreadyLiked: true });
      }
    } catch {
      showToast('error', t('discover.likeFailed', { defaultValue: 'Could not send like' }));
    } finally {
      setLiking(false);
    }
  };

  const handleBlock = () => {
    if (!profile) return;
    api.post(`/users/${profile.id}/block`, {}).catch(() => {});
    showToast('success', t('chat.userBlocked', { defaultValue: 'User blocked' }));
    navigate(-1);
  };

  const handleReportSubmit = (reason: string, description: string) => {
    if (!profile) return;
    api.post(`/users/${profile.id}/report`, { reason, description }).catch(() => {});
    showToast('success', t('chat.reportSubmitted', { defaultValue: "Report submitted. We'll review it shortly." }));
  };

  if (isLoading) {
    return (
      <Layout title="" showBack onBack={() => navigate(-1)}>
        <div className="px-5 pt-4">
          <SkeletonLoader variant="card" />
        </div>
      </Layout>
    );
  }

  if (notFound || !profile) {
    return (
      <Layout title="" showBack onBack={() => navigate(-1)}>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <p className="text-base text-[var(--charcoal)] opacity-50" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
            {t('publicProfile.notFound', { defaultValue: "This profile isn't available." })}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title=""
      showBack
      onBack={() => navigate(-1)}
      rightAction={
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(var(--card-rgb), 0.72)', backdropFilter: 'blur(12px)' }}
          >
            <MoreVertical size={20} className="text-[var(--charcoal)]" strokeWidth={2} />
          </button>
          <ProfileMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            onBlock={handleBlock}
            onReport={() => setReportOpen(true)}
          />
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Hero photo */}
        <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
          {profile.photo ? (
            <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--linen-dark)' }}>
              <span className="text-white font-bold" style={{ fontSize: 96, fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {(profile.name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(var(--charcoal-rgb), 0.85) 100%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2">
              <h1 className="text-[26px] font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {profile.name}{profile.age != null ? `, ${profile.age}` : ''}
              </h1>
              {profile.verified && (
                <div className="w-5 h-5 rounded-full bg-[#7DE0B3] flex items-center justify-center">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: '#BB83C9' }}
              >
                {t('discover.matchPercent', { percent: profile.compatibility })}
              </span>
              {profile.activeNow && (
                <span className="flex items-center gap-1 text-xs text-white opacity-80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7DE0B3]" /> {t('chat.activeNow')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easeOutExpo }}
            className="px-5 mt-5"
          >
            <p className="text-base text-[var(--charcoal)] leading-relaxed" style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              {profile.bio}
            </p>
          </motion.div>
        )}

        {/* Interests */}
        {profile.interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: easeOutExpo }}
            className="px-5 mt-5"
          >
            <h4 className="text-sm font-semibold text-[var(--charcoal)] opacity-60 mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {t('profile.interests')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm text-[var(--charcoal)]"
                  style={{ backgroundColor: 'var(--linen-dark)', fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  {t(`onboarding.int_${interest.toLowerCase()}`, { defaultValue: interest })}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Extra photos */}
        {profile.photos.length > 1 && (
          <div className="grid grid-cols-3 gap-2 px-5 mt-6">
            {profile.photos.slice(1).map((url, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Action */}
        <div className="px-5 mt-8">
          {profile.isMatch ? (
            <button
              onClick={() => navigate(`/chat/${profile.matchId}`)}
              className="w-full h-14 rounded-full text-white text-base font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.4)', fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              <MessageCircle size={20} /> {t('matches.message', { defaultValue: 'Message' })}
            </button>
          ) : (
            <button
              onClick={handleLike}
              disabled={liking || profile.alreadyLiked}
              className="w-full h-14 rounded-full text-white text-base font-semibold flex items-center justify-center gap-2"
              style={{
                backgroundColor: profile.alreadyLiked ? 'var(--linen-dark)' : '#BB83C9',
                color: profile.alreadyLiked ? 'var(--charcoal)' : '#fff',
                boxShadow: profile.alreadyLiked ? 'none' : '0 4px 16px rgba(187,131,201,0.4)',
                fontFamily: "'Outfit', system-ui, sans-serif",
                opacity: liking ? 0.6 : 1,
              }}
            >
              {profile.alreadyLiked ? (
                <><ShieldCheck size={20} /> {t('discover.alreadyLiked', { defaultValue: 'Already liked' })}</>
              ) : (
                <><Heart size={20} /> {t('discover.like', { defaultValue: 'Like' })}</>
              )}
            </button>
          )}
        </div>

        {/* Equal Ask — public Q&A */}
        <AskSection
          targetIdOrUsername={handle}
          targetName={profile.name}
          onCountsChange={setAskCounts}
        />

        {/* Viral loop: the link people paste into their bio */}
        <div className="px-5 mt-5">
          <button
            onClick={handleCopyLink}
            className="w-full h-11 rounded-full flex items-center justify-center gap-2 text-sm font-semibold"
            style={{
              backgroundColor: 'var(--linen-dark)',
              color: 'var(--charcoal)',
              fontFamily: "'Outfit', system-ui, sans-serif",
            }}
          >
            <Link2 size={16} /> {t('ask.copyProfileLink', { defaultValue: 'Copy profile link' })}
          </button>
        </div>
      </div>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        userName={profile.name}
        onSubmit={handleReportSubmit}
      />
    </Layout>
  );
}
