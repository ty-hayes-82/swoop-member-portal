import { useRef, useState, useCallback } from 'react';

export default function useSwipeGesture({ onSwipeLeft, onSwipeRight, threshold = 80 }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const directionLocked = useRef(null); // 'horizontal' | 'vertical' | null
  const elRef = useRef(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = startX.current;
    swiping.current = true;
    directionLocked.current = null;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!swiping.current || !elRef.current) return;
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;

    // Lock direction on first significant movement
    if (!directionLocked.current) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        directionLocked.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      }
    }

    // If vertical scroll, bail out
    if (directionLocked.current === 'vertical') {
      return;
    }

    // Horizontal swipe — prevent browser default (scroll, text select)
    if (directionLocked.current === 'horizontal') {
      e.preventDefault();
      e.stopPropagation();
      setIsSwiping(true);

      const clamped = Math.max(-150, Math.min(150, deltaX));
      elRef.current.style.transform = `translateX(${clamped}px) scale(${1 - Math.abs(clamped) / 1500})`;
      elRef.current.style.opacity = `${1 - Math.abs(clamped) / 300}`;

      // Color hint
      if (clamped > 20) {
        elRef.current.style.background = '#DCFCE7';
      } else if (clamped < -20) {
        elRef.current.style.background = '#FEE2E2';
      } else {
        elRef.current.style.background = '#FFFFFF';
      }
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!swiping.current || !elRef.current) return;
    swiping.current = false;
    setIsSwiping(false);

    if (directionLocked.current !== 'horizontal') {
      directionLocked.current = null;
      return;
    }

    directionLocked.current = null;
    const delta = currentX.current - startX.current;

    if (delta > threshold) {
      elRef.current.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      elRef.current.style.transform = 'translateX(400px) scale(0.95)';
      elRef.current.style.opacity = '0';
      setTimeout(() => {
        onSwipeRight?.();
        if (elRef.current) {
          elRef.current.style.transition = '';
          elRef.current.style.transform = '';
          elRef.current.style.opacity = '';
          elRef.current.style.background = '';
        }
      }, 200);
    } else if (delta < -threshold) {
      elRef.current.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      elRef.current.style.transform = 'translateX(-400px) scale(0.95)';
      elRef.current.style.opacity = '0';
      setTimeout(() => {
        onSwipeLeft?.();
        if (elRef.current) {
          elRef.current.style.transition = '';
          elRef.current.style.transform = '';
          elRef.current.style.opacity = '';
          elRef.current.style.background = '';
        }
      }, 200);
    } else {
      elRef.current.style.transition = 'transform 0.2s ease, opacity 0.2s ease, background 0.2s ease';
      elRef.current.style.transform = 'translateX(0) scale(1)';
      elRef.current.style.opacity = '1';
      elRef.current.style.background = '#FFFFFF';
      setTimeout(() => {
        if (elRef.current) elRef.current.style.transition = '';
      }, 200);
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { elRef, onTouchStart, onTouchMove, onTouchEnd, isSwiping };
}
