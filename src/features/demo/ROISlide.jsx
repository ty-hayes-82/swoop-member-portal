/**
 * ROISlide — Full-screen dark ROI presentation slide with animated counter.
 * Route: #/demo/roi
 */
import { useState, useEffect, useRef } from 'react';

function AnimatedCounter({ target, duration = 2000, suffix = '' }) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = performance.now();

    function tick(now) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return <span>{value.toLocaleString()}{suffix}</span>;
}

export default function ROISlide() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Slight delay so the page renders first, then animate
    const t = setTimeout(() => setStarted(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #111827 40%, #1a1a2e 100%)',
      }}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={() => { window.location.hash = '#/today'; }}
        className="absolute top-4 left-4 text-sm text-gray-500 hover:text-gray-300 bg-transparent border-none cursor-pointer"
      >
        &larr; Back
      </button>

      {/* Swoop logo / label */}
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-500 mb-8">
        Swoop Golf &middot; ROI Summary
      </div>

      {/* Big number */}
      <div className="text-center mb-6">
        <div className="text-7xl md:text-9xl font-black text-white leading-none tracking-tight">
          $71<span className="text-4xl md:text-5xl text-gray-400 font-bold">/month</span>
        </div>
        <p className="text-gray-500 text-lg mt-3">per club, fully loaded</p>
      </div>

      {/* What you get */}
      <div className="max-w-2xl text-center mb-10">
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
          <span className="text-white font-semibold">7 club-side agents</span> running 24/7.{' '}
          <span className="text-white font-semibold">300 personalized member concierges.</span>{' '}
          <span className="text-white font-semibold">Daily Game Plan.</span>{' '}
          <span className="text-white font-semibold">Monthly Board Report.</span>
        </p>
      </div>

      {/* Value line */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 mb-12 text-center">
        <div>
          <div className="text-3xl md:text-4xl font-bold text-emerald-400">$54K</div>
          <div className="text-sm text-gray-500 mt-1">dues protected</div>
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-bold text-blue-400">$8K</div>
          <div className="text-sm text-gray-500 mt-1">incremental F&B</div>
        </div>
        <div>
          <div className="text-3xl md:text-4xl font-bold text-amber-400">14 hrs</div>
          <div className="text-sm text-gray-500 mt-1">GM time saved / month</div>
        </div>
      </div>

      {/* ROI counter */}
      <div className="text-center">
        <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Return on Investment</div>
        <div className="text-8xl md:text-[10rem] font-black text-transparent bg-clip-text leading-none"
          style={{
            backgroundImage: 'linear-gradient(135deg, #34d399 0%, #3b82f6 50%, #a855f7 100%)',
          }}
        >
          {started ? <AnimatedCounter target={873} duration={2500} /> : '0'}
          <span className="text-5xl md:text-7xl">:1</span>
        </div>
      </div>

      {/* Subtle footer */}
      <div className="absolute bottom-6 text-xs text-gray-600 text-center">
        Based on Pine Tree CC pilot data &middot; January 2026
      </div>
    </div>
  );
}
