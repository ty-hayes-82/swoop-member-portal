import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { getMemberSaves } from '@/services/boardReportService';

/**
 * Story 5: "$32K Handshake" — persistent header for the conference demo.
 *
 * Pins to the top of ConferenceShell and displays a running tally of
 * dues protected + members rescued. Ticks up smoothly with a green
 * pulse each time a new save fires. Baseline seeded from
 * getMemberSaves() so the demo opens with a credible running total.
 *
 * Imperative API (via ref):
 *   - addSave(amount: number)  -> adds dollars + increments count
 *   - reset()                  -> returns to the baseline
 *
 * Belt + suspenders: also polls the activity feed (if available) every
 * 2s and auto-increments on unseen `conference_swipe_save` events.
 */

const GOAL = 1_000_000;
const TWEEN_MS = 200;
const PULSE_MS = 650;

const keyframes = `
@keyframes story5Pulse {
  0%   { background-color: #0A0A0A; }
  15%  { background-color: #0f3a22; }
  45%  { background-color: #10612f; }
  100% { background-color: #0A0A0A; }
}
@keyframes story5Shimmer {
  0%   { opacity: 0.55; }
  50%  { opacity: 1; }
  100% { opacity: 0.55; }
}
`;

function computeBaseline() {
  try {
    const rows = getMemberSaves() || [];
    if (!Array.isArray(rows) || rows.length === 0) {
      return { saved: 0, count: 0 };
    }
    const saved = rows.reduce((acc, r) => {
      // Task spec says duesAnnual; the canonical row uses duesAtRisk.
      // Accept either so the component works against both shapes.
      const v = Number(r?.duesAnnual ?? r?.duesAtRisk ?? 0);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
    return { saved, count: rows.length };
  } catch {
    return { saved: 0, count: 0 };
  }
}

function useTween(target, durationMs = TWEEN_MS) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    fromRef.current = display;
    startRef.current = performance.now();
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    const step = (now) => {
      const t = Math.min(1, (now - startRef.current) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + delta * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return display;
}

const Story5HandshakeBar = forwardRef(function Story5HandshakeBar(props, ref) {
  const baseline = useRef(computeBaseline());
  const [saved, setSaved] = useState(baseline.current.saved);
  const [count, setCount] = useState(baseline.current.count);
  const [pulseKey, setPulseKey] = useState(0);

  const firePulse = useCallback(() => setPulseKey((k) => k + 1), []);

  const addSave = useCallback(
    (amount) => {
      const n = Number(amount) || 0;
      setSaved((s) => s + n);
      setCount((c) => c + 1);
      firePulse();
    },
    [firePulse]
  );

  const reset = useCallback(() => {
    const b = computeBaseline();
    baseline.current = b;
    setSaved(b.saved);
    setCount(b.count);
  }, []);

  useImperativeHandle(ref, () => ({ addSave, reset }), [addSave, reset]);

  // Belt + suspenders: poll activity feed for conference_swipe_save events.
  // activityService currently exposes trackAction() only; if a reader is
  // added later (getRecentActivity) we will pick it up dynamically and
  // auto-increment. Fails silently when not present.
  const seenRef = useRef(new Set());
  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const tick = async () => {
      try {
        const mod = await import('@/services/activityService');
        const reader =
          mod.getRecentActivity || mod.getActivityFeed || mod.getActivity;
        if (typeof reader === 'function') {
          const events = (await reader()) || [];
          for (const ev of events) {
            const id =
              ev?.id ?? ev?.referenceId ?? `${ev?.actionType}:${ev?.createdAt}`;
            if (!id || seenRef.current.has(id)) continue;
            seenRef.current.add(id);
            if (ev?.actionType === 'conference_swipe_save') {
              const amt = Number(ev?.meta?.amount ?? ev?.meta?.duesAtRisk ?? 0);
              if (!cancelled) addSave(amt);
            }
          }
        }
      } catch {
        /* degrade silently */
      }
      if (!cancelled) timer = setTimeout(tick, 2000);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [addSave]);

  const displaySaved = useTween(saved);
  const displayCount = useTween(count);

  const savedK = Math.round(displaySaved / 1000);
  const pct = Math.max(0, Math.min(1, displaySaved / GOAL));
  // hue shifts from teal (190) toward green (140) as we near the goal
  const barHue = 190 - Math.round(50 * pct);

  // 2026-04-09 wave 13 mobile audit P2 fix: handshake bar had no tap
  // behavior — taps bubbled to the ConferenceShell tap-to-advance handler
  // and unexpectedly moved the user forward a scene. Now the bar tap
  // navigates to the regular mobile Members tab in All Members mode so
  // the user can drill into the actual saved-members list. We use
  // window.location.hash directly (the conference shell is mounted
  // outside the regular mobile shell, so we need a hash navigation that
  // crosses both routes). stopPropagation prevents the underlying shell's
  // tap-to-advance from firing.
  const handleBarTap = (e) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      window.location.hash = '#/m/members';
    }
  };

  return (
    <>
      <style>{keyframes}</style>
      <div
        key={`pulse-${pulseKey}`}
        role="button"
        tabIndex={0}
        onClick={handleBarTap}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBarTap(e); } }}
        title="Tap to view the saved members"
        aria-label={`${savedK} thousand dollars saved this quarter, ${Math.round(
          displayCount
        )} members rescued. Tap to view saved members.`}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          height: 64,
          background:
            'linear-gradient(90deg, #0A0A0A 0%, #0f1a14 50%, #0A0A0A 100%)',
          color: '#FFFFFF',
          borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.55)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          animation:
            pulseKey > 0 ? `story5Pulse ${PULSE_MS}ms ease-out` : undefined,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 18px 4px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(16, 185, 129, 0.9)',
                fontWeight: 600,
              }}
            >
              Saved this quarter
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#FFFFFF',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${savedK}K
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              lineHeight: 1.05,
            }}
          >
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                fontWeight: 600,
              }}
            >
              Members rescued
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#FFFFFF',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(displayCount)}
            </span>
          </div>
        </div>

        {/* progress bar toward $1M goal */}
        <div
          style={{
            height: 3,
            margin: '0 18px 6px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, hsl(${barHue}, 80%, 42%), hsl(${barHue - 10}, 85%, 55%))`,
              transition: 'width 220ms ease-out, background 220ms linear',
              animation: 'story5Shimmer 2.4s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </>
  );
});

export default Story5HandshakeBar;
