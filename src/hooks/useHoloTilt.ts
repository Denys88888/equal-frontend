import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useTransform, useMotionTemplate, type MotionValue } from 'framer-motion';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Where the light hits a holographic card (0–1 on each axis) and the tilt it
 * implies. Follows the finger, the phone's tilt when the browser reports it,
 * and the swipe drag; with nothing touching it the light drifts slowly so the
 * foil still shimmers.
 */
export function useHoloTilt(active: boolean, drag?: { x: MotionValue<number>; y: MotionValue<number> }) {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 140, damping: 20, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 140, damping: 20, mass: 0.6 });
  const rotateY = useTransform(sx, [0, 1], [-9, 9]);
  const rotateX = useTransform(sy, [0, 1], [7, -7]);
  const lx = useTransform(sx, [0, 1], [0, 100]);
  const ly = useTransform(sy, [0, 1], [0, 100]);
  const foilPosition = useMotionTemplate`${lx}% ${ly}%`;
  const glare = useMotionTemplate`radial-gradient(circle at ${lx}% ${ly}%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 26%, transparent 55%)`;
  // The rainbow lives only around the light, like real holographic foil —
  // tinting the whole photo turned faces green and purple.
  const foilMask = useMotionTemplate`radial-gradient(circle at ${lx}% ${ly}%, #000 0%, rgba(0,0,0,0.45) 22%, transparent 48%)`;
  const lastInput = useRef(0);

  // Idle drift.
  useEffect(() => {
    if (!active || reducedMotion()) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (now - lastInput.current > 2500) {
        const t = (now - start) / 1000;
        px.set(0.5 + 0.32 * Math.cos(t * 0.9));
        py.set(0.5 + 0.22 * Math.sin(t * 1.3));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, px, py]);

  // Phone tilt, where the browser reports it without asking (Android).
  useEffect(() => {
    if (!active || reducedMotion()) return;
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      lastInput.current = performance.now();
      px.set(clamp(0.5 + e.gamma / 50));
      py.set(clamp(0.5 + (e.beta - 40) / 60));
    };
    window.addEventListener('deviceorientation', onTilt);
    return () => window.removeEventListener('deviceorientation', onTilt);
  }, [active, px, py]);

  // Swipe drag moves the light with the card.
  useEffect(() => {
    if (!active || !drag) return;
    const offX = drag.x.on('change', (v) => { lastInput.current = performance.now(); px.set(clamp(0.5 + v / 360)); });
    const offY = drag.y.on('change', (v) => { py.set(clamp(0.5 + v / 360)); });
    return () => { offX(); offY(); };
  }, [active, drag, px, py]);

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!active) return;
    const r = e.currentTarget.getBoundingClientRect();
    lastInput.current = performance.now();
    px.set(clamp((e.clientX - r.left) / r.width));
    py.set(clamp((e.clientY - r.top) / r.height));
  };

  return { rotateX, rotateY, foilPosition, foilMask, glare, onPointerMove };
}
