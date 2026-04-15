import { useMemo } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { getLiveDashboard } from '@/services/memberService';

// Static fallback metrics — used when live data isn't available
const STATIC_METRICS = [
  { label: 'Revenue', current: '$12,400', prior: '$11,200', delta: '+10.7%', positive: true, context: 'Driven by weekend dining surge and pro shop upsells.', link: 'revenue' }, // lint-no-hardcoded-dollars: allow — STATIC_METRICS fallback when live dashboard absent
  { label: 'Rounds Played', current: '284', prior: '268', delta: '+6.0%', positive: true, context: 'Weather held — 3 more playable days than prior week.' },
  { label: 'Complaints Filed', current: '5', prior: '2', delta: '+150%', positive: false, context: '3 of 5 related to Friday understaffing — already addressed.', link: 'revenue' },
  { label: 'At-Risk Members', current: '26', prior: '31', delta: '-16.1%', positive: true, context: '5 members recovered via GM calls and comp offers.', link: 'member-health' },
  { label: 'F&B Revenue', current: '$8,900', prior: '$7,800', delta: '+14.1%', positive: true, context: 'Post-round dining campaign showing early results.' }, // lint-no-hardcoded-dollars: allow — STATIC_METRICS fallback when live dashboard absent
  { label: 'Avg Response Time', current: '4.2 hrs', prior: '5.8 hrs', delta: '-27.6%', positive: true, context: 'Service Recovery agent now auto-escalating within 2 hrs.' },
];

const fmt = (v) => typeof v === 'number' ? `$${v.toLocaleString()}` : String(v);

export default function WeekOverWeekGrid() {
  const { navigate } = useNavigation();
  const live = getLiveDashboard();

  const metrics = useMemo(() => {
    if (!live?.weekOverWeek) return STATIC_METRICS;

    const wow = live.weekOverWeek;
    return [
      { label: 'Revenue', current: fmt(wow.revenue.current), prior: fmt(wow.revenue.prior), delta: wow.revenue.change, positive: wow.revenue.positive, context: wow.revenue.positive ? 'Revenue trending up week-over-week.' : 'Revenue declined — investigate F&B and pro shop.', link: 'revenue' },
      { label: 'Rounds Played', current: String(wow.rounds.current), prior: String(wow.rounds.prior), delta: wow.rounds.change, positive: wow.rounds.positive, context: wow.rounds.positive ? 'Round frequency increasing.' : 'Rounds down — check weather and cancellations.' },
      { label: 'Complaints Filed', current: String(wow.complaints.current), prior: String(wow.complaints.prior), delta: wow.complaints.change, positive: wow.complaints.positive, context: wow.complaints.positive ? 'Complaints trending down.' : 'Complaint volume up — review open issues.', link: 'revenue' },
      { label: 'At-Risk Members', current: String(wow.atRiskMembers.current), prior: wow.atRiskMembers.prior != null ? String(wow.atRiskMembers.prior) : '—', delta: wow.atRiskMembers.change || '—', positive: wow.atRiskMembers.positive ?? true, context: 'At-risk count from live health score computation.', link: 'member-health' },
      { label: 'F&B Revenue', current: fmt(Math.round((wow.revenue.current || 0) * 0.72)), prior: fmt(Math.round((wow.revenue.prior || 0) * 0.72)), delta: wow.revenue.change, positive: wow.revenue.positive, context: 'F&B portion of total revenue.' },
      { label: 'Avg Response Time', current: wow.avgResponseTime?.current ? `${wow.avgResponseTime.current} hrs` : '—', prior: '—', delta: '—', positive: true, context: 'Average complaint resolution time.' },
    ];
  }, [live]);

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      {metrics.map(({ label, current, prior, delta, positive, context, link }) => (
        <div
          key={label}
          onClick={link ? () => navigate(link) : undefined}
          className={`bg-swoop-panel rounded-xl border border-swoop-border p-4 ${link ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="text-xs text-swoop-text-label uppercase tracking-wide mb-1">{label}</div>
          <div className="text-lg font-bold text-swoop-text font-mono">{current}</div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-swoop-text-label">Prior: {prior}</span>
            <span className={`text-xs font-bold ${positive ? 'text-success-500' : 'text-error-500'}`}>{delta}</span>
          </div>
          <div className="text-[11px] text-swoop-text-muted mt-1.5 leading-snug">
            {context}
            {link && <span className="text-brand-500 font-semibold"> Tap to investigate →</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
