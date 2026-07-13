import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { useNavigate } from 'react-router';

const CONSENT_KEY = 'equal-cookie-consent';

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        >
          <div className="w-full max-w-[400px] rounded-2xl p-4 shadow-lg" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(187,131,201,0.15)' }}>
                <Cookie size={20} style={{ color: '#BB83C9' }} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#232323] mb-1" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  {t('common.cookieTitle')}
                </p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(35,35,35,0.65)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.5 }}>
                  {t('common.cookieText')}{' '}
                  <button onClick={() => { setVisible(false); navigate('/privacy'); }} className="underline font-medium" style={{ color: '#BB83C9' }}>{t('common.privacyPolicy')}</button>.
                </p>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={accept}
                    className="flex-1 h-9 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: '#BB83C9', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    {t('common.cookieAccept')}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={decline}
                    className="h-9 px-4 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: 'rgba(232,226,216,0.5)', color: '#232323', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                    {t('common.cookieEssential')}
                  </motion.button>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.85 }} onClick={decline} className="flex-shrink-0">
                <X size={18} style={{ color: 'rgba(35,35,35,0.4)' }} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
