import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Shield, Lock, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getMe } from '@/api/users';
import { paymentsApi } from '@/api/payments';
import { TOKEN_KEY } from '@/api/client';

const easeSmooth = [0.4, 0, 0.2, 1] as [number, number, number, number];
const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];
const easeSpring = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

// Pi SDK types are declared globally in src/types/pi-sdk.d.ts

function EqualLogo() {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: easeSmooth, delay: 0.2 }}
      width="140"
      height="56"
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-logo-breathe"
    >
      {/* E */}
      <path
        d="M16 56V24h28v6H24v8h18v6H24v12h-8z"
        fill="#BB83C9"
      />
      {/* q */}
      <path
        d="M58 56V24h16c8 0 14 6 14 14s-6 14-14 14H66v4h-8zm8-10h8c4 0 8-4 8-8s-4-8-8-8h-8v16z"
        fill="#BB83C9"
      />
      {/* u — with heart-shaped counter */}
      <path
        d="M98 24h8v18c0 8-4 14-12 14s-12-6-12-14V24h8v18c0 4 2 8 6 8s6-4 6-8V24z"
        fill="#BB83C9"
      />
      {/* Heart shape inside the "u" counter */}
      <path
        d="M94 36c0-2.2 1.8-4 4-4 .8 0 1.6.3 2.2.8l-.2.2c.6-.5 1.4-.8 2.2-.8 2.2 0 4 1.8 4 4 0 3-3.4 5.8-5.4 7.4l-.8.6-.8-.6c-2-1.6-5.4-4.4-5.4-7.4z"
        fill="#7DE0B3"
      />
      {/* a */}
      <path
        d="M118 56V24h8l12 32h-8l-2.5-7H118v7h-8zm4.5-13h6l-3-9-3 9z"
        fill="#BB83C9"
      />
      {/* l */}
      <path
        d="M146 24h8v32h-8z"
        fill="#BB83C9"
      />
    </motion.svg>
  );
}

function PiLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#8B5CF6" />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontFamily="'Outfit', sans-serif"
        fontWeight="600"
      >
        π
      </text>
    </svg>
  );
}

function TrustFooter() {
  const items = [
    { icon: Shield, text: 'Verified Community' },
    { icon: Lock, text: 'Zero Payments' },
    { icon: Heart, text: '60M+ Pioneers' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 1.5 }}
      className="flex items-center justify-center gap-3 px-4 pb-4"
      style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className="flex items-center gap-1">
            <Icon size={14} style={{ color: 'rgba(35, 35, 35, 0.35)' }} strokeWidth={2} />
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{
                color: 'rgba(35, 35, 35, 0.35)',
                fontFamily: "'Outfit', system-ui, sans-serif",
              }}
            >
              {item.text}
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loginWithPi } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ping backend on mount to wake it up from Render free-tier sleep
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'https://equal-backend.onrender.com/v1'}/health`).catch(() => {});
  }, []);

  // Auto-redirect returning users who already have a valid token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setIsLoading(true);
    getMe()
      .then((profile) => {
        const hasProfile = !!(profile.bio || (profile.interests && profile.interests.length > 0));
        navigate(hasProfile ? '/discover' : '/onboarding', { replace: true });
      })
      .catch(() => {
        // Token expired/invalid — clear it and show login
        localStorage.removeItem(TOKEN_KEY);
        setIsLoading(false);
      });
  }, [navigate]);

  const handlePiLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!window.Pi) {
        if (import.meta.env.DEV) {
          await loginWithPi('dev-mock-token', ['username', 'payments']);
          navigate('/discover');
          return;
        }
        throw new Error('Please open this app in Pi Browser');
      }

      // Race Pi.authenticate() against a 45-second timeout
      const authResult = await Promise.race([
        window.Pi.authenticate(
          ['username', 'payments'],
          async (payment: unknown) => {
            // Per Pi docs: if transaction already submitted → complete, else → approve
            const p = payment as {
              identifier: string;
              transaction: { txid: string } | null;
              status: { developer_approved: boolean };
            };
            try {
              if (p.transaction?.txid && p.status.developer_approved) {
                await paymentsApi.complete(p.identifier, p.transaction.txid);
              } else {
                await paymentsApi.approve(p.identifier);
              }
            } catch { /* best effort */ }
          }
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Pi authentication timed out. Please try again.')), 45000)
        ),
      ]);

      await loginWithPi(authResult.accessToken, ['username', 'payments']);

      // Route returning users to discover, new users to onboarding
      try {
        const profile = await getMe();
        const hasProfile = !!(profile.bio || (profile.interests && profile.interests.length > 0));
        navigate(hasProfile ? '/discover' : '/onboarding');
      } catch {
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pi authentication failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const headlineWords = t('welcome.slogan').split(' ');

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: '#F7F4EE' }}>
      <div className="w-full max-w-[430px] relative flex flex-col justify-between"
        style={{
          minHeight: '100dvh',
          paddingTop: 'calc(48px + env(safe-area-inset-top))',
          background: `
            radial-gradient(circle at 30% 30%, rgba(187,131,201,0.35), transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(125,224,179,0.3), transparent 60%),
            #F7F4EE
          `,
        }}
      >
        {/* Logo */}
        <div className="flex justify-center"><EqualLogo /></div>

        {/* Hero Illustration */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.4 }}
          className="flex justify-center mt-6 relative"
        >
          <div className="absolute rounded-full" style={{ width: 200, height: 200, backgroundColor: 'rgba(187, 131, 201, 0.08)', filter: 'blur(40px)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          <motion.img src="./hero-couple.png" alt="Two people forming a heart" className="relative z-10 animate-float" style={{ width: 280, height: 350, objectFit: 'contain' }} />
        </motion.div>

        {/* Headline */}
        <div className="px-5 mt-8 flex flex-wrap justify-center gap-x-2 gap-y-0">
          {headlineWords.map((word, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.7 + i * 0.08 }}
              className="text-4xl font-bold text-[#232323] text-center"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 36, lineHeight: 1.05, letterSpacing: '-1.08px' }}>
              {word}
            </motion.span>
          ))}
        </div>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeSmooth, delay: 0.9 }}
          className="text-center mt-4 px-8"
          style={{ color: 'rgba(35, 35, 35, 0.65)', fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 16, lineHeight: 1.6, letterSpacing: '-0.32px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
          {t('welcome.subtitle')}
        </motion.p>

        {/* Pi Login CTA — ONLY login method */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeSpring, delay: 1.1 }} className="px-5 mt-10">
          <motion.button
            whileTap={{ scale: 0.97 }} transition={{ duration: 0.08 }}
            onClick={handlePiLogin} disabled={isLoading}
            className="w-full rounded-full flex items-center justify-center gap-2 text-white font-semibold text-base relative"
            style={{ height: 56, backgroundColor: isLoading ? '#D4A8DE' : '#BB83C9', boxShadow: '0 4px 16px rgba(187,131,201,0.3)', fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {isLoading ? (
              <motion.div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
            ) : (
              <><PiLogo /><span>{t('welcome.piLogin')}</span></>
            )}
          </motion.button>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center mt-3 px-5 text-sm" style={{ color: '#E74C3C', fontFamily: "'Outfit', system-ui, sans-serif" }}>
            {error}
          </motion.p>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-[24px]" />

        {/* Trust Footer */}
        <div className="mt-6"><TrustFooter /></div>
      </div>
    </div>
  );
}
