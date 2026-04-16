/**
 * GBTCDemoControl
 *
 * GBTC conference demo controller — accessible at /#/demo-gbtc
 *
 * Full-screen demo shell with:
 *   Left:   Demo trigger buttons (6 scenarios) + seed/reset controls
 *   Center: Live AgentRoutingFeed (the "control tower" view)
 *   Right:  James Whitfield member session log + learned preferences
 *
 * On mobile: stacked layout, trigger buttons hidden behind "Control" toggle.
 *
 * Design: dark-mode conference-ready UI — looks great on a phone handed to a prospect.
 */

import { useState, useCallback } from 'react';
import AgentRoutingFeed from './AgentRoutingFeed';
import MemberSessionLog from './MemberSessionLog';

const CLUB_ID = 'seed_pinetree';

const SCENARIOS = [
  {
    id: 'complaint_filed',
    label: 'File complaint',
    description: 'James Whitfield files Grill complaint',
    icon: '⚠️',
    color: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
  },
  {
    id: 'engagement_decay',
    label: 'Engagement decay',
    description: 'Member Pulse detects James declining',
    icon: '📉',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    id: 'member_at_risk',
    label: 'Critical at-risk',
    description: '84% resignation risk — 48-hr window',
    icon: '🚨',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
  },
  {
    id: 'preference_learned',
    label: 'Learn preference',
    description: 'Behavior observed: back nine, booth 12',
    icon: '🧠',
    color: '#8b5cf6',
    bg: '#faf5ff',
    border: '#e9d5ff',
  },
  {
    id: 'pricing_rec',
    label: 'Pricing signal',
    description: 'Revenue Analyst: Tuesday twilight opp',
    icon: '💰',
    color: '#059669',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    id: 'recovery_confirmed',
    label: 'Recovery confirmed',
    description: 'Maya closes the loop — $32K protected',
    icon: '✅',
    color: '#10b981',
    bg: '#f0fdf4',
    border: '#6ee7b7',
  },
];

async function triggerScenario(scenario) {
  const res = await fetch('/api/demo/trigger-scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, club_id: CLUB_ID }),
  });
  return res.json();
}

async function seedDemo() {
  const res = await fetch('/api/demo/seed-gbtc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ club_id: CLUB_ID }),
  });
  return res.json();
}

function TriggerButton({ scenario, onTrigger, firing, lastResult }) {
  const isFiring = firing === scenario.id;

  return (
    <button
      onClick={() => onTrigger(scenario.id)}
      disabled={isFiring}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        width: '100%',
        padding: '12px 14px',
        borderRadius: 10,
        border: `1px solid ${isFiring ? scenario.color : scenario.border}`,
        background: isFiring ? scenario.bg : 'rgba(255,255,255,0.04)',
        cursor: isFiring ? 'default' : 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        opacity: isFiring ? 0.7 : 1,
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{scenario.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: isFiring ? scenario.color : '#f1f5f9', marginBottom: 2 }}>
          {isFiring ? 'Firing…' : scenario.label}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.3 }}>{scenario.description}</div>
        {lastResult && (
          <div style={{ fontSize: 10, color: '#10b981', marginTop: 4 }}>
            ✓ {lastResult.events_written?.length || 0} events written
          </div>
        )}
      </div>
    </button>
  );
}

export default function GBTCDemoControl() {
  const [firing, setFiring] = useState(null);
  const [results, setResults] = useState({});
  const [controlOpen, setControlOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [activeView, setActiveView] = useState('feed'); // 'feed' | 'member'
  const [error, setError] = useState(null);

  const handleTrigger = useCallback(async (scenarioId) => {
    setFiring(scenarioId);
    setError(null);
    try {
      const result = await triggerScenario(scenarioId);
      setResults(prev => ({ ...prev, [scenarioId]: result }));
    } catch (e) {
      setError(e.message);
    } finally {
      setFiring(null);
    }
  }, []);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      await seedDemo();
      setSeedDone(true);
      setTimeout(() => setSeedDone(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSeeding(false);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0f172a',
      color: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(15,23,42,0.95)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', letterSpacing: -0.3 }}>Swoop Operating Layer</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Pinetree Country Club · Live demo</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Mobile: view toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3 }}>
            {[{ id: 'feed', label: 'Feed' }, { id: 'member', label: 'James' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6, border: 'none',
                  background: activeView === tab.id ? 'rgba(99,102,241,0.8)' : 'transparent',
                  color: activeView === tab.id ? '#fff' : '#94a3b8',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Trigger panel toggle */}
          <button
            onClick={() => setControlOpen(o => !o)}
            style={{
              fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 8,
              background: controlOpen ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', cursor: 'pointer',
            }}
          >
            {controlOpen ? 'Hide' : 'Trigger'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: 12, padding: '8px 16px', borderBottom: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Trigger panel (collapsible) */}
      {controlOpen && (
        <div style={{
          background: 'rgba(15,23,42,0.98)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 16px',
          animation: 'slideDown 0.2s ease-out',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Demo Triggers
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {SCENARIOS.map(s => (
              <TriggerButton
                key={s.id}
                scenario={s}
                onTrigger={handleTrigger}
                firing={firing}
                lastResult={results[s.id]}
              />
            ))}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button
              onClick={handleSeed}
              disabled={seeding}
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                background: seedDone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${seedDone ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: seedDone ? '#10b981' : '#94a3b8', cursor: seeding ? 'default' : 'pointer',
              }}
            >
              {seeding ? 'Seeding…' : seedDone ? '✓ Sessions seeded' : 'Seed demo data'}
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, padding: '12px 16px', overflow: 'auto' }}>
        {activeView === 'feed' ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '14px 12px',
            color: '#f1f5f9',
          }}>
            <AgentRoutingFeed clubId={CLUB_ID} maxItems={15} compact />
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '14px 12px',
          }}>
            <MemberSessionLog memberId="mbr_t01" clubId={CLUB_ID} dark />
          </div>
        )}
      </div>

      {/* Demo script hint at bottom */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(99,102,241,0.08)',
        borderTop: '1px solid rgba(99,102,241,0.15)',
        fontSize: 11, color: '#818cf8',
      }}>
        <span style={{ fontWeight: 700 }}>Demo script:</span> Tap Trigger → fire complaint → watch routing → switch to James tab → show session memory
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
