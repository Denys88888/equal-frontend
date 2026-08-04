import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, MessageCircle, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useToast } from '@/hooks/useToast';
import { getPublicProfile, discoverApi, type PublicProfile as PublicProfileData } from '@/api/discover';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

/**
 * Another user's profile. Didn't exist anywhere in the app before — club post
 * "Meet [author]" and club-member "Meet" both had nowhere to send a tap.
 */
export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    setNotFound(false);
    getPublicProfile(userId)
      .then(setProfile)
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const handleLike = async () => {
    if (!userId || !profile) return;
    setLiking(true);
    try {
      const result = await discoverApi.swipeAction(userId, 'like');
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
    <Layout title="" showBack onBack={() => navigate(-1)}>
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
      </div>
    </Layout>
  );
}
