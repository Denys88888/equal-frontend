import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import type { AnimationItem } from 'lottie-web';
import { GIFT_EMOJI, type GiftKind } from '@/lib/gifts';

// The player (~50 KB gzipped) and each animation are fetched once, on first use.
let player: Promise<typeof import('lottie-web/build/player/lottie_light').default> | null = null;
const loadPlayer = () => (player ??= import('lottie-web/build/player/lottie_light').then((m) => m.default));
const sources = new Map<GiftKind, Promise<string>>();
const loadSource = (kind: GiftKind) => {
  if (!sources.has(kind)) {
    const p = fetch(`./gifts/${kind}.json`).then((r) => {
      if (!r.ok) throw new Error(`gift ${kind}: HTTP ${r.status}`);
      return r.text();
    });
    p.catch(() => sources.delete(kind));
    sources.set(kind, p);
  }
  return sources.get(kind)!;
};

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * An animated gift (Noto Animated Emoji, Google, CC BY 4.0 — public/gifts).
 * Plays only while on screen, so a long chat full of gifts doesn't keep every
 * one of them running.
 */
export default function GiftAnimation({ kind, size = 56 }: { kind: GiftKind; size?: number }) {
  const { ref: viewRef, inView } = useInView({ rootMargin: '120px' });
  const boxRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!inView || animRef.current) return;
    let cancelled = false;
    Promise.all([loadPlayer(), loadSource(kind)])
      .then(([lottie, json]) => {
        if (cancelled || !boxRef.current || animRef.current) return;
        const still = reducedMotion();
        // The player mutates the data it is given, so every instance parses its own copy.
        const anim = lottie.loadAnimation({
          container: boxRef.current,
          renderer: 'svg',
          loop: !still,
          autoplay: !still,
          animationData: JSON.parse(json),
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
        });
        if (still) anim.addEventListener('DOMLoaded', () => anim.goToAndStop(0, true));
        animRef.current = anim;
        setReady(true);
      })
      .catch(() => { /* the emoji stays */ });
    return () => { cancelled = true; };
  }, [inView, kind]);

  useEffect(() => {
    const anim = animRef.current;
    if (!anim || reducedMotion()) return;
    if (inView) anim.play();
    else anim.pause();
  }, [inView]);

  useEffect(() => () => {
    animRef.current?.destroy();
    animRef.current = null;
  }, []);

  return (
    <div ref={viewRef} className="relative flex-shrink-0" style={{ width: size, height: size }} aria-hidden>
      <div ref={boxRef} className="absolute inset-0" />
      {!ready && (
        <span className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: size * 0.7, lineHeight: 1 }}>
          {GIFT_EMOJI[kind]}
        </span>
      )}
    </div>
  );
}
