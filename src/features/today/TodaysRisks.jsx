// TodaysRisks — Staffing status grid + Open complaints with aging
import { theme } from '@/config/theme';
import { feedbackRecords } from '@/data/staffing';
import { useNavigation } from '@/context/NavigationContext';
import MemberLink from '@/components/MemberLink';

const REF_DATE = new Date('2026-01-31');

// Current staffing status per outlet (derived from staffing data)
const OUTLETS = [
  { name: 'Grill Room', current: 2, required: 4 },
  { name: 'Terrace', current: 3, required: 3 },
  { name: 'Pool Bar', current: 1, required: 1 },
];

function getStaffingColor(current, required) {
  if (current >= required) return theme.colors.success;
  if (current >= required - 1) return '#ca8a04';
  return theme.colors.urgent;
}

function getStaffingLabel(current, required) {
  if (current >= required) return 'Fully staffed';
  if (current >= required - 1) return 'Tight';
  return 'Gap';
}

export default function TodaysRisks() {
  const { navigate } = useNavigation();

  // Unresolved complaints with aging
  const unresolvedComplaints = feedbackRecords
    .filter(f => f.status !== 'resolved')
    .map(f => {
      const days = Math.round((REF_DATE - new Date(f.date)) / (1000 * 60 * 60 * 24));
      return { ...f, daysOpen: days };
    })
    .sort((a, b) => b.daysOpen - a.daysOpen);

  const displayComplaints = unresolvedComplaints.slice(0, 3);
  const totalUnresolved = unresolvedComplaints.length;

  const statusColors = {
    acknowledged: '#ca8a04',
    in_progress: theme.colors.info500,
    escalated: theme.colors.urgent,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {/* Staffing Status Grid */}
      <div>
        <div style={{
          fontSize: '11px', fontWeight: 700, color: theme.colors.accent,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
        }}>
          Today's Staffing vs Demand
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}>
          {OUTLETS.map(outlet => {
            const color = getStaffingColor(outlet.current, outlet.required);
            const label = getStaffingLabel(outlet.current, outlet.required);
            return (
              <div
                key={outlet.name}
                onClick={() => navigate('service', { tab: 'staffing' })}
                style={{
                  background: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.border}`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: theme.radius.md,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = theme.shadow.md; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>
                  {outlet.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color }}>
                    {outlet.current}/{outlet.required}
                  </span>
                  <span style={{ fontSize: theme.fontSize.xs, color, fontWeight: 600 }}>
                    {label}
                  </span>
                </div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
                  servers
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Open Complaints with Aging */}
      <div>
        <div style={{
          fontSize: '11px', fontWeight: 700, color: theme.colors.warning,
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
        }}>
          Open Complaints ({totalUnresolved})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {displayComplaints.map(c => {
            const isOld = c.daysOpen > 7;
            const isCritical = c.daysOpen > 30;
            const statusColor = statusColors[c.status] || theme.colors.textMuted;

            return (
              <div
                key={c.id}
                onClick={() => navigate('service', { tab: 'complaints' })}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: theme.radius.sm,
                  background: isOld ? `${theme.colors.urgent}06` : theme.colors.bgCard,
                  border: `1px solid ${isOld ? theme.colors.urgent + '25' : theme.colors.border}`,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s',
                  animation: isCritical ? 'pulse-border 2s infinite' : 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = theme.shadow.md; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <MemberLink memberId={c.memberId} mode="drawer" style={{
                    fontWeight: 600, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary,
                    whiteSpace: 'nowrap',
                  }}>
                    {c.memberName}
                  </MemberLink>
                  <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                    {c.category}
                  </span>
                  {c.isUnderstaffedDay && (
                    <span style={{ fontSize: '9px', fontWeight: 700, color: theme.colors.urgent, background: `${theme.colors.urgent}12`, padding: '1px 5px', borderRadius: '999px' }}>
                      Understaffed
                    </span>
                  )}
                  {!c.isUnderstaffedDay && c.daysOpen <= 10 && (
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#ca8a04', background: '#ca8a0412', padding: '1px 5px', borderRadius: '999px' }}>
                      High-demand day
                    </span>
                  )}
                  {c.category === 'Pace of Play' && (
                    <span style={{ fontSize: '9px', fontWeight: 700, color: theme.colors.info500 || '#3B82F6', background: `${theme.colors.info500 || '#3B82F6'}12`, padding: '1px 5px', borderRadius: '999px' }}>
                      Weather impact
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                    background: `${theme.colors.accent}10`, color: theme.colors.accent,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {c.daysOpen > 14 ? 'GM' : 'Dept Head'}
                  </span>
                  <span style={{
                    fontSize: theme.fontSize.xs, fontWeight: 700,
                    color: isOld ? theme.colors.urgent : theme.colors.textSecondary,
                  }}>
                    {c.daysOpen}d
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                    background: `${statusColor}15`, color: statusColor,
                    textTransform: 'capitalize',
                  }}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {totalUnresolved > 3 && (
          <button
            onClick={() => navigate('service', { tab: 'complaints' })}
            style={{
              marginTop: 8, padding: '6px 12px', fontSize: theme.fontSize.xs,
              fontWeight: 600, color: theme.colors.accent, background: 'none',
              border: `1px solid ${theme.colors.accent}30`, borderRadius: theme.radius.sm,
              cursor: 'pointer',
            }}
          >
            View all {totalUnresolved} in Service →
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse-border {
          0%, 100% { border-color: ${theme.colors.urgent}25; }
          50% { border-color: ${theme.colors.urgent}60; }
        }
      `}</style>
    </div>
  );
}
