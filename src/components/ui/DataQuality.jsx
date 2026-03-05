// DataQuality — "Your Systems" integration panel.
// Critique Phase 5: show error states, data quality %, what's flowing in.
// Eliminates "black box" anxiety for experienced operators.
import { useState } from 'react';
import { theme } from '@/config/theme';

const SYSTEMS = [
  {
    name: 'ForeTees',
    type: 'Tee Sheet & Reservations',
    status: 'connected',
    lastSync: '4 min ago',
    quality: 98,
    detail: '2,524 bookings · 8,196 player records · 35 waitlist entries',
    note: null,
  },
  {
    name: 'Jonas POS',
    type: 'Food & Beverage',
    status: 'connected',
    lastSync: '7 min ago',
    quality: 94,
    detail: '3,851 checks · 17,443 line items',
    note: '6% of checks are guest transactions — not linked to member profiles. This is expected.',
  },
  {
    name: 'Northstar',
    type: 'Member CRM & Dues',
    status: 'connected',
    lastSync: '12 min ago',
    quality: 99,
    detail: '300 members · 220 households · 6 membership types',
    note: null,
  },
  {
    name: 'ClubReady',
    type: 'Staffing & Scheduling',
    status: 'connected',
    lastSync: '1 min ago',
    quality: 97,
    detail: '45 staff · 701 shifts · 31 days',
    note: null,
  },
  {
    name: 'Club Prophet',
    type: 'Events & Programming',
    status: 'connected',
    lastSync: '9 min ago',
    quality: 100,
    detail: '12 events · 641 registrations',
    note: null,
  },
];

const statusStyle = (s) => ({
  connected: { color: theme.colors.success, label: '● Connected' },
  warning:   { color: theme.colors.warning, label: '◑ Partial' },
  error:     { color: theme.colors.urgent,  label: '○ Offline' },
}[s]);

export default function DataQuality() {
  const [expanded, setExpanded] = useState(null);
  const overall = Math.round(SYSTEMS.reduce((s, sys) => s + sys.quality, 0) / SYSTEMS.length);

  return (
    <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: `${theme.spacing.md} ${theme.spacing.lg}`, borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>Your Connected Systems</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
            Every number in this platform traces back to one of these systems
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.success }}>{overall}%</div>
          <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>data quality</div>
        </div>
      </div>

      {/* System rows */}
      {SYSTEMS.map((sys, i) => {
        const st = statusStyle(sys.status);
        const isOpen = expanded === sys.name;
        return (
          <div key={sys.name}>
            <div
              onClick={() => setExpanded(isOpen ? null : sys.name)}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                borderBottom: `1px solid ${theme.colors.borderLight}`,
                display: 'flex', alignItems: 'center', gap: theme.spacing.md,
                cursor: 'pointer', background: isOpen ? theme.colors.bgDeep : 'transparent',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>{sys.name}</span>
                  <span style={{ fontSize: '10px', color: theme.colors.textMuted }}>{sys.type}</span>
                </div>
                <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginTop: 1 }}>{sys.detail}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', color: st.color, fontWeight: 600 }}>{st.label}</div>
                <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>Synced {sys.lastSync}</div>
              </div>
              <div style={{ width: 48, height: 6, background: theme.colors.border, borderRadius: 3, flexShrink: 0 }}>
                <div style={{ height: '100%', background: sys.quality > 95 ? theme.colors.success : theme.colors.warning, borderRadius: 3, width: `${sys.quality}%` }} />
              </div>
              <span style={{ fontSize: '10px', color: theme.colors.textMuted, width: 30, flexShrink: 0 }}>{sys.quality}%</span>
              <span style={{
                fontSize: '14px', color: theme.colors.textMuted,
                display: 'inline-block',
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
              }}>›</span>
            </div>
            {isOpen && (
              <div style={{ padding: `${theme.spacing.sm} ${theme.spacing.lg} ${theme.spacing.md}`, background: theme.colors.bgDeep, borderBottom: `1px solid ${theme.colors.border}` }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
                  <strong style={{ color: theme.colors.textPrimary }}>What we pull:</strong> {sys.detail}
                </div>
                {sys.note && (
                  <div style={{ marginTop: '6px', padding: '6px 10px', background: `${theme.colors.info}10`, borderLeft: `3px solid ${theme.colors.info}`, borderRadius: `0 4px 4px 0`, fontSize: theme.fontSize.xs, color: theme.colors.info, lineHeight: 1.6 }}>
                    ℹ {sys.note}
                  </div>
                )}
                <div style={{ marginTop: '8px', fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                  Data quality measures what % of records fully matched across systems.{sys.quality < 100 && ` The ${100 - sys.quality}% gap is normal — it represents guest transactions and records created outside normal workflow.`}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ padding: theme.spacing.md, background: theme.colors.bgDeep, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: theme.colors.textMuted }}>
          Typical go-live timeline with ForeTees + Jonas: 10–14 days
        </span>
        <span style={{ fontSize: '11px', color: theme.colors.success, fontWeight: 600 }}>● All systems syncing normally</span>
      </div>
    </div>
  );
}
