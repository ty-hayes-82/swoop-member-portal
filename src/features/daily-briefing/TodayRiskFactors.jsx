import { useState } from 'react';
import Badge from '@/components/ui/Badge.jsx';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import TeeSheetRisk from './TeeSheetRisk.jsx';
import { theme } from '@/config/theme';

const WEATHER_ICONS = {
  sunny: '☀️', cloudy: '⛅', rainy: '🌧️', windy: '💨', closed: '🔒', perfect: '☀️',
};

const getArchetypes = (members) => [...new Set(members.map(m => m.archetype).filter(Boolean))];

// AtRiskRow — hoverable member row with visible interactive feedback
function AtRiskRow({ m, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onNavigate?.('member-health')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 14px',
        background: hovered ? '16' : '08',
        border: `1px solid ${hovered ? '50' : '22'}`,
        borderRadius: '8px', cursor: 'pointer',
        transition: 'all 0.12s ease',
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', color: theme.colors.accent, fontWeight: 700, flexShrink: 0 }}>
        {m.score}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{
            fontSize: '13px', fontWeight: 600,
            color: hovered ? theme.colors.accent : theme.colors.textPrimary,
            transition: 'color 0.12s ease',
          }}>{m.name}</span>
          {m.archetype && <ArchetypeBadge archetype={m.archetype} size="xs" />}
        </div>
        <div style={{ fontSize: '12px', color: theme.colors.textMuted }}>{m.topRisk}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: theme.colors.textSecondary, fontFamily: theme.fonts.mono }}>{m.time}</div>
        <span style={{ color: hovered ? theme.colors.accent : theme.colors.textMuted, fontSize: '14px', transition: 'color 0.12s ease' }}>›</span>
      </div>
    </div>
  );
}

function getAlertColor(probability) {
  if (probability > 60) return { border: `${theme.colors.urgent}60`, bg: `${theme.colors.urgent}10`, label: theme.colors.urgent, text: 'Red Alert' };
  if (probability >= 30) return { border: `${theme.colors.warning}60`, bg: `${theme.colors.warning}10`, label: theme.colors.warning, text: 'Yellow Alert' };
  return null;
}

export default function TodayRiskFactors({ data, onNavigate }) {
  const { weather, tempHigh, wind, atRiskTeetimes, staffingGaps, fullyStaffed, cancellationRisk } = data;
  const [archetypeFilter, setArchetypeFilter] = useState(null);

  const archetypes = getArchetypes(atRiskTeetimes);
  const filtered   = archetypeFilter
    ? atRiskTeetimes.filter(m => m.archetype === archetypeFilter)
    : atRiskTeetimes;
  const cancellationAlerts = (cancellationRisk?.topAtRiskMembers || [])
    .map((member) => ({ ...member, alert: getAlertColor(member.probability) }))
    .filter((member) => member.alert);

  const navigateToPredictions = () => onNavigate?.('waitlist-demand', { waitlistTab: 'predictions' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Weather row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: '8px',
      }}>
        <span style={{ fontSize: '24px' }}>{WEATHER_ICONS[weather] || '☀️'}</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {tempHigh}°F · {weather.charAt(0).toUpperCase() + weather.slice(1)}
            {wind > 15 && <span style={{ color: theme.colors.warning, fontSize: '12px', marginLeft: '8px' }}>Wind advisory: {wind} mph</span>}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Saturday Jan 17 — {wind < 12 ? 'Ideal golf conditions' : 'Elevated pace risk on exposed holes'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Badge text={fullyStaffed ? '✓ Fully Staffed' : '⚠ Staffing Gap'} variant={fullyStaffed ? 'success' : 'urgent'} />
        </div>
      </div>

      {/* Tee sheet cancellation risk */}
      {cancellationRisk && <TeeSheetRisk cancellationRisk={cancellationRisk} />}

      {/* Tee sheet risk alerts */}
      {cancellationAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 600 }}>
            TEE SHEET RISK ALERTS
          </div>
          {cancellationAlerts.map((member) => (
            <button
              key={member.memberId}
              onClick={navigateToPredictions}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${member.alert.border}`,
                background: member.alert.bg,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <MemberLink mode="drawer"
                      memberId={member.memberId}
                      style={{ fontSize: '13px', fontWeight: 700 }}
                    >
                      {member.memberName}
                    </MemberLink>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: member.alert.label, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {member.alert.text}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.recommendedAction}
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: member.alert.label }}>{member.probability}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Predictions →</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* At-risk tee times */}
      {atRiskTeetimes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Header with archetype filter — 2-click filter per Phase 4 spec */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 600 }}>
              AT-RISK MEMBERS WITH TEE TIMES TODAY
            </div>
            {/* Filter by archetype */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {archetypeFilter && (
                <button onClick={() => setArchetypeFilter(null)} style={{
                  fontSize: '10px', color: theme.colors.textMuted, background: 'none',
                  border: `1px solid ${theme.colors.border}`, borderRadius: '4px',
                  padding: '2px 6px', cursor: 'pointer',
                }}>
                  ✕ All
                </button>
              )}
              {archetypes.map(a => (
                <button key={a} onClick={() => setArchetypeFilter(a === archetypeFilter ? null : a)} style={{
                  fontSize: '10px', fontWeight: 600, background: 'none', border: 'none',
                  cursor: 'pointer', padding: '2px 6px', borderRadius: '4px',
                  color: a === archetypeFilter ? theme.colors.textPrimary : theme.colors.textMuted,
                  textDecoration: a === archetypeFilter ? 'underline' : 'none',
                }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {filtered.map(m => (
            <AtRiskRow key={m.memberId} m={m} onNavigate={onNavigate} />
          ))}
        </div>
      )}

      {/* Staffing gaps */}
      {staffingGaps.length > 0 && (
        <div style={{ padding: '10px 14px', background: `${theme.colors.urgent}10`, border: `1px solid ${theme.colors.urgent}30`, borderRadius: '8px' }}>
          {staffingGaps.map((gap, i) => (
            <div key={i} style={{ fontSize: '13px', color: theme.colors.urgent }}>⚠ {gap}</div>
          ))}
        </div>
      )}
    </div>
  );
}
