import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { getArchetypeProfiles } from '@/services/memberService';
import { theme } from '@/config/theme';
import { useState } from 'react';

const DIMS = ['golf', 'dining', 'events', 'email', 'trend'];
const DIM_LABELS = { golf: 'Golf', dining: 'Dining', events: 'Events', email: 'Email', trend: 'Trend' };

export default function ArchetypeTab() {
  const profiles = getArchetypeProfiles();
  const [selected, setSelected] = useState('Balanced Active');
  const profile = profiles.find(p => p.archetype === selected) ?? profiles[0];

  const radarData = DIMS.map(d => ({
    dim: DIM_LABELS[d],
    value: Math.max(0, Math.min(100, d === 'trend' ? 50 + profile.trend : profile[d])),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Archetype selector */}
      <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        {profiles.map(p => (
          <button key={p.archetype} onClick={() => setSelected(p.archetype)} style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`, borderRadius: theme.radius.md, cursor: 'pointer',
            border: `1px solid ${selected === p.archetype ? theme.colors.members : theme.colors.border}`,
            background: selected === p.archetype ? `${theme.colors.members}20` : 'transparent',
            color: selected === p.archetype ? theme.colors.members : theme.colors.textSecondary,
            fontSize: theme.fontSize.xs,
          }}>
            {p.archetype} <span style={{ color: theme.colors.textMuted }}>({p.count})</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
        {/* Radar */}
        <div style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
          padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm }}>{profile.archetype}</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={theme.colors.border} />
              <PolarAngleAxis dataKey="dim" tick={{ fill: theme.colors.textSecondary, fontSize: 12 }} />
              <Radar dataKey="value" fill={theme.colors.members} fillOpacity={0.25}
                stroke={theme.colors.members} strokeWidth={2} />
              <Tooltip formatter={v => [`${v}`, 'Score']}
                contentStyle={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: 8 }}
                labelStyle={{ color: theme.colors.textPrimary }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
          padding: theme.spacing.md, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary,
            marginBottom: theme.spacing.md }}>Engagement Scores</div>
          {DIMS.map(d => {
            const raw = d === 'trend' ? 50 + profile.trend : profile[d];
            const color = raw >= 60 ? theme.colors.success : raw >= 30 ? theme.colors.warning : theme.colors.urgent;
            return (
              <div key={d} style={{ marginBottom: theme.spacing.sm }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
                    {DIM_LABELS[d]}
                  </span>
                  <span style={{ fontSize: theme.fontSize.xs, fontFamily: theme.fonts.mono, color }}>{raw}</span>
                </div>
                <div style={{ height: 4, background: theme.colors.border, borderRadius: 2 }}>
                  <div style={{ height: '100%', background: color, borderRadius: 2, width: `${Math.max(0, raw)}%` }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: theme.spacing.md, padding: theme.spacing.sm,
            background: theme.colors.bg, borderRadius: theme.radius.sm,
            fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            {profile.count} members · Trend: {profile.trend > 0 ? '+' : ''}{profile.trend} pts/mo
          </div>
        </div>
      </div>
    </div>
  );
}
