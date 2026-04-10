import { useEffect, useRef, useState, useCallback } from 'react';
import useSwipeGesture from '../hooks/useSwipeGesture';
import Story1WhoToTalk from './Story1WhoToTalk';
import Story2SwipeToSave from './Story2SwipeToSave';
import Story5HandshakeBar from './Story5HandshakeBar';

// ConferenceShell — mounted at #/m/conference. A full-screen, vertically
// paginated scene navigator for the conference-floor demo. Reuses the
// existing useSwipeGesture hook (horizontal swipe) for advance/retreat.
//
// Conference-floor shell. Coexists with MobileShell at #/m.
// Scenes: Story1 (at-risk walk), Story2 (swipe approval).
// Story5 "$32K handshake" is the persistent saves bar pinned across all scenes — wired via
// imperative ref so Story2 can call handshakeRef.current.addSave(dollars) on each approve.
const SCENES = [
  { key: 'story1', label: 'Who should I talk to today?', Component: Story1WhoToTalk },
  { key: 'story2', label: 'Swipe to save', Component: Story2SwipeToSave },
];

export default function ConferenceShell() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  // Imperative ref into the persistent handshake bar — Story 2 calls
  // handshakeRef.current.addSave(dollars) on each approve.
  const handshakeRef = useRef(null);

  // Story 2's onActionApproved callback: parses dollars and ticks the bar.
  const handleActionApproved = useCallback((dollars) => {
    if (handshakeRef.current?.addSave) handshakeRef.current.addSave(dollars || 0);
  }, []);

  const advance = () => setSceneIdx((i) => Math.min(SCENES.length - 1, i + 1));
  const retreat = () => setSceneIdx((i) => Math.max(0, i - 1));

  // useSwipeGesture is horizontal — map right→advance, left→retreat per task.
  const { elRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeRight: advance,
    onSwipeLeft: retreat,
    threshold: 100,
  });

  // Fade the "Tap for next" hint after 4 seconds.
  useEffect(() => {
    setHintVisible(true);
    const t = setTimeout(() => setHintVisible(false), 4000);
    return () => clearTimeout(t);
  }, [sceneIdx]);

  // Keyboard nav for desktop conference kiosks — setSceneIdx is inlined to avoid stale closures over advance/retreat.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setSceneIdx((i) => Math.min(SCENES.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSceneIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const SceneComponent = SCENES[sceneIdx].Component;
  // Inject the onActionApproved callback only into Story 2; other scenes
  // ignore the prop. Cheap shape coupling — fine at this scale.
  const sceneProps = SCENES[sceneIdx].key === 'story2'
    ? { onActionApproved: handleActionApproved }
    : {};

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0A',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        maxWidth: '428px',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Story 5 — persistent handshake bar pinned to the top across every scene */}
      <Story5HandshakeBar ref={handshakeRef} />

      {/* Persistent Story indicator */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 80px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(26, 26, 26, 0.85)',
          border: '1px solid #2A2A2A',
          borderRadius: '999px',
          padding: '6px 14px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#E5E7EB',
          zIndex: 20,
          backdropFilter: 'blur(8px)',
        }}
      >
        Story {sceneIdx + 1} of {SCENES.length}
      </div>

      {/* Scene container — swipe handlers attached here */}
      <div
        ref={elRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => {
          // Click anywhere outside a button to advance.
          if (e.target.closest('button')) return;
          advance();
        }}
        style={{
          minHeight: '100vh',
          willChange: 'transform, opacity',
          // Push content below the persistent handshake bar (~80px) + indicator
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 120px)',
        }}
      >
        <SceneComponent {...sceneProps} />
      </div>

      {/* Bottom "Tap for next →" hint, fades after 4s */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          opacity: hintVisible ? 1 : 0,
          transition: 'opacity 800ms ease',
          zIndex: 20,
        }}
      >
        <div
          style={{
            background: 'rgba(26, 26, 26, 0.85)',
            border: '1px solid #2A2A2A',
            borderRadius: '999px',
            padding: '8px 16px',
            fontSize: '12px',
            color: '#9CA3AF',
            backdropFilter: 'blur(8px)',
          }}
        >
          {sceneIdx < SCENES.length - 1 ? 'Tap for next \u2192' : 'End of demo \u00b7 swipe back \u2190'}
        </div>
      </div>
    </div>
  );
}
