import { SoWhatCallout, PlaybookActionCard } from '@/components/ui';
import MemberLink from '@/components/MemberLink.jsx';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { getEmailHeatmap, getDecayingMembers } from '@/services/memberService';
function heatColor(rate) {
  if (rate >= 0.65) return '#12b76a';
  if (rate >= 0.45) return '#12b76a';
  if (rate >= 0.25) return '#f59e0b';
  if (rate >= 0.10) return '#f59e0b';
  return '#ef4444';
}

const formatPercent = (value) => (Number.isFinite(value) ? `${(value * 100).toFixed(0)}%` : '—');
const formatTrend = (value) => (Number.isFinite(value) ? `${value}% trend` : '—');

export default function EmailTab() {
  const heatmap = getEmailHeatmap();
  if (heatmap.length === 0) {
    return <DataEmptyState icon="📧" title="No email data" description="Import email engagement data to see this tab." dataType="email" />;
  }
  const decaying = getDecayingMembers();

  const campaigns = [...new Set(heatmap.map(h => h.campaign))];
  const archetypes = [...new Set(heatmap.map(h => h.archetype))];

  const getRate = (campaign, archetype) =>
    heatmap.find(h => h.campaign === campaign && h.archetype === archetype)?.openRate ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Heatmap */}
      <div className="bg-swoop-row rounded-xl p-4 border border-swoop-border overflow-x-auto">
        <div className="text-sm font-semibold text-swoop-text mb-1">
          Communication Health — Email Engagement
        </div>
        <div className="text-xs text-swoop-text-label mb-4">
          Email engagement is an early health score input — decay here precedes golf and dining disengagement by 6-8 weeks
        </div>
        <table className="border-collapse text-xs w-full min-w-[400px]">
          <thead>
            <tr>
              <th className="py-1 px-2 text-swoop-text-label text-left min-w-[140px]">Campaign</th>
              {archetypes.map(a => (
                <th key={a} className="py-1 px-2 text-swoop-text-label text-center min-w-[80px] text-[10px]">{a.split(' ')[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c}>
                <td className="py-1 px-2 text-swoop-text-muted text-[10px] max-w-[140px]">{c}</td>
                {archetypes.map(a => {
                  const rate = getRate(c, a);
                  const color = Number.isFinite(rate) ? heatColor(rate) : '#9CA3AF';
                  return (
                    <td key={a} className="py-1 px-2 text-center">
                      <div
                        className="rounded py-[3px] px-1.5 font-mono text-[10px]"
                        style={{ background: `${color}30`, border: `1px solid ${color}60`, color }}
                      >
                        {rate > 0 ? formatPercent(rate) : '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Decay watch list */}
      <div className="bg-swoop-row rounded-xl border border-error-500/20 overflow-hidden">
        <div className="p-4 border-b border-swoop-border">
          <span className="text-sm font-semibold text-error-500">
            ⚠ Engagement Decay Watch List
          </span>
          <span className="ml-2 text-xs text-swoop-text-label">Email decay precedes disengagement by 4-6 weeks</span>
        </div>
        {decaying.map((m, i) => (
          <div key={i} className="p-4" style={{ borderBottom: i < decaying.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
            <div className="flex justify-between items-center">
              <MemberLink
                memberId={m.memberId}
                className="text-swoop-text text-sm"
              >
                {m.name}
              </MemberLink>
              <span className="text-error-500 font-mono text-sm">{formatTrend(m.trend)}</span>
            </div>
            <div className="flex justify-between items-center mt-1 flex-wrap gap-2">
              <div className="flex gap-4">
                {[['Nov', m.nov], ['Dec', m.dec], ['Jan', m.jan]].map(([label, val]) => (
                  <span key={label} className="text-xs text-swoop-text-label">
                    {label}: <span className="font-mono" style={{ color: heatColor(Number.isFinite(val) ? val : 0) }}>
                      {formatPercent(val)}
                    </span>
                  </span>
                ))}
              </div>
              <MemberLink memberId={m.memberId} mode="drawer" className="text-[11px] font-semibold text-brand-500 hover:underline cursor-pointer">
                Open profile →
              </MemberLink>
            </div>
          </div>
        ))}
      </div>

      <SoWhatCallout variant="warning">
        Email decay is the <strong>earliest disengagement signal</strong> — preceding reduced golf and dining activity
        by 4–6 weeks. These {decaying.length} members are in the pre-departure window where personal outreach
        still works.
      </SoWhatCallout>

      <PlaybookActionCard
        icon={'\uD83D\uDEA8'}
        label="ENGAGEMENT DECAY DETECTED"
        title={`${decaying.length} members in the pre-departure window \u2014 activate intervention now`}
        description="These members are showing the same email decay pattern that preceded 9 of 11 resignations this year. Personal outreach within 2 weeks has a 67% save rate."
        playbookName="Declining Member Intervention"
        impact="$24K/mo" // lint-no-hardcoded-dollars: allow — playbook impact teaser
        memberCount={decaying.length}
        buttonLabel="Activate Engagement Decay Intervention"
        buttonColor="#dc2626"
        variant="urgent"
      />
    </div>
  );
}
