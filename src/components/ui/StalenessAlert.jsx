/**
 * Staleness Alert Banner — shows when data domain exceeds freshness threshold.
 */
import { useState, useEffect } from 'react';
import { apiFetch } from '@/services/apiClient';

const THRESHOLDS = { CRM: 48, TEE_SHEET: 24, POS: 24, EMAIL: 72, LABOR: 48 };
const DOMAIN_LABELS = { CRM: 'CRM', TEE_SHEET: 'Tee Sheet', POS: 'POS', EMAIL: 'Email', LABOR: 'Labor' };

export default function StalenessAlert() {
  const [staledomains, setStaledomains] = useState([]);

  useEffect(() => {
    const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
    if (!clubId) return;
    apiFetch(`/api/feature-availability?clubId=${clubId}`)
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
    <div className="px-4 py-2.5 rounded-xl bg-warning-50 border border-warning-200 flex items-center gap-2 text-xs text-warning-600 font-medium dark:bg-warning-500/5 dark:border-warning-500/25 dark:text-warning-400">
      <span className="text-base">\u26A0\uFE0F</span>
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
