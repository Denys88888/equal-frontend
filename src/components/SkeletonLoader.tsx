import { memo } from 'react';

interface SkeletonLoaderProps {
  variant: 'card' | 'text' | 'circle' | 'list';
  count?: number;
  className?: string;
}

const SkeletonLoader = memo(function SkeletonLoader({
  variant,
  count = 3,
  className = '',
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse rounded-xl';
  const baseStyle: React.CSSProperties = {
    backgroundColor: 'var(--linen-dark, #E8E2D8)',
  };

  if (variant === 'card') {
    return (
      <div
        className={`${baseClasses} overflow-hidden ${className}`}
        style={{
          ...baseStyle,
          aspectRatio: '3/4',
          borderRadius: 24,
        }}
        aria-label="Loading card"
      />
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={`${baseClasses} ${className}`}
        style={{
          ...baseStyle,
          width: 48,
          height: 48,
          borderRadius: '9999px',
        }}
        aria-label="Loading avatar"
      />
    );
  }

  if (variant === 'text') {
    return (
      <div className={`space-y-2 w-full ${className}`} aria-label="Loading text">
        <div
          className={baseClasses}
          style={{ ...baseStyle, height: 16, width: '100%', borderRadius: 9999 }}
        />
        <div
          className={baseClasses}
          style={{ ...baseStyle, height: 16, width: '80%', borderRadius: 9999 }}
        />
        <div
          className={baseClasses}
          style={{ ...baseStyle, height: 16, width: '60%', borderRadius: 9999 }}
        />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-3 w-full ${className}`} aria-label="Loading list">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={baseClasses}
              style={{
                ...baseStyle,
                width: 48,
                height: 48,
                borderRadius: '9999px',
                flexShrink: 0,
              }}
            />
            <div className="flex-1 space-y-2">
              <div
                className={baseClasses}
                style={{ ...baseStyle, height: 16, width: '60%', borderRadius: 9999 }}
              />
              <div
                className={baseClasses}
                style={{ ...baseStyle, height: 12, width: '40%', borderRadius: 9999 }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
});

export default SkeletonLoader;
