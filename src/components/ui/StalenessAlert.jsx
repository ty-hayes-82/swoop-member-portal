/**
 * Staleness Alert Banner — Resilience Phase 3
 * Shows when any connected data domain exceeds freshness threshold.
 * Mount at top of any dashboard page.
 */
import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';

const THRESHOLDS = { CRM: 48, TEE_SHEET: 24, POS: 24, EMAIL: 72, LABOR: 48 };
const DOMAIN_LABELS = { CRM: 'CRM', TEE_SHEET: 'Tee Sheet', POS: 'POS', EMAIL: 'Email', LABOR: 'Labor' };

export default function StalenessAlert() {
  const [staledomains, setStaledomains] = useState([]);

  useEffect(() => {
    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
    if (!clubId) return;
    fetch(`/api/feature-availability?clubId=${clubId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.domains) return;
        const stale = data.domains.filter(d => {
          if (!d.connected || !d.last_sync_at) return false;
          const hours = (Date.now() - new Date(d.last_sync_at).getTime()) / 3600000;
          const threshold = THRESHOLDS[d.code] || 48;
          return hours > threshold;
        }).map(d => ({
          code: d.code,
          label: DOMAIN_LABELS[d.code] || d.code,
          hours: Math.round((Date.now() - new Date(d.last_sync_at).getTime()) / 3600000),
          threshold: THRESHOLDS[d.code] || 48,
        }));
        setStaledomains(stale);
      })
      .catch(() => {});
  }, []);

  if (staledomains.length === 0) return null;

  return (
    <div style={{
      padding: '10px 16px', borderRadius: theme.radius.md,
      background: `${theme.colors.warning}08`, border: `1px solid ${theme.colors.warning}25`,
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: theme.fontSize.xs, color: theme.colors.warning, fontWeight: 500,
    }}>
      <span style={{ fontSize: '16px' }}>⚠️</span>
      <div>
        {staledomains.map(d => (
          <span key={d.code}>
            <strong>{d.label}</strong> data is {d.hours} hours old (threshold: {d.threshold}h).{' '}
          </span>
        ))}
        Actions may be based on outdated information.
      </div>
    </div>
  );
}
