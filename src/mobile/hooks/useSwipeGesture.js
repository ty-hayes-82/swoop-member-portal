import { useRef, useCallback } from 'react';

export default function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 80 }) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const elRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    swiping.current = true;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!swiping.current || !elRef.current) return;
    currentX.current = e.touches[0].clientX;
    const delta = currentX.current - startX.current;
    const clamped = Math.max(-150, Math.min(150, delta));
    elRef.current.style.transform = `translateX(${clamped}px)`;
    elRef.current.style.opacity = `${1 - Math.abs(clamped) / 250}`;
    // Color hint
    if (clamped > 20) {
      elRef.current.style.background = '#DCFCE7';
    } else if (clamped < -20) {
      elRef.current.style.background = '#FEE2E2';
    } else {
      elRef.current.style.background = '#FFFFFF';
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!swiping.current || !elRef.current) return;
    swiping.current = false;
    const delta = currentX.current - startX.current;
    if (delta > threshold) {
      elRef.current.style.transform = 'translateX(400px)';
      elRef.current.style.opacity = '0';
      setTimeout(() => onSwipeRight?.(), 200);
    } else if (delta < -threshold) {
      elRef.current.style.transform = 'translateX(-400px)';
      elRef.current.style.opacity = '0';
      setTimeout(() => onSwipeLeft?.(), 200);
    } else {
      elRef.current.style.transform = 'translateX(0)';
      elRef.current.style.opacity = '1';
      elRef.current.style.background = '#FFFFFF';
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { elRef, onTouchStart, onTouchMove, onTouchEnd };
}
