// ArchetypeTab — archetypes as GM language, not radar metrics.
// Phase 2 critique: "Engagement Scores" doesn't mean anything to a GM.
// Now: "What this means for retention" — plain English for each type.
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getArchetypeProfiles } from '@/services/memberService';
import { getArchetypeSpendPatterns } from '@/services/experienceInsightsService';
import { theme } from '@/config/theme';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Archetype selector */}
      <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        {profiles.map(p => {
          const isSelected = selected === p.archetype;
          const churnColor = ['Declining','Ghost','Social Butterfly'].includes(p.archetype) ? theme.colors.warning
            : p.archetype === 'Balanced Active' ? theme.colors.success : theme.colors.textMuted;
          return (
            <button key={p.archetype} onClick={() => setSelected(p.archetype)} style={{
              padding: '6px 14px', borderRadius: theme.radius.md, cursor: 'pointer',
              border: `1px solid ${isSelected ? theme.colors.accent : theme.colors.border}`,
              background: isSelected ? `${theme.colors.accent}08` : theme.colors.bgCard,
              color: isSelected ? theme.colors.accent : theme.colors.textSecondary,
              fontSize: theme.fontSize.xs, fontWeight: isSelected ? 700 : 400,
            }}>
              {p.archetype}
              <span style={{ color: churnColor, marginLeft: 6 }}>{p.count}</span>
            </button>
          );
        })}
      </div>

      {/* Main profile section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
        {/* Left — visual */}
        <div style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontFamily: theme.fonts.serif, fontSize: theme.fontSize.lg, color: theme.colors.textPrimary, marginBottom: 4 }}>{profile.archetype}</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: theme.spacing.md }}>
            {profile.count} members at Oakmont Hills
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={theme.colors.border} />
              <PolarAngleAxis dataKey="dim" tick={{ fill: theme.colors.textSecondary, fontSize: 11 }} />
              <Radar dataKey="value" fill={theme.colors.members} fillOpacity={0.2}
                stroke={theme.colors.members} strokeWidth={2} />
              <Tooltip formatter={v => [`${v}`, 'Engagement']}
                contentStyle={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: theme.colors.textPrimary }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right — plain English intel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {intel.summary && (
            <div style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: theme.colors.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>What this archetype is</div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, lineHeight: 1.6 }}>{intel.summary}</div>
            </div>
          )}
          {intel.retention && (
            <div style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: theme.colors.textMuted, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Retention outlook</div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6 }}>{intel.retention}</div>
            </div>
          )}
          {intel.opportunity && (
            <div style={{ background: theme.colors.bgCard, borderRadius: theme.radius.md, padding: `${theme.spacing.sm} ${theme.spacing.md}`, border: `1px solid ${theme.colors.success}25` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: theme.colors.success, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Opportunity</div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6 }}>{intel.opportunity}</div>
            </div>
          )}
          {intel.watch && (
            <div style={{ background: `${theme.colors.warning}08`, borderRadius: theme.radius.md, padding: `${theme.spacing.sm} ${theme.spacing.md}`, border: `1px solid ${theme.colors.warning}30` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: theme.colors.warning, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Watch for</div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6 }}>{intel.watch}</div>
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
    { key: 'golf', label: 'Golf', engagement: current.engagement.golf, color: theme.colors.success },
    { key: 'dining', label: 'Dining', engagement: current.engagement.dining, color: theme.colors.fb ?? theme.colors.warning },
    { key: 'events', label: 'Events', engagement: current.engagement.events, color: theme.colors.accent },
    { key: 'email', label: 'Email', engagement: current.engagement.email, color: theme.colors.info ?? theme.colors.textMuted },
  ];

  const avgAll = patterns.reduce((sum, p) => sum + p.avgAnnualSpend, 0) / patterns.length;

  return (
    <div style={{
      background: theme.colors.bgCard,
      borderRadius: theme.radius.md,
      border: '1px solid ' + theme.colors.border,
      padding: theme.spacing.lg,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: theme.colors.accent, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '2px' }}>
            Spend Potential
          </div>
          <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary }}>
            {archetype} &mdash; {current.count} members
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Avg annual spend</div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.textPrimary }}>
            ${current.avgAnnualSpend.toLocaleString()}
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: current.avgAnnualSpend >= avgAll ? theme.colors.success : theme.colors.warning }}>
            {current.avgAnnualSpend >= avgAll ? 'Above' : 'Below'} club avg (${Math.round(avgAll).toLocaleString()})
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.sm }}>
        {categories.map(cat => {
          const potential = 100 - cat.engagement;
          return (
            <div key={cat.key} style={{
              background: theme.colors.bgDeep,
              borderRadius: theme.radius.sm,
              padding: theme.spacing.sm,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: '4px' }}>{cat.label}</div>
              <div style={{
                height: 6,
                background: theme.colors.border + '60',
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
              <div style={{ fontSize: '13px', fontWeight: 700, color: cat.color, fontFamily: theme.fonts.mono }}>
                {cat.engagement}%
              </div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>engaged</div>
              {potential > 30 && (
                <div style={{
                  marginTop: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: theme.colors.success,
                  background: theme.colors.success + '12',
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
          marginTop: theme.spacing.md,
          padding: theme.spacing.sm,
          background: theme.colors.success + '08',
          border: '1px solid ' + theme.colors.success + '20',
          borderRadius: theme.radius.sm,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary,
          lineHeight: 1.5,
        }}>
          <strong style={{ color: theme.colors.success }}>Untapped potential:</strong>{' '}
          ${current.spendPotential.toLocaleString()}/member/year in dining and events.{' '}
          Across {current.count} {archetype} members, that&rsquo;s{' '}
          <strong>${(current.spendPotential * current.count).toLocaleString()}</strong> in annual opportunity.
        </div>
      )}

      {/* View outreach playbook for this archetype */}
      <div style={{
        marginTop: theme.spacing.md,
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
