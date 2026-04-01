/**
 * Data Health Dashboard — Resilience Phase 3
 * Shows each domain's connection status, row counts, freshness,
 * dependent feature count, and "features you will unlock."
 */
import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import { useNavigation } from '@/context/NavigationContext';

const DOMAIN_INFO = {
  CRM: { icon: '👥', label: 'CRM / Members', desc: 'Member profiles, dues, tenure, household data', vendor: 'Jonas Club, Clubessential' },
  TEE_SHEET: { icon: '⛳', label: 'Tee Sheet', desc: 'Rounds, tee times, cancellations, pace data, waitlist', vendor: 'ForeTees, Club Prophet' },
  POS: { icon: '🍽️', label: 'POS / F&B', desc: 'Dining transactions, covers, item detail, staff attribution', vendor: 'Jonas POS, Northstar, Toast' },
  EMAIL: { icon: '📧', label: 'Email & Events', desc: 'Campaign open rates, event attendance, RSVPs', vendor: 'Constant Contact, Mailchimp' },
  LABOR: { icon: '👷', label: 'Scheduling & Labor', desc: 'Staff shifts, clock data, staffing schedules', vendor: 'ADP, 7shifts, HotSchedules' },
};

const VALUE_PCTS = { CRM: 40, TEE_SHEET: 25, POS: 20, EMAIL: 10, LABOR: 5 };

export default function DataHealthDashboard() {
  const { navigate } = useNavigation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
    if (!clubId) { setLoading(false); return; }
    fetch(`/api/feature-availability?clubId=${clubId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fallback for demo mode — reflect the 4 sources shown as connected in Integrations tab
  const DEMO_CONNECTED = { CRM: true, EMAIL: true };
  const domains = data?.domains || Object.keys(DOMAIN_INFO).map(code => ({
    code,
    connected: !!DEMO_CONNECTED[code],
    health_status: DEMO_CONNECTED[code] ? 'healthy' : 'disconnected',
    row_count: code === 'CRM' ? 300 : code === 'EMAIL' ? 120 : 0,
    last_sync_at: DEMO_CONNECTED[code] ? new Date().toISOString() : null,
  }));
  const valueScore = data?.valueScore ?? (Object.keys(DEMO_CONNECTED).reduce((sum, k) => sum + (VALUE_PCTS[k] || 0), 0));
  const features = data?.features || [];
  const nextDomain = data?.nextDomainToConnect;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <div>
        <h2 style={{ fontSize: theme.fontSize.xl, fontWeight: 700, margin: 0 }}>Data Health</h2>
        <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: '4px 0 0' }}>
          Connection status, data freshness, and feature availability across all data domains.
        </p>
      </div>

      {/* Value Score */}
      <div style={{
        padding: theme.spacing.lg, borderRadius: theme.radius.lg,
        background: `linear-gradient(135deg, ${theme.colors.accent}08, ${theme.colors.accent}02)`,
        border: `1px solid ${theme.colors.accent}30`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform Value Score</div>
          <div style={{ fontSize: '36px', fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.accent }}>{valueScore}%</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
            {valueScore < 50 ? 'Connect more data sources to unlock full platform value' : valueScore < 85 ? 'Good coverage — add POS or Email for maximum insight' : 'Excellent — near-full platform value'}
          </div>
        </div>
        <div style={{ width: 120, height: 120, position: 'relative' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke={theme.colors.bgDeep} strokeWidth="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke={theme.colors.accent} strokeWidth="10"
              strokeDasharray={`${valueScore * 3.14} ${314 - valueScore * 3.14}`}
              strokeLinecap="round" transform="rotate(-90 60 60)" />
          </svg>
        </div>
      </div>

      {/* Next recommendation */}
      {nextDomain && (
        <div style={{
          padding: theme.spacing.md, borderRadius: theme.radius.md,
          background: `${theme.colors.info}06`, border: `1px solid ${theme.colors.info}20`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>
              Recommended: Connect {nextDomain.domain.replace('_', ' ')}
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
              {nextDomain.message}
            </div>
          </div>
          <button onClick={() => navigate('integrations')} style={{
            padding: '8px 16px', borderRadius: theme.radius.sm, border: 'none',
            background: theme.colors.info, color: '#fff', fontWeight: 700,
            fontSize: theme.fontSize.xs, cursor: 'pointer',
          }}>Connect Now</button>
        </div>
      )}

      {/* Domain cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: theme.spacing.md }}>
        {domains.map(domain => {
          const info = DOMAIN_INFO[domain.code] || { icon: '📦', label: domain.code, desc: '', vendor: '' };
          const isConnected = domain.connected || domain.is_connected;
          const valuePct = VALUE_PCTS[domain.code] || 0;
          const dependentFeatures = features.filter(f =>
            f.missingHard?.includes(domain.code)
          ).length;

          return (
            <div key={domain.code} style={{
              padding: theme.spacing.md, borderRadius: theme.radius.md,
              background: theme.colors.bgCard, border: `1px solid ${isConnected ? theme.colors.success + '30' : theme.colors.border}`,
              opacity: isConnected ? 1 : 0.85,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '24px' }}>{info.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{info.label}</div>
                    <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{info.desc}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px',
                  background: isConnected ? `${theme.colors.success}15` : `${theme.colors.textMuted}15`,
                  color: isConnected ? theme.colors.success : theme.colors.textMuted,
                  textTransform: 'uppercase',
                }}>{isConnected ? 'Connected' : 'Not Connected'}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: theme.spacing.sm }}>
                <div style={{ padding: '6px 8px', borderRadius: theme.radius.sm, background: theme.colors.bgDeep }}>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>Rows</div>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, fontFamily: theme.fonts.mono }}>{isConnected ? (domain.row_count || 0).toLocaleString() : '—'}</div>
                </div>
                <div style={{ padding: '6px 8px', borderRadius: theme.radius.sm, background: theme.colors.bgDeep }}>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>Value</div>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, fontFamily: theme.fonts.mono }}>{valuePct}%</div>
                </div>
                <div style={{ padding: '6px 8px', borderRadius: theme.radius.sm, background: theme.colors.bgDeep }}>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>Unlocks</div>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, fontFamily: theme.fonts.mono }}>{isConnected ? '✓' : dependentFeatures > 0 ? `${dependentFeatures} features` : '—'}</div>
                </div>
              </div>

              {isConnected && domain.last_sync_at && (
                <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: 8 }}>
                  Last sync: {new Date(domain.last_sync_at).toLocaleString()} · {domain.health_status || 'healthy'}
                </div>
              )}

              {!isConnected && (
                <button onClick={() => navigate('integrations')} style={{
                  width: '100%', marginTop: 8, padding: '6px', borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.accent}30`, background: `${theme.colors.accent}06`,
                  color: theme.colors.accent, fontSize: theme.fontSize.xs, fontWeight: 600,
                  cursor: 'pointer',
                }}>Connect {info.label}</button>
              )}

              {info.vendor && (
                <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginTop: 4 }}>
                  Supported: {info.vendor}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature availability summary */}
      {features.length > 0 && (
        <div style={{
          padding: theme.spacing.md, borderRadius: theme.radius.md,
          background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{ fontWeight: 700, fontSize: theme.fontSize.sm, marginBottom: theme.spacing.sm }}>Feature Availability</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.sm, textAlign: 'center' }}>
            <div style={{ padding: '8px', borderRadius: theme.radius.sm, background: `${theme.colors.success}08` }}>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.success }}>
                {data?.availableFeatures ?? features.filter(f => f.status === 'available').length}
              </div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>Available</div>
            </div>
            <div style={{ padding: '8px', borderRadius: theme.radius.sm, background: `${theme.colors.warning}08` }}>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.warning }}>
                {data?.degradedFeatures ?? features.filter(f => f.status === 'degraded').length}
              </div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>Degraded</div>
            </div>
            <div style={{ padding: '8px', borderRadius: theme.radius.sm, background: `${theme.colors.textMuted}08` }}>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.textMuted }}>
                {data?.unavailableFeatures ?? features.filter(f => f.status === 'unavailable').length}
              </div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>Locked</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
