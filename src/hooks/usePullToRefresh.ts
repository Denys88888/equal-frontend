import { useState, useCallback, useRef, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  pullStartY: React.RefObject<number | null>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStartY = useRef<number | null>(null);
  const currentDistance = useRef(0);
  const isAtTop = useRef(true);

  const checkIsAtTop = useCallback(() => {
    return window.scrollY === 0 || document.documentElement.scrollTop === 0;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      isAtTop.current = checkIsAtTop();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [checkIsAtTop]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;
      isAtTop.current = checkIsAtTop();
      if (!isAtTop.current) return;
      pullStartY.current = e.touches[0].clientY;
    },
    [disabled, isRefreshing, checkIsAtTop]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing || pullStartY.current === null || !isAtTop.current) return;

      const currentY = e.touches[0].clientY;
      const delta = currentY - pullStartY.current;

      if (delta > 0) {
        const resistance = 0.4;
        currentDistance.current = delta * resistance;
        setPullDistance(Math.min(currentDistance.current, threshold * 1.5));

        if (currentDistance.current > threshold) {
          e.preventDefault();
        }
      }
    },
    [disabled, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(() => {
    if (disabled || isRefreshing) return;

    if (currentDistance.current > threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.8);

      const result = onRefresh();
      if (result && typeof result.then === 'function') {
        result.finally(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          currentDistance.current = 0;
          pullStartY.current = null;
        });
      } else {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          currentDistance.current = 0;
          pullStartY.current = null;
        }, 1200);
      }
    } else {
      setPullDistance(0);
      currentDistance.current = 0;
    }

    pullStartY.current = null;
  }, [disabled, isRefreshing, threshold, onRefresh]);

  return {
    isRefreshing,
    pullDistance,
    pullStartY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

export default usePullToRefresh;
