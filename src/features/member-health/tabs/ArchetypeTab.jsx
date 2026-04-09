// ArchetypeTab — archetypes as GM language, not radar metrics.
// Phase 2 critique: "Engagement Scores" doesn't mean anything to a GM.
// Now: "What this means for retention" — plain English for each type.
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getArchetypeProfiles } from '@/services/memberService';
import { getArchetypeSpendPatterns } from '@/services/experienceInsightsService';
import { useNavigationContext } from '@/context/NavigationContext';
import { useState } from 'react';

const DIMS = ['golf', 'dining', 'events', 'email', 'trend'];
const DIM_LABELS = { golf: 'Golf', dining: 'Dining', events: 'Events', email: 'Email', trend: 'Momentum' };

// Plain-English meaning for each archetype — what it means operationally
const ARCHETYPE_INTEL = {
  'Die-Hard Golfer':   { summary: 'Lives on the course. Golf is the only reason they joined.', retention: 'Low resignation risk — unless pace or course quality degrades.', opportunity: 'Almost never comes to dining events. One good post-round experience could change that.', watch: 'If their game weakens (injury, handicap spike), activity drops fast.' },
  'Social Butterfly':  { summary: "Here for the people, not the sport. Events and dining are their club.", retention: 'High resignation risk if the event calendar goes quiet.', opportunity: 'Easiest archetype to engage — they respond to almost everything.', watch: "Golf numbers are misleading. Low rounds doesn't mean low engagement." },
  'Balanced Active':   { summary: 'The ideal member. Engages across golf, dining, events, and email.', retention: 'Lowest resignation risk overall — but the most surprising when they do leave.', opportunity: 'James Whitfield is Balanced Active. That\'s exactly why his complaint is so urgent.', watch: 'When a Balanced Active member goes quiet, something is wrong. Act immediately.' },
  'Weekend Warrior':   { summary: 'Active, but only Saturday and Sunday. Invisible weekdays.', retention: 'Medium resignation risk — fades when weekend commitments compete.', opportunity: "Target them Thursday/Friday when they're planning the weekend.", watch: 'Anne Jordan is on a slow path out — 4 rounds in Oct, 2 in Nov, 1 in Dec.' },
  'Declining':         { summary: 'Engagement dropping across all domains over 2–3 months.', retention: 'High resignation risk. 30 members in this category — $540K in annual dues.', opportunity: 'Email still works in the early weeks. After that, personal outreach only.', watch: 'Robert Callahan is hitting his F&B minimum and stopping. Classic exit pattern.' },
  'New Member':        { summary: 'Ramping up. First 90 days define the long-term relationship.', retention: 'Critical window — most new members decide in month 3 whether they stay.', opportunity: 'Most responsive to onboarding outreach. High email open rates right now.', watch: "If activity doesn't increase by week 8, early intervention is needed." },
  'Ghost':             { summary: 'Pays dues, barely uses the club. Obligation-only relationship.', retention: 'High resignation risk — no emotional connection to the club.', opportunity: 'One meaningful experience can shift them. Hard to engineer, worth trying.', watch: 'Linda Leonard resigned in January after no visits since October.' },
  'Snowbird':          { summary: 'Active only in winter months. January is their peak engagement period.', retention: 'Medium risk — tied to seasonal travel, not dissatisfaction.', opportunity: "January is their best month. Events and dining promotions land now.", watch: "Don't confuse summer inactivity with disengagement." },
};

export default function ArchetypeTab() {
  const { navigate } = useNavigationContext();
  const profiles = getArchetypeProfiles();
  const [selected, setSelected] = useState('Balanced Active');
  const profile = profiles.find(p => p.archetype === selected) ?? profiles[0];
  const intel = ARCHETYPE_INTEL[profile.archetype] ?? {};

  const radarData = DIMS.map(d => ({
    dim: DIM_LABELS[d],
    value: Math.max(0, Math.min(100, d === 'trend' ? 50 + profile.trend : profile[d])),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Archetype selector */}
      <div className="flex gap-2 flex-wrap">
        {profiles.map(p => {
          const isSelected = selected === p.archetype;
          const churnColor = ['Declining','Ghost','Social Butterfly'].includes(p.archetype) ? '#f59e0b'
            : p.archetype === 'Balanced Active' ? '#12b76a' : '#9CA3AF';
          return (
            <button key={p.archetype} onClick={() => setSelected(p.archetype)}
              className={`px-3.5 py-1.5 rounded-xl cursor-pointer text-xs ${isSelected ? 'border border-brand-500 bg-brand-500/[0.05] text-brand-500 font-bold' : 'border border-gray-200 bg-white text-gray-500 font-normal'}`}
            >
              {p.archetype}
              <span className="ml-1.5" style={{ color: churnColor }}>{p.count}</span>
            </button>
          );
        })}
      </div>

      {/* Main profile section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left — visual */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="font-serif text-lg text-[#1a1a2e] mb-1">{profile.archetype}</div>
          <div className="text-xs text-gray-400 mb-4">
            {profile.count} members at your club
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={'#E5E7EB'} />
              <PolarAngleAxis dataKey="dim" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Radar dataKey="value" fill={'#ff8b00'} fillOpacity={0.2}
                stroke={'#ff8b00'} strokeWidth={2} />
              <Tooltip formatter={v => [`${v}`, 'Engagement']}
                contentStyle={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#1a1a2e' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right — plain English intel */}
        <div className="flex flex-col gap-2">
          {intel.summary && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">What this archetype is</div>
              <div className="text-sm text-[#1a1a2e] leading-relaxed">{intel.summary}</div>
            </div>
          )}
          {intel.retention && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">Retention outlook</div>
              <div className="text-sm text-gray-500 leading-relaxed">{intel.retention}</div>
            </div>
          )}
          {intel.opportunity && (
            <div className="bg-white rounded-xl px-4 py-2 border border-success-500/15">
              <div className="text-[10px] font-bold text-success-500 tracking-wider uppercase mb-1">Opportunity</div>
              <div className="text-sm text-gray-500 leading-relaxed">{intel.opportunity}</div>
            </div>
          )}
          {intel.watch && (
            <div className="bg-amber-500/[0.05] rounded-xl px-4 py-2 border border-amber-500/20">
              <div className="text-[10px] font-bold text-amber-500 tracking-wider uppercase mb-1">Watch for</div>
              <div className="text-sm text-gray-500 leading-relaxed">{intel.watch}</div>
            </div>
          )}
        </div>
      </div>

      {/* Spend potential breakdown for selected archetype */}
      <SpendPotentialCard archetype={profile.archetype} />
    </div>
  );
}

function SpendPotentialCard({ archetype }) {
  const patterns = getArchetypeSpendPatterns();
  const current = patterns.find(p => p.archetype === archetype);
  if (!current) return null;

  const categories = [
    { key: 'golf', label: 'Golf', engagement: current.engagement.golf, color: '#12b76a' },
    { key: 'dining', label: 'Dining', engagement: current.engagement.dining, color: '#f59e0b' },
    { key: 'events', label: 'Events', engagement: current.engagement.events, color: '#ff8b00' },
    { key: 'email', label: 'Email', engagement: current.engagement.email, color: '#2563eb' },
  ];

  const avgAll = patterns.reduce((sum, p) => sum + p.avgAnnualSpend, 0) / patterns.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-[10px] font-bold text-brand-500 tracking-wider uppercase mb-0.5">
            Spend Potential
          </div>
          <div className="text-base font-bold text-[#1a1a2e]">
            {archetype} &mdash; {current.count} members
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Avg annual spend</div>
          <div className="text-xl font-bold font-mono text-[#1a1a2e]">
            ${current.avgAnnualSpend.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: current.avgAnnualSpend >= avgAll ? '#12b76a' : '#f59e0b' }}>
            {current.avgAnnualSpend >= avgAll ? 'Above' : 'Below'} club avg (${Math.round(avgAll).toLocaleString()})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {categories.map(cat => {
          const potential = 100 - cat.engagement;
          return (
            <div key={cat.key} className="bg-gray-100 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400 mb-1">{cat.label}</div>
              <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden mb-1.5">
                <div className="h-full rounded-full" style={{ width: cat.engagement + '%', background: cat.color }} />
              </div>
              <div className="text-[13px] font-bold font-mono" style={{ color: cat.color }}>
                {cat.engagement}%
              </div>
              <div className="text-[10px] text-gray-400">engaged</div>
              {potential > 30 && (
                <div className="mt-1 text-[10px] font-semibold text-success-500 bg-success-500/[0.08] px-1.5 py-0.5 rounded inline-block">
                  {potential}% untapped
                </div>
              )}
            </div>
          );
        })}
      </div>

      {current.spendPotential > 0 && (
        <div className="mt-4 p-2 bg-success-500/[0.05] border border-success-500/[0.13] rounded-lg text-xs text-gray-500 leading-normal">
          <strong className="text-success-500">Untapped potential:</strong>{' '}
          ${current.spendPotential.toLocaleString()}/member/year in dining and events.{' '}
          Across {current.count} {archetype} members, that&rsquo;s{' '}
          <strong>${(current.spendPotential * current.count).toLocaleString()}</strong> in annual opportunity.
        </div>
      )}

      {/* View outreach playbook for this archetype */}
      <div className="mt-4 flex gap-2.5 flex-wrap">
        <button
          onClick={() => navigate('outreach-playbooks')}
          className="px-[18px] py-2 rounded-lg text-[13px] font-semibold cursor-pointer border-[1.5px] border-brand-500 bg-brand-500/[0.06] text-brand-500"
        >View Outreach Playbook for {archetype}</button>
        <button
          onClick={() => navigate('playbooks')}
          className="px-[18px] py-2 rounded-lg text-[13px] font-semibold cursor-pointer border-[1.5px] border-gray-300 bg-white text-gray-700"
        >View All Playbooks</button>
      </div>
    </div>
  );
}
