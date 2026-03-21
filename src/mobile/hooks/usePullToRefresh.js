import { useRef, useState, useCallback } from 'react';

export default function usePullToRefresh({ onRefresh, threshold = 60 }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const active = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    active.current = true;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!active.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      const clamped = Math.min(delta * 0.5, 100);
      setPullDistance(clamped);
      setPulling(true);
    } else {
      setPullDistance(0);
      setPulling(false);
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!active.current) return;
    active.current = false;
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold * 0.5);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
        setPulling(false);
      }
    } else {
      setPullDistance(0);
      setPulling(false);
    }
  }, [pullDistance, threshold, refreshing, onRefresh]);

  return { pulling, refreshing, pullDistance, onTouchStart, onTouchMove, onTouchEnd };
}
