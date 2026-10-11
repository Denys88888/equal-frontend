import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import GiftAnimation from '@/components/GiftAnimation';
import type { GiftKind } from '@/lib/gifts';

const SHOW_MS = 3800;
const COLORS = ['#BB83C9', '#7DE0B3', '#F0B84A', '#E86A6A', '#FFFFFF'];

/**
 * Full-screen moment for a gift: the animation large, a confetti burst and a
 * short buzz. Shown to the person receiving it as it arrives, and to the
 * sender once it is delivered. Tap anywhere to close.
 */
export default function GiftCelebration({
  gift,
  text,
  onDone,
}: {
  gift: GiftKind | null;
  text: string;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!gift) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!still) {
      const burst = (x: number, angle: number) =>
        confetti({ particleCount: 70, spread: 70, startVelocity: 45, angle, origin: { x, y: 0.75 }, colors: COLORS, zIndex: 400, disableForReducedMotion: true });
      burst(0.15, 60);
      burst(0.85, 120);
      const second = setTimeout(() => confetti({ particleCount: 90, spread: 100, origin: { y: 0.45 }, colors: COLORS, zIndex: 400, scalar: 0.9, disableForReducedMotion: true }), 450);
      try { navigator.vibrate?.([40, 60, 40]); } catch { /* not supported */ }
      const done = setTimeout(onDone, SHOW_MS);
      return () => { clearTimeout(second); clearTimeout(done); };
    }
    const done = setTimeout(onDone, SHOW_MS);
    return () => clearTimeout(done);
  }, [gift, onDone]);

  return createPortal(
    <AnimatePresence>
      {gift && (
        <motion.div
          key="gift-celebration"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onDone}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center px-8"
          style={{ backgroundColor: 'rgba(20,16,28,0.55)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="relative flex items-center justify-center"
          >
            <div
              className="absolute rounded-full"
              style={{ width: 280, height: 280, background: 'radial-gradient(circle, rgba(240,184,74,0.45) 0%, rgba(187,131,201,0.25) 45%, transparent 70%)' }}
            />
            <GiftAnimation kind={gift} size={200} />
          </motion.div>
          <motion.p
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-4 text-xl font-semibold text-white text-center"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif", textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}
          >
            {text}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
