import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Shield, Lock, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: easeSmooth, delay: 0.2 }}
      className="animate-logo-breathe flex items-end select-none"
      style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 1, color: '#BB83C9', letterSpacing: '-1.5px' }}
      aria-label="Equal"
    >
      <span>Eq</span>
      <span className="relative inline-block">
        u
        <svg width="14" height="13" viewBox="0 0 14 13" className="absolute" style={{ top: -7, left: '50%', transform: 'translateX(-50%)' }} aria-hidden="true">
          <path d="M7 12.2 5.8 11C2.8 8.6 0.5 6.6 0.5 4.2 0.5 2.2 2 0.8 3.9 0.8c1.2 0 2.4.6 3.1 1.5C7.7 1.4 8.9.8 10.1.8 12 .8 13.5 2.2 13.5 4.2c0 2.4-2.3 4.4-5.3 6.8L7 12.2z" fill="#7DE0B3" />
        </svg>
      </span>
      <span>al</span>
    </motion.div>
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
  const { t } = useTranslation();
  const items = [
    { icon: Shield, text: 'welcome.trustVerified' },
    { icon: Lock, text: 'welcome.trustZero' },
    { icon: Heart, text: 'welcome.trustPioneers' },
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
            <Icon size={14} style={{ color: 'rgba(var(--charcoal-rgb), 0.35)' }} strokeWidth={2} />
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{
                color: 'rgba(var(--charcoal-rgb), 0.35)',
                fontFamily: "'Outfit', system-ui, sans-serif",
              }}
            >
              {t(item.text)}
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
        throw new Error(t('welcome.errPiBrowser'));
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
          setTimeout(() => reject(new Error(t('welcome.errTimeout'))), 45000)
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
      const msg = err instanceof Error ? err.message : t('welcome.errAuthFailed');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const headlineWords = t('welcome.slogan').split(' ');

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: 'var(--linen)' }}>
      <div className="w-full max-w-[430px] relative flex flex-col justify-between"
        style={{
          minHeight: '100dvh',
          paddingTop: 'calc(48px + env(safe-area-inset-top))',
          background: `
            radial-gradient(circle at 30% 30%, rgba(187,131,201,0.35), transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(125,224,179,0.3), transparent 60%),
            var(--linen)
          `,
        }}
      >
        {/* Language selector — pick your language before filling the profile */}
        <div className="absolute right-4" style={{ top: 'calc(12px + env(safe-area-inset-top))', zIndex: 20 }}>
          <LanguageSelector />
        </div>

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
              className="text-4xl font-bold text-[var(--charcoal)] text-center"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 36, lineHeight: 1.05, letterSpacing: '-1.08px' }}>
              {word}
            </motion.span>
          ))}
        </div>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeSmooth, delay: 0.9 }}
          className="text-center mt-4 px-8"
          style={{ color: 'rgba(var(--charcoal-rgb), 0.65)', fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 16, lineHeight: 1.6, letterSpacing: '-0.32px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
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
