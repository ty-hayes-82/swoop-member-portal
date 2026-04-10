/**
 * Data Health Dashboard — Resilience Phase 3
 * Shows each domain's connection status, row counts, freshness,
 * dependent feature count, and "features you will unlock."
 */
import { useState, useEffect } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { apiFetch } from '@/services/apiClient';
import { getLeakageData } from '@/services/revenueService';

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
    apiFetch(`/api/feature-availability?clubId=${clubId}`)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
  const isAuthenticated = !!clubId && clubId !== 'demo';
  const DEMO_CONNECTED = { CRM: true, EMAIL: true };
  const domains = data?.domains || Object.keys(DOMAIN_INFO).map(code => (isAuthenticated ? {
    code,
    connected: false,
    health_status: 'disconnected',
    row_count: 0,
    last_sync_at: null,
  } : {
    code,
    connected: !!DEMO_CONNECTED[code],
    health_status: DEMO_CONNECTED[code] ? 'healthy' : 'disconnected',
    row_count: code === 'CRM' ? 300 : code === 'EMAIL' ? 120 : 0,
    last_sync_at: DEMO_CONNECTED[code] ? new Date().toISOString() : null,
  }));
  const valueScore = data?.valueScore ?? (isAuthenticated ? 0 : Object.keys(DEMO_CONNECTED).reduce((sum, k) => sum + (VALUE_PCTS[k] || 0), 0));
  const features = data?.features || [];
  const nextDomain = data?.nextDomainToConnect;

  // Dollar figures come from revenueService.getLeakageData(); PACE_LOSS wires through exactly,
  // STAFFING_LOSS / TOTAL fall back to canonical demo literals ($3,400 / $9,580) on divergence.
  const leakage = getLeakageData();
  const paceDollars = leakage?.PACE_LOSS
    ? `$${leakage.PACE_LOSS.toLocaleString()}/mo pace-to-dining attribution`
    : '$5,760/mo pace-to-dining attribution';
  const DOMAIN_PILLAR_IMPACT = {
    CRM: { features: ['Today Morning Briefing', 'Member Health Scores', 'First Domino visualization'], dollar: 'Required for all member-level intelligence' },
    TEE_SHEET: { features: ['Today briefing rounds count', 'Hole 12 bottleneck drill-down', 'At-risk on tee sheet detection'], dollar: paceDollars },
    POS: { features: ['F&B revenue decomposition', 'Dining conversion correlation', 'Post-round dining stats'], dollar: '$9,580/mo full F&B leakage decomposition' },
    EMAIL: { features: ['First Domino email signal', 'Engagement decay watch list', 'Cohort heatmap'], dollar: 'Earliest decay signal — typically the first domino to fall' },
    LABOR: { features: ['Tomorrow staffing risk', 'Pace-to-Revenue connection card', 'Understaffed days correlation'], dollar: '$3,400/mo staffing-driven F&B loss' },
  };
  const blockedDomains = domains.filter(d => !d.connected && !d.is_connected);
  const hasBlocking = blockedDomains.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold m-0">Data Health</h2>
        <p className="text-sm text-gray-500 mt-1 mb-0">
          Connection status, data freshness, and feature availability across all data domains.
        </p>
      </div>

      {hasBlocking && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-warning-500/[0.06] to-warning-500/[0.02] border border-warning-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-warning-600">⚠️ What's Blocking Insights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blockedDomains.slice(0, 4).map(domain => {
              const impact = DOMAIN_PILLAR_IMPACT[domain.code];
              if (!impact) return null;
              return (
                <div key={domain.code} className="bg-white border border-warning-500/20 rounded-xl p-3">
                  <div className="text-xs font-bold text-gray-800 dark:text-white/90 mb-1">
                    {DOMAIN_INFO[domain.code]?.icon} {DOMAIN_INFO[domain.code]?.label || domain.code} disconnected
                  </div>
                  <div className="text-[10px] text-gray-500 mb-2">Blocks:</div>
                  <ul className="text-[11px] text-gray-700 dark:text-gray-300 m-0 pl-4 leading-snug">
                    {impact.features.map(f => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-warning-500/15 text-[11px] font-bold text-warning-700">
                    💰 {impact.dollar}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Value Score */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500/[0.03] to-brand-500/[0.01] border border-brand-500/20 flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">Platform Value Score</div>
          <div className="text-4xl font-bold font-mono text-brand-500">{valueScore}%</div>
          <div className="text-xs text-gray-500">
            {valueScore < 50 ? 'Connect more data sources to unlock full platform value' : valueScore < 85 ? 'Good coverage — add POS or Email for maximum insight' : 'Excellent — near-full platform value'}
          </div>
        </div>
        <div className="w-[120px] h-[120px] relative">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="#ff8b00" strokeWidth="10"
              strokeDasharray={`${valueScore * 3.14} ${314 - valueScore * 3.14}`}
              strokeLinecap="round" transform="rotate(-90 60 60)" />
          </svg>
        </div>
      </div>

      {nextDomain && (
        <div className="p-4 rounded-xl bg-blue-600/[0.024] border border-blue-600/[0.12] flex justify-between items-center">
          <div>
            <div className="text-sm font-bold text-gray-800 dark:text-white/90">
              Recommended: Connect {nextDomain.domain.replace('_', ' ')}
            </div>
            <div className="text-xs text-gray-500">{nextDomain.message}</div>
          </div>
          <button onClick={() => navigate('integrations')} className="py-2 px-4 rounded-lg border-none bg-blue-600 text-white font-bold text-xs cursor-pointer">Connect Now</button>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {domains.map(domain => {
          const info = DOMAIN_INFO[domain.code] || { icon: '📦', label: domain.code, desc: '', vendor: '' };
          const isConnected = domain.connected || domain.is_connected;
          const valuePct = VALUE_PCTS[domain.code] || 0;
          const dependentFeatures = features.filter(f => f.missingHard?.includes(domain.code)).length;

          return (
            <div key={domain.code} className={`p-4 rounded-xl bg-white dark:bg-white/[0.03] border ${isConnected ? 'border-success-500/20' : 'border-gray-200 dark:border-gray-800'} ${isConnected ? '' : 'opacity-85'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{info.icon}</span>
                  <div>
                    <div className="font-bold text-sm text-gray-800 dark:text-white/90">{info.label}</div>
                    <div className="text-xs text-gray-400">{info.desc}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold py-[3px] px-2 rounded-xl uppercase ${isConnected ? 'bg-success-500/[0.08] text-success-500' : 'bg-gray-400/[0.08] text-gray-400'}`}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { label: 'Rows', val: isConnected ? (domain.row_count || 0).toLocaleString() : '—' },
                  { label: 'Value', val: `${valuePct}%` },
                  { label: 'Unlocks', val: isConnected ? '✓' : dependentFeatures > 0 ? `${dependentFeatures} features` : '—' },
                ].map(m => (
                  <div key={m.label} className="py-1.5 px-2 rounded-lg bg-gray-100">
                    <div className="text-[10px] text-gray-400">{m.label}</div>
                    <div className="text-sm font-bold font-mono">{m.val}</div>
                  </div>
                ))}
              </div>

              {isConnected && domain.last_sync_at && (
                <div className="text-[10px] text-gray-400 mt-2">
                  Last sync: {new Date(domain.last_sync_at).toLocaleString()} · {domain.health_status || 'healthy'}
                </div>
              )}

              {!isConnected && (
                <button onClick={() => navigate('integrations')} className="w-full mt-2 py-1.5 rounded-lg border border-brand-500/20 bg-brand-500/[0.024] text-brand-500 text-xs font-semibold cursor-pointer">
                  Connect {info.label}
                </button>
              )}

              {info.vendor && (
                <div className="text-[10px] text-gray-400 mt-1">Supported: {info.vendor}</div>
              )}
            </div>
          );
        })}
      </div>

      {features.length > 0 && (
        <div className="p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800">
          <div className="font-bold text-sm mb-2">Feature Availability</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            {[
              { label: 'Available', count: data?.availableFeatures ?? features.filter(f => f.status === 'available').length, color: 'text-success-500', bg: 'bg-success-500/[0.03]' },
              { label: 'Degraded', count: data?.degradedFeatures ?? features.filter(f => f.status === 'degraded').length, color: 'text-warning-500', bg: 'bg-warning-500/[0.03]' },
              { label: 'Locked', count: data?.unavailableFeatures ?? features.filter(f => f.status === 'unavailable').length, color: 'text-gray-400', bg: 'bg-gray-400/[0.03]' },
            ].map(m => (
              <div key={m.label} className={`p-2 rounded-lg ${m.bg}`}>
                <div className={`text-xl font-bold font-mono ${m.color}`}>{m.count}</div>
                <div className="text-[10px] text-gray-400">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
