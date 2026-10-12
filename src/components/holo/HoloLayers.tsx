import { motion, type MotionValue } from 'framer-motion';

/**
 * The holographic material over a card: rainbow foil that slides with the
 * light, a glare spot, faint scanlines and an iridescent rim. Pointer events
 * pass through. Place inside a rounded, overflow-hidden container, before the
 * text so the text is painted above it.
 */
export default function HoloLayers({ foilPosition, foilMask, glare }: { foilPosition: MotionValue<string>; foilMask: MotionValue<string>; glare: MotionValue<string> }) {
  return (
    <>
      <motion.div className="holo-foil" style={{ backgroundPosition: foilPosition, maskImage: foilMask, WebkitMaskImage: foilMask }} aria-hidden />
      <motion.div className="holo-glare" style={{ backgroundImage: glare }} aria-hidden />
      <div className="holo-scan" aria-hidden />
      <div className="holo-ring" aria-hidden />
    </>
  );
}
