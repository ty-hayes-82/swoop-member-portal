const mono = "'JetBrains Mono', monospace";

// Simulated new members within last 90 days
const newMembers = [
  { name: 'James Whitfield', joinDate: '2026-01-15', daysIn: 73, milestones: { firstRound: true, firstDining: true, firstEvent: false, emailOpen: true }, healthScore: 64, archetype: 'Balanced Active' },
  { name: 'Sarah Chen', joinDate: '2026-01-28', daysIn: 60, milestones: { firstRound: true, firstDining: true, firstEvent: true, emailOpen: true }, healthScore: 81, archetype: 'Social Butterfly' },
  { name: 'Michael Torres', joinDate: '2026-02-10', daysIn: 47, milestones: { firstRound: true, firstDining: false, firstEvent: false, emailOpen: true }, healthScore: 45, archetype: 'Weekend Warrior' },
  { name: 'Lisa Park', joinDate: '2026-02-22', daysIn: 35, milestones: { firstRound: false, firstDining: true, firstEvent: false, emailOpen: false }, healthScore: 32, archetype: 'New Member' },
  { name: 'Robert Kim', joinDate: '2026-03-05', daysIn: 24, milestones: { firstRound: true, firstDining: false, firstEvent: false, emailOpen: true }, healthScore: 58, archetype: 'Die-Hard Golfer' },
  { name: 'Amanda Brooks', joinDate: '2026-03-12', daysIn: 17, milestones: { firstRound: false, firstDining: false, firstEvent: false, emailOpen: true }, healthScore: 40, archetype: 'New Member' },
];

const MILESTONES = [
  { key: 'firstRound', label: 'First Round', icon: '\u26F3', targetWeek: 2 },
  { key: 'firstDining', label: 'First Dining', icon: '\uD83C\uDF7D\uFE0F', targetWeek: 3 },
  { key: 'emailOpen', label: 'Email Engaged', icon: '\u2709\uFE0F', targetWeek: 1 },
  { key: 'firstEvent', label: 'First Event', icon: '\uD83C\uDF89', targetWeek: 6 },
];

const PHASES = [
  { label: 'Orientation', weeks: '1-4', color: '#3b82f6' },
  { label: 'Habit Building', weeks: '5-8', color: '#8b5cf6' },
  { label: 'Integration', weeks: '9-12', color: '#16a34a' },
];

function getPhase(daysIn) {
  if (daysIn <= 28) return 0;
  if (daysIn <= 56) return 1;
  return 2;
}

function getScoreColor(score) {
  if (score >= 70) return '#16a34a';
  if (score >= 50) return '#ca8a04';
  if (score >= 30) return '#ea580c';
  return '#b91c1c';
}

function getMilestoneStatus(member) {
  const total = MILESTONES.length;
  const completed = MILESTONES.filter(m => member.milestones[m.key]).length;
  return { completed, total, pct: Math.round((completed / total) * 100) };
}

function getSuggestedAction(member) {
  if (!member.milestones.firstRound) return 'Schedule welcome round with Head Pro';
  if (!member.milestones.firstDining) return 'Send dining invitation with new member perk';
  if (!member.milestones.firstEvent) return 'Personally invite to upcoming social event';
  if (!member.milestones.emailOpen) return 'Verify email address and resend welcome series';
  return 'On track - continue monitoring';
}

export default function CohortTab() {
  const flaggedCount = newMembers.filter(m => getMilestoneStatus(m).pct < 75).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '12px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', margin: 0, marginBottom: '4px' }}>
              First 90 Days
            </h4>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
              New member integration tracking — are they building habits?
            </p>
          </div>
          <div className="flex gap-2">
            <div style={{
              textAlign: 'center', padding: '6px 14px', borderRadius: '8px',
              background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
            }}>
              <div style={{ fontFamily: mono, fontSize: '18px', fontWeight: 700, color: '#16a34a' }}>{newMembers.length}</div>
              <div style={{ fontSize: '10px', color: '#9CA3AF' }}>New Members</div>
            </div>
            <div style={{
              textAlign: 'center', padding: '6px 14px', borderRadius: '8px',
              background: flaggedCount > 0 ? 'rgba(234,88,12,0.06)' : 'rgba(34,197,94,0.06)',
              border: `1px solid ${flaggedCount > 0 ? 'rgba(234,88,12,0.15)' : 'rgba(34,197,94,0.15)'}`,
            }}>
              <div style={{ fontFamily: mono, fontSize: '18px', fontWeight: 700, color: flaggedCount > 0 ? '#ea580c' : '#16a34a' }}>{flaggedCount}</div>
              <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Falling Behind</div>
            </div>
          </div>
        </div>

        {/* Phase Timeline */}
        <div style={{ marginTop: '16px', display: 'flex', gap: 0, borderRadius: '8px', overflow: 'hidden' }}>
          {PHASES.map((phase, i) => (
            <div key={phase.label} style={{
              flex: 1, padding: '8px 12px', background: `${phase.color}10`,
              borderRight: i < PHASES.length - 1 ? `2px solid ${'#ffffff'}` : 'none',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: phase.color }}>{phase.label}</div>
              <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Weeks {phase.weeks}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Cards */}
      {newMembers.map((member) => {
        const phase = getPhase(member.daysIn);
        const status = getMilestoneStatus(member);
        const isBehind = status.pct < 75;
        const action = getSuggestedAction(member);

        return (
          <div key={member.name} style={{
            background: '#ffffff',
            border: `1px solid ${isBehind ? 'rgba(234,88,12,0.2)' : '#E5E7EB'}`,
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <div className="flex items-center gap-2">
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a2e' }}>{member.name}</span>
                <span style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '999px',
                  background: `${PHASES[phase].color}12`, color: PHASES[phase].color,
                  fontWeight: 600,
                }}>
                  {PHASES[phase].label} - Day {member.daysIn}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{
                  fontFamily: mono, fontSize: '14px', fontWeight: 700,
                  color: getScoreColor(member.healthScore),
                  background: `${getScoreColor(member.healthScore)}10`,
                  padding: '2px 8px', borderRadius: '6px',
                }}>
                  {member.healthScore}
                </span>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{member.archetype}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 6, background: '#E5E7EB', borderRadius: 3,
              overflow: 'hidden', marginBottom: '8px',
            }}>
              <div style={{
                width: `${Math.min(member.daysIn / 90 * 100, 100)}%`,
                height: '100%', borderRadius: 3,
                background: PHASES[phase].color,
                transition: 'width 0.4s ease',
              }} />
            </div>

            {/* Milestones */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: isBehind ? '8px' : 0 }}>
              {MILESTONES.map((ms) => {
                const done = member.milestones[ms.key];
                return (
                  <div key={ms.key} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px',
                    background: done ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)',
                    border: `1px solid ${done ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)'}`,
                    color: done ? '#16a34a' : '#dc2626',
                    fontWeight: 600,
                  }}>
                    <span>{ms.icon}</span>
                    <span>{ms.label}</span>
                    <span>{done ? '\u2713' : '\u2717'}</span>
                  </div>
                );
              })}
            </div>

            {/* Action suggestion for behind members */}
            {isBehind && (
              <div style={{
                padding: '8px 12px', borderRadius: '8px',
                background: 'rgba(234,88,12,0.04)', border: '1px solid rgba(234,88,12,0.12)',
                fontSize: '12px', color: '#ea580c', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span className="font-bold">Action:</span> {action}
              </div>
            )}
          </div>
        );
      })}

      {/* Key Insight */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.04) 100%)',
        border: '1px solid rgba(139,92,246,0.15)',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0, border: '1px solid rgba(139,92,246,0.2)',
        }}>
          {'\uD83D\uDCA1'}
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgb(139,92,246)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Key Insight
          </div>
          <p style={{ fontSize: '14px', color: '#1a1a2e', margin: 0, lineHeight: 1.7, fontWeight: 500 }}>
            Members who complete all 4 milestones within 60 days have a <strong>94% Year-1 retention rate</strong>.
            Members who miss 2+ milestones by Day 45 have only a <strong>58% retention rate</strong>.
            The buddy assignment playbook increases milestone completion by <strong>35%</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
