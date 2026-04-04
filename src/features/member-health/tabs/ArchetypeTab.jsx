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
            : p.archetype === 'Balanced Active' ? '#22c55e' : '#9CA3AF';
          return (
            <button key={p.archetype} onClick={() => setSelected(p.archetype)} style={{
              padding: '6px 14px', borderRadius: '12px', cursor: 'pointer',
              border: `1px solid ${isSelected ? '#ff8b00' : '#E5E7EB'}`,
              background: isSelected ? `${'#ff8b00'}08` : '#ffffff',
              color: isSelected ? '#ff8b00' : '#6B7280',
              fontSize: '12px', fontWeight: isSelected ? 700 : 400,
            }}>
              {p.archetype}
              <span style={{ color: churnColor, marginLeft: 6 }}>{p.count}</span>
            </button>
          );
        })}
      </div>

      {/* Main profile section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left — visual */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: `1px solid ${'#E5E7EB'}` }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#1a1a2e', marginBottom: 4 }}>{profile.archetype}</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '16px' }}>
            {profile.count} members at Oakmont Hills
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={'#E5E7EB'} />
              <PolarAngleAxis dataKey="dim" tick={{ fill: '#6B7280', fontSize: 11 }} />
              <Radar dataKey="value" fill={'#ff8b00'} fillOpacity={0.2}
                stroke={'#ff8b00'} strokeWidth={2} />
              <Tooltip formatter={v => [`${v}`, 'Engagement']}
                contentStyle={{ background: '#ffffff', border: `1px solid ${'#E5E7EB'}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#1a1a2e' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right — plain English intel */}
        <div className="flex flex-col gap-2">
          {intel.summary && (
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: `1px solid ${'#E5E7EB'}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>What this archetype is</div>
              <div style={{ fontSize: '14px', color: '#1a1a2e', lineHeight: 1.6 }}>{intel.summary}</div>
            </div>
          )}
          {intel.retention && (
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: `1px solid ${'#E5E7EB'}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Retention outlook</div>
              <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>{intel.retention}</div>
            </div>
          )}
          {intel.opportunity && (
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: `${'8px'} ${'16px'}`, border: `1px solid ${'#22c55e'}25` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Opportunity</div>
              <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>{intel.opportunity}</div>
            </div>
          )}
          {intel.watch && (
            <div style={{ background: `${'#f59e0b'}08`, borderRadius: '12px', padding: `${'8px'} ${'16px'}`, border: `1px solid ${'#f59e0b'}30` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Watch for</div>
              <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>{intel.watch}</div>
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
    { key: 'golf', label: 'Golf', engagement: current.engagement.golf, color: '#22c55e' },
    { key: 'dining', label: 'Dining', engagement: current.engagement.dining, color: '#f59e0b' ?? '#f59e0b' },
    { key: 'events', label: 'Events', engagement: current.engagement.events, color: '#ff8b00' },
    { key: 'email', label: 'Email', engagement: current.engagement.email, color: '#2563eb' ?? '#9CA3AF' },
  ];

  const avgAll = patterns.reduce((sum, p) => sum + p.avgAnnualSpend, 0) / patterns.length;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid ' + '#E5E7EB',
      padding: '24px',
    }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#ff8b00', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '2px' }}>
            Spend Potential
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>
            {archetype} &mdash; {current.count} members
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-xs text-gray-400">Avg annual spend</div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#1a1a2e' }}>
            ${current.avgAnnualSpend.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: current.avgAnnualSpend >= avgAll ? '#22c55e' : '#f59e0b' }}>
            {current.avgAnnualSpend >= avgAll ? 'Above' : 'Below'} club avg (${Math.round(avgAll).toLocaleString()})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {categories.map(cat => {
          const potential = 100 - cat.engagement;
          return (
            <div key={cat.key} style={{
              background: '#F3F4F6',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>{cat.label}</div>
              <div style={{
                height: 6,
                background: '#E5E7EB' + '60',
                borderRadius: 3,
                overflow: 'hidden',
                marginBottom: '6px',
              }}>
                <div style={{
                  height: '100%',
                  width: cat.engagement + '%',
                  background: cat.color,
                  borderRadius: 3,
                }} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: cat.color, fontFamily: "'JetBrains Mono', monospace" }}>
                {cat.engagement}%
              </div>
              <div style={{ fontSize: '10px', color: '#9CA3AF' }}>engaged</div>
              {potential > 30 && (
                <div style={{
                  marginTop: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#22c55e',
                  background: '#22c55e' + '12',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'inline-block',
                }}>
                  {potential}% untapped
                </div>
              )}
            </div>
          );
        })}
      </div>

      {current.spendPotential > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '8px',
          background: '#22c55e' + '08',
          border: '1px solid ' + '#22c55e' + '20',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#6B7280',
          lineHeight: 1.5,
        }}>
          <strong className="text-success-500">Untapped potential:</strong>{' '}
          ${current.spendPotential.toLocaleString()}/member/year in dining and events.{' '}
          Across {current.count} {archetype} members, that&rsquo;s{' '}
          <strong>${(current.spendPotential * current.count).toLocaleString()}</strong> in annual opportunity.
        </div>
      )}

      {/* View outreach playbook for this archetype */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => navigate('outreach-playbooks')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: '1.5px solid #e8772e',
            background: 'rgba(232,119,46,0.06)',
            color: '#e8772e',
          }}
        >View Outreach Playbook for {archetype}</button>
        <button
          onClick={() => navigate('playbooks')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: '1.5px solid #d4d4d8',
            background: '#fff',
            color: '#3f3f46',
          }}
        >View All Playbooks</button>
      </div>
    </div>
  );
}
