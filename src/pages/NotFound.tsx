import { motion } from 'framer-motion';
import { Home, Search, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function NotFound() {
  const { t } = useTranslation();

  const handleGoHome = () => {
    window.location.hash = '/';
    window.location.reload();
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex items-center justify-center px-6"
      style={{ backgroundColor: '#F7F4EE' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="w-full max-w-[360px] flex flex-col items-center text-center"
      >
        {/* Decorative floating elements */}
        <div className="relative mb-4">
          {/* Large 404 text */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: easeOutExpo }}
            className="text-[120px] font-black leading-none tracking-tight select-none"
            style={{
              fontFamily: "'Outfit', system-ui, sans-serif",
              background: 'linear-gradient(180deg, #BB83C9 0%, #D4A8DE 40%, #7DE0B3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 24px rgba(187,131,201,0.2))',
            }}
          >
            404
          </motion.h1>

          {/* Floating heart decoration */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.5, ease: easeOutExpo }}
            className="absolute -top-2 -right-6"
          >
            <motion.div
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart
                size={28}
                className="text-[#BB83C9]"
                strokeWidth={1.5}
                fill="rgba(187,131,201,0.2)"
              />
            </motion.div>
          </motion.div>

          {/* Floating search decoration */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.35, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.5, ease: easeOutExpo }}
            className="absolute top-4 -left-8"
          >
            <motion.div
              animate={{ y: [2, -2, 2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Search
                size={24}
                className="text-[#7DE0B3]"
                strokeWidth={1.5}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: easeOutExpo }}
          className="text-xl font-bold text-[#232323] mb-3"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('common.error')}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4, ease: easeOutExpo }}
          className="text-sm text-[#232323] opacity-45 max-w-[260px] mb-10"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.55 }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </motion.p>

        {/* Decorative illustration — abstract shapes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.5, ease: easeOutExpo }}
          className="relative w-48 h-32 mb-10 flex items-center justify-center"
        >
          {/* Concentric circles */}
          <div
            className="absolute w-32 h-32 rounded-full"
            style={{ border: '2px dashed rgba(187,131,201,0.2)' }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute w-24 h-24 rounded-full"
            style={{ border: '2px dashed rgba(125,224,179,0.25)' }}
          />
          <div
            className="absolute w-16 h-16 rounded-full"
            style={{ backgroundColor: 'rgba(187,131,201,0.08)' }}
          />
          <div
            className="absolute w-8 h-8 rounded-full"
            style={{ backgroundColor: 'rgba(125,224,179,0.15)' }}
          />

          {/* Center icon */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Heart
              size={20}
              className="text-[#BB83C9]"
              strokeWidth={1.5}
              fill="rgba(187,131,201,0.3)"
            />
          </motion.div>
        </motion.div>

        {/* Go Home Button */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4, ease: easeOutExpo }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGoHome}
          className="w-full max-w-[240px] h-14 rounded-full bg-[#BB83C9] text-white text-base font-semibold flex items-center justify-center gap-2"
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            boxShadow: '0 4px 16px rgba(187,131,201,0.3)',
          }}
        >
          <Home size={18} strokeWidth={2} />
          {t('common.home')}
        </motion.button>

        {/* Footer branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-10 text-[11px] text-[#232323] opacity-25"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          Equal
        </motion.p>
      </motion.div>
    </div>
  );
}
