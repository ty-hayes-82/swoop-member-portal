import { useMemo } from 'react';
import { getMemberSaves, getMonthlyTrends } from '@/services/boardReportService';
import { Panel } from '@/components/ui';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '\u2014';
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return currencyFormatter.format(amount);
};

const recoveryMethods = [
  { method: 'Personal GM Call', success: 95, count: 6, color: '#12b76a' },
  { method: 'Event Invitation', success: 91, count: 3, color: '#2563eb' },
  { method: 'Billing Resolution', success: 100, count: 2, color: '#8b5cf6' },
  { method: 'Engagement Autopilot', success: 87, count: 4, color: '#F3922D' },
];

export default function RecoveryTab() {
  const memberSaves = getMemberSaves();
  const trends = getMonthlyTrends();

  const kpis = useMemo(() => {
    const totalSaved = memberSaves.length;
    const avgImprovement = totalSaved > 0
      ? Math.round(memberSaves.reduce((sum, m) => sum + (m.healthAfter - m.healthBefore), 0) / totalSaved)
      : 0;
    const totalDuesProtected = memberSaves.reduce((sum, m) => sum + (m.duesAtRisk || 0), 0);
    return { totalSaved, avgImprovement, totalDuesProtected };
  }, [memberSaves]);

  const maxSaved = useMemo(() => Math.max(...trends.map(t => t.membersSaved), 1), [trends]);

  return (
    <div className="flex flex-col gap-6">

      {/* Recovery Summary KPIs */}
      <div className="grid-responsive-4">
        {[
          { label: 'Members Saved', value: kpis.totalSaved, color: '#12b76a', subtitle: 'at-risk members retained' },
          { label: 'Avg Health Improvement', value: `+${kpis.avgImprovement} pts`, color: '#12b76a', subtitle: 'average score recovery' },
          { label: 'Retention Rate', value: '100%', color: '#12b76a', subtitle: 'of intervened members' },
          { label: 'Avg Response Time', value: '4.2 hrs', color: '#2563eb', subtitle: 'from alert to first action' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-swoop-panel shadow-theme-xs rounded-2xl border border-swoop-border p-4">
            <div className="text-xs text-swoop-text-label uppercase tracking-wider mb-2">{kpi.label}</div>
            <div className="text-[28px] font-mono font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-xs text-swoop-text-label mt-1">{kpi.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Recovery Timeline */}
      <div className="bg-swoop-panel rounded-2xl border border-swoop-border p-6 shadow-theme-xs">
        <div className="mb-5">
          <div className="text-[11px] font-bold text-success-500 uppercase tracking-[1.5px] mb-1">Recovery Timeline</div>
          <h3 className="text-xl font-bold text-[#1a1a2e] m-0 leading-tight">Intervention Outcomes</h3>
          <p className="text-xs text-swoop-text-label mt-1.5 mb-0">
            Each intervention below turned an at-risk member into a retained, re-engaged member.
            Total members retained: <strong className="text-success-500">{memberSaves.length}</strong>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {memberSaves.map((save) => {
            const improvement = save.healthAfter - save.healthBefore;
            return (
              <div key={save.name} className="grid grid-cols-1 sm:grid-cols-[1.2fr_100px_1.8fr_1fr] gap-2 sm:gap-4 items-start sm:items-center px-4 py-3.5 bg-swoop-row border border-swoop-border rounded-xl text-xs">
                {/* Member + Trigger */}
                <div>
                  <div className="font-bold text-[13px] text-[#1a1a2e]">{save.name}</div>
                  <div className="text-swoop-text-label mt-0.5 leading-snug">{save.trigger}</div>
                </div>

                {/* Health Score Change */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-mono font-bold text-[13px] text-error-500">{save.healthBefore}</span>
                    <span className="text-swoop-text-label text-sm">{'\u2192'}</span>
                    <span className="font-mono font-bold text-[13px] text-success-500">{save.healthAfter}</span>
                  </div>
                  <div className="text-[10px] font-bold text-success-500 mt-0.5">+{improvement} pts</div>
                </div>

                {/* Action + Outcome */}
                <div>
                  <div className="text-swoop-text-muted leading-snug">
                    <strong className="text-blue-600">Action:</strong> {save.action}
                  </div>
                  <div className="text-swoop-text-muted mt-1 leading-snug">
                    <strong className="text-success-500">Outcome:</strong> {save.outcome}
                  </div>
                </div>

                {/* Member Retained */}
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-success-500">Retained</div>
                  <div className="text-[10px] text-swoop-text-label mt-0.5">member saved</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovery by Method */}
      <div className="bg-swoop-panel rounded-2xl border border-swoop-border p-6 shadow-theme-xs">
        <div className="mb-5">
          <div className="text-[11px] font-bold text-brand-500 uppercase tracking-[1.5px] mb-1">Recovery by Method</div>
          <h3 className="text-xl font-bold text-[#1a1a2e] m-0 leading-tight">Which Interventions Work Best</h3>
          <p className="text-xs text-swoop-text-label mt-1.5 mb-0">
            Success rate by intervention type across all recovery actions.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {recoveryMethods.map((rm) => (
            <div key={rm.method} className="flex items-center gap-4">
              <div className="w-40 shrink-0">
                <div className="text-[13px] font-semibold text-[#1a1a2e]">{rm.method}</div>
                <div className="text-[11px] text-swoop-text-label">{rm.count} interventions</div>
              </div>
              <div className="flex-1 relative h-7">
                <div className="absolute inset-0 bg-swoop-row rounded-lg border border-swoop-border" />
                <div className="absolute top-0 left-0 bottom-0 rounded-lg" style={{ width: `${rm.success}%`, background: `${rm.color}20`, borderRight: `3px solid ${rm.color}` }} />
              </div>
              <div className="w-[60px] text-right font-mono font-bold text-sm" style={{ color: rm.color }}>{rm.success}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Recovery Trend */}
      <div className="bg-swoop-panel rounded-2xl border border-swoop-border p-6 shadow-theme-xs">
        <div className="mb-5">
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-[1.5px] mb-1">Monthly Trend</div>
          <h3 className="text-xl font-bold text-[#1a1a2e] m-0 leading-tight">Recovery Volume Over Time</h3>
          <p className="text-xs text-swoop-text-label mt-1.5 mb-0">
            Members saved per month and response time improvement over the last 6 months.
          </p>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-3 h-40 px-2">
          {trends.map((t) => {
            const barHeight = Math.max((t.membersSaved / maxSaved) * 140, 8);
            return (
              <div key={t.month} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="font-mono text-xs font-bold text-success-500">{t.membersSaved}</div>
                <div className="w-full max-w-[48px] rounded-t-md rounded-b-sm relative" style={{ height: `${barHeight}px`, background: 'linear-gradient(180deg, #12b76a, #12b76ae6)' }}>
                  <div className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-swoop-text-label font-semibold">{t.month}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Supplementary metrics row */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mt-10 pt-4 border-t border-swoop-border">
          {trends.map((t) => (
            <div key={t.month} className="text-center p-2 bg-swoop-row rounded-lg border border-swoop-border">
              <div className="text-[11px] font-semibold text-swoop-text-label">{t.month}</div>
              <div className="font-mono text-sm font-bold text-success-500 mt-0.5">{formatCurrency(t.duesProtected)}</div>
              <div className="text-[10px] text-swoop-text-label">protected</div>
              <div className="text-[11px] font-semibold mt-1" style={{ color: t.responseTime <= 4.5 ? '#12b76a' : '#f59e0b' }}>{t.responseTime}h response</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom callout */}
      <div className="px-5 py-4 bg-gradient-to-br from-success-500/[0.06] to-success-500/[0.02] border border-success-500/20 rounded-xl flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-success-500/10 flex items-center justify-center text-lg shrink-0">
          {'\u2705'}
        </div>
        <div>
          <div className="text-sm font-bold text-success-500 mb-1">
            Every intervention here started as an alert on the Health Overview tab
          </div>
          <div className="text-xs text-swoop-text-muted leading-relaxed">
            Swoop detected disengagement signals 6-8 weeks before any of these members would have resigned.
            The average health score improved by {kpis.avgImprovement} points after intervention, protecting {formatCurrency(kpis.totalDuesProtected)} in annual dues.
            Response time has improved from 8.1 hours in September to 3.8 hours in February.
          </div>
        </div>
      </div>
    </div>
  );
}
