import { useMemo, useState } from 'react';
import { getDailyBriefing } from '@/services/briefingService';
import { getMemberProfile } from '@/services/memberService';
import { buildDecayChain } from '@/features/member-profile/MemberDecayChain';
import { trackAction } from '@/services/activityService';
import SourceBadge from '@/components/ui/SourceBadge';

// Story1WhoToTalk — phone-native at-risk member walk.
// Data: getDailyBriefing().todayRisks.atRiskTeetimes + buildDecayChain(profile). No new dollar literals.

const DOMAIN_COLORS = {
  Golf: '#12b76a',
  Dining: '#f59e0b',
  Events: '#ff8b00',
  Email: '#2563eb',
  Risk: '#ef4444',
  Activity: '#9CA3AF',
};

const DOMAIN_TO_SYSTEM = {
  Golf: 'Tee Sheet',
  Dining: 'POS',
  Email: 'Email',
  Events: 'Member CRM',
};

function healthColor(score) {
  if (score >= 70) return '#12b76a';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function MemberCard({ risk }) {
  // briefingService emits `score` on the dynamic path and `health` on the static fallback — coalesce both.
  const healthValue = risk.score ?? risk.health ?? 0;
  const [calling, setCalling] = useState(false);

  // Try to hydrate a full profile so buildDecayChain has activity/riskSignals
  // to work with. When the profile lookup is missing, fall back to a minimal
  // object — buildDecayChain's `events.length < 4` branch will supply a
  // demo decay sequence, which is exactly what the conference scene needs.
  const profile = useMemo(() => {
    try {
      const p = getMemberProfile(risk.memberId);
      if (p && (p.name || p.memberId)) return p;
    } catch (_) {
      // swallow — static demo data not loaded yet
    }
    return { memberId: risk.memberId, name: risk.name, activity: [], riskSignals: [] };
  }, [risk.memberId, risk.name]);

  const { decayChain } = useMemo(() => buildDecayChain(profile), [profile]);
  // Limit to 3 steps per the spec ("3-step decay sequence").
  const steps = decayChain.slice(0, 3);

  const initial = (risk.name || '?').trim().charAt(0).toUpperCase();
  const color = healthColor(healthValue);

  // Kept as <button> (not <a>) so trackAction fires for the audit log; tel: nav is triggered imperatively.
  const phone = profile?.contact?.phone || null;
  const handleCall = (e) => {
    e.stopPropagation();
    trackAction({
      actionType: 'approve',
      actionSubtype: 'conference_call_now',
      memberId: risk.memberId,
      memberName: risk.name,
      referenceType: 'conference_demo',
      referenceId: `call_${risk.memberId}`,
      description: `Conference demo: Call now \u2192 ${risk.name}`,
    });
    setCalling(true);
    setTimeout(() => setCalling(false), 2000);
    if (phone && typeof window !== 'undefined') {
      // Strip everything except digits and + for the tel: scheme
      const dialable = phone.replace(/[^0-9+]/g, '');
      if (dialable) {
        window.location.href = `tel:${dialable}`;
      }
    }
  };

  return (
    <section
      style={{
        minHeight: '100vh',
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '72px 20px 120px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '20px',
          padding: '24px 22px',
          boxShadow: '0 18px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Avatar + name + tee time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: `${color}22`,
              border: `2px solid ${color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
              color,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>{risk.name}</div>
            <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>
              {'Tee time \u00b7 '}{risk.time}
            </div>
          </div>
        </div>

        {/* Health score */}
        <div
          style={{
            marginTop: 20,
            padding: '14px 16px',
            background: `${color}12`,
            border: `1px solid ${color}44`,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>
              Health score
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1, marginTop: 2 }}>
              {healthValue}
              <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600, marginLeft: 4 }}>/100</span>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 999,
              background: `${color}22`,
              color,
              border: `1px solid ${color}55`,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            At risk
          </div>
        </div>

        {/* Decay chain */}
        {steps.length >= 2 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 8 }}>
              {'First Domino \u00b7 Decay sequence'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              {steps.map((step, i) => {
                const c = DOMAIN_COLORS[step.domain] || '#9CA3AF';
                return (
                  <div key={`${step.domain}-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        background: `${c}1F`,
                        border: `1px solid ${c}55`,
                        borderRadius: 8,
                        padding: '6px 10px',
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {step.domain} dropped
                      </div>
                      <div style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>{step.date}</div>
                    </div>
                    {i < steps.length - 1 && (
                      <span style={{ margin: '0 4px', color: '#6B7280', fontWeight: 700 }}>{'\u2192'}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Source badges */}
        <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <SourceBadge system="Tee Sheet" size="xs" />
          <SourceBadge system="POS" size="xs" />
          <SourceBadge system="Member CRM" size="xs" />
          <SourceBadge system="Email" size="xs" />
        </div>

        {/* Call now CTA */}
        <button
          type="button"
          onClick={handleCall}
          style={{
            marginTop: 22,
            width: '100%',
            padding: '16px 20px',
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: '#0A0A0A',
            background: calling ? '#86EFAC' : '#22D3A3',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            transition: 'background 160ms ease, transform 120ms ease',
            boxShadow: '0 8px 24px rgba(34, 211, 163, 0.35)',
          }}
        >
          {calling ? `${'\u2713'} Logged` : 'Call now'}
        </button>
      </div>
    </section>
  );
}

export default function Story1WhoToTalk() {
  const briefing = getDailyBriefing();
  const atRisk = briefing?.todayRisks?.atRiskTeetimes || [];

  return (
    <div
      style={{
        height: '100vh',
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {atRisk.length === 0 && (
        <div style={{ padding: '120px 24px', textAlign: 'center', color: '#9CA3AF' }}>
          No at-risk tee times for today.
        </div>
      )}
      {atRisk.map((risk) => (
        <MemberCard key={risk.memberId} risk={risk} />
      ))}
    </div>
  );
}
