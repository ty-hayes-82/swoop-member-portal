// ArchetypeTab — archetypes as GM language, not radar metrics.
// Phase 2 critique: "Engagement Scores" doesn't mean anything to a GM.
// Now: "What this means for retention" — plain English for each type.
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getArchetypeProfiles } from '@/services/memberService';
import { theme } from '@/config/theme';
import { useState } from 'react';

const DIMS = ['golf', 'dining', 'events', 'email', 'trend'];
const DIM_LABELS = { golf: 'Golf', dining: 'Dining', events: 'Events', email: 'Email', trend: 'Momentum' };

// Plain-English meaning for each archetype — what it means operationally
const ARCHETYPE_INTEL = {
  'Die-Hard Golfer':   { summary: 'Lives on the course. Golf is the only reason they joined.', retention: 'Low churn risk — unless pace or course quality degrades.', opportunity: 'Almost never comes to dining events. One good post-round experience could change that.', watch: 'If their game weakens (injury, handicap spike), activity drops fast.' },
  'Social Butterfly':  { summary: "Here for the people, not the sport. Events and dining are their club.", retention: 'High churn risk if the event calendar goes quiet.', opportunity: 'Easiest archetype to engage — they respond to almost everything.', watch: "Golf numbers are misleading. Low rounds doesn't mean low engagement." },
  'Balanced Active':   { summary: 'The ideal member. Engages across golf, dining, events, and email.', retention: 'Lowest churn risk overall — but the most surprising when they do leave.', opportunity: 'James Whitfield is Balanced Active. That\'s exactly why his complaint is so urgent.', watch: 'When a Balanced Active member goes quiet, something is wrong. Act immediately.' },
  'Weekend Warrior':   { summary: 'Active, but only Saturday and Sunday. Invisible weekdays.', retention: 'Medium churn risk — fades when weekend commitments compete.', opportunity: "Target them Thursday/Friday when they're planning the weekend.", watch: 'Anne Jordan is on a slow path out — 4 rounds in Oct, 2 in Nov, 1 in Dec.' },
  'Declining':         { summary: 'Engagement dropping across all domains over 2–3 months.', retention: 'High churn risk. 30 members in this category — $540K in annual dues.', opportunity: 'Email still works in the early weeks. After that, personal outreach only.', watch: 'Robert Callahan is hitting his F&B minimum and stopping. Classic exit pattern.' },
  'New Member':        { summary: 'Ramping up. First 90 days define the long-term relationship.', retention: 'Critical window — most new members decide in month 3 whether they stay.', opportunity: 'Most responsive to onboarding outreach. High email open rates right now.', watch: "If activity doesn't increase by week 8, early intervention is needed." },
  'Ghost':             { summary: 'Pays dues, barely uses the club. Obligation-only relationship.', retention: 'High churn risk — no emotional connection to the club.', opportunity: 'One meaningful experience can shift them. Hard to engineer, worth trying.', watch: 'Linda Leonard resigned in January after no visits since October.' },
  'Snowbird':          { summary: 'Active only in winter months. January is their peak engagement period.', retention: 'Medium risk — tied to seasonal travel, not dissatisfaction.', opportunity: "January is their best month. Events and dining promotions land now.", watch: "Don't confuse summer inactivity with disengagement." },
};

export default function ArchetypeTab() {
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
              border: `1px solid ${isSelected ? theme.colors.members : theme.colors.border}`,
              background: isSelected ? `${theme.colors.members}14` : theme.colors.bgCard,
              color: isSelected ? theme.colors.members : theme.colors.textSecondary,
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
    </div>
  );
}
