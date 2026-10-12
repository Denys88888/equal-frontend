import { useId } from 'react';

const HEART = 'M50 88 C22 66 6 50 6 31 C6 17 17 7 30 7 C39 7 46 12 50 19 C54 12 61 7 70 7 C83 7 94 17 94 31 C94 50 78 66 50 88 Z';
const LAYERS = 14;

/**
 * A heart projected as a hologram: a glowing emitter, a beam of light and an
 * extruded heart turning in real 3D. The depth comes from stacking the same
 * outline at different Z depths (CSS 3D), which every phone renders smoothly,
 * where a WebGL scene would stutter on the older iPhones Pi Browser runs on.
 */
export default function HoloHeart({ size = 150 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  const face = `holo-face-${id}`;
  const edge = `holo-edge-${id}`;

  return (
    <div className="relative mx-auto" style={{ width: size + 60, height: size + 90 }} aria-hidden>
      <div className="holo-beam" />
      <div className="holo-emitter" />

      {/* Soft glow behind the heart (kept 2D: a filter on the 3D group would flatten it). */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{ top: 10, width: size * 1.1, height: size, background: 'radial-gradient(circle, rgba(187,131,201,0.55), rgba(123,196,232,0.18) 55%, transparent 72%)' }}
      />

      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 14, width: size, height: size, perspective: 700 }}>
        <div className="holo-heart-float w-full h-full">
          <div className="holo-heart-3d w-full h-full">
            {Array.from({ length: LAYERS }).map((_, i) => {
              const depth = (i - (LAYERS - 1) / 2) * 1.8;
              const isFace = i === 0 || i === LAYERS - 1;
              return (
                <svg
                  key={i}
                  className="holo-heart-layer"
                  viewBox="0 0 100 95"
                  style={{ transform: `translateZ(${depth}px)` }}
                >
                  {i === 0 && (
                    <defs>
                      <linearGradient id={face} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ff8fc7" stopOpacity="0.95" />
                        <stop offset="45%" stopColor="#bb83c9" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#7bc4e8" stopOpacity="0.95" />
                      </linearGradient>
                      <linearGradient id={edge} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7bc4e8" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="#bb83c9" stopOpacity="0.55" />
                      </linearGradient>
                    </defs>
                  )}
                  <path
                    d={HEART}
                    fill={isFace ? `url(#${face})` : `url(#${edge})`}
                    stroke={isFace ? 'rgba(255,255,255,0.75)' : 'none'}
                    strokeWidth={isFace ? 1.2 : 0}
                  />
                  {isFace && (
                    <path d="M28 22 C22 24 18 30 19 37" stroke="rgba(255,255,255,0.8)" strokeWidth="3" strokeLinecap="round" fill="none" />
                  )}
                </svg>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hologram scanlines over the projection */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 14, width: size, height: size }}>
        <div className="holo-scan" style={{ borderRadius: '50%', opacity: 0.7 }} />
      </div>
    </div>
  );
}
