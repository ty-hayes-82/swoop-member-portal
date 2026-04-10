const mono = "'JetBrains Mono', monospace";

// Simulated new members within last 90 days
const newMembers = [
  { name: 'Emily Dawson', joinDate: '2026-01-15', daysIn: 73, milestones: { firstRound: true, firstDining: true, firstEvent: false, emailOpen: true }, healthScore: 64, archetype: 'Balanced Active' },
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
  { label: 'Integration', weeks: '9-12', color: '#039855' },
];

function getPhase(daysIn) {
  if (daysIn <= 28) return 0;
  if (daysIn <= 56) return 1;
  return 2;
}

function getScoreColor(score) {
  if (score >= 70) return '#039855';
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
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h4 className="text-base font-bold text-[#1a1a2e] m-0 mb-1">
              First 90 Days
            </h4>
            <p className="text-xs text-gray-400 m-0">
              New member integration tracking — are they building habits?
            </p>
          </div>
          <div className="flex gap-2">
            <div className="text-center px-3.5 py-1.5 rounded-lg bg-success-500/[0.06] border border-success-500/15">
              <div className="text-lg font-bold text-success-600" style={{ fontFamily: mono }}>{newMembers.length}</div>
              <div className="text-[10px] text-gray-400">New Members</div>
            </div>
            <div className={`text-center px-3.5 py-1.5 rounded-lg ${flaggedCount > 0 ? 'bg-orange-600/[0.06] border border-orange-600/15' : 'bg-success-500/[0.06] border border-success-500/15'}`}>
              <div className="text-lg font-bold" style={{ fontFamily: mono, color: flaggedCount > 0 ? '#ea580c' : '#039855' }}>{flaggedCount}</div>
              <div className="text-[10px] text-gray-400">Falling Behind</div>
            </div>
          </div>
        </div>

        {/* Phase Timeline */}
        <div className="mt-4 flex rounded-lg overflow-hidden">
          {PHASES.map((phase, i) => (
            <div key={phase.label} className="flex-1 px-3 py-2 text-center" style={{ background: `${phase.color}10`, borderRight: i < PHASES.length - 1 ? '2px solid #ffffff' : 'none' }}>
              <div className="text-[11px] font-bold" style={{ color: phase.color }}>{phase.label}</div>
              <div className="text-[10px] text-gray-400">Weeks {phase.weeks}</div>
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
          <div key={member.name} className="bg-white rounded-xl p-4" style={{ border: `1px solid ${isBehind ? 'rgba(234,88,12,0.2)' : '#E5E7EB'}` }}>
            <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#1a1a2e]">{member.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${PHASES[phase].color}12`, color: PHASES[phase].color }}>
                  {PHASES[phase].label} - Day {member.daysIn}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold px-2 py-0.5 rounded-md" style={{ fontFamily: mono, color: getScoreColor(member.healthScore), background: `${getScoreColor(member.healthScore)}10` }}>
                  {member.healthScore}
                </span>
                <span className="text-[11px] text-gray-400">{member.archetype}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-[width] duration-400 ease-out" style={{ width: `${Math.min(member.daysIn / 90 * 100, 100)}%`, background: PHASES[phase].color }} />
            </div>

            {/* Milestones */}
            <div className={`flex gap-2 flex-wrap ${isBehind ? 'mb-2' : ''}`}>
              {MILESTONES.map((ms) => {
                const done = member.milestones[ms.key];
                return (
                  <div key={ms.key} className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${done ? 'bg-success-500/[0.08] border border-success-500/20 text-success-600' : 'bg-red-500/[0.06] border border-red-500/15 text-red-600'}`}>
                    <span>{ms.icon}</span>
                    <span>{ms.label}</span>
                    <span>{done ? '\u2713' : '\u2717'}</span>
                  </div>
                );
              })}
            </div>

            {/* Action suggestion for behind members */}
            {isBehind && (
              <div className="px-3 py-2 rounded-lg bg-orange-600/[0.04] border border-orange-600/[0.12] text-xs text-orange-600 font-medium flex items-center gap-1.5">
                <span className="font-bold">Action:</span> {action}
              </div>
            )}
          </div>
        );
      })}

      {/* Key Insight */}
      <div className="rounded-xl p-6 flex items-start gap-3.5" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.04) 100%)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
          {'\uD83D\uDCA1'}
        </div>
        <div>
          <div className="text-[11px] font-bold text-violet-500 uppercase tracking-wider mb-1.5">
            Key Insight
          </div>
          <p className="text-sm text-[#1a1a2e] m-0 leading-relaxed font-medium">
            Members who complete all 4 milestones within 60 days have a <strong>94% Year-1 retention rate</strong>.
            Members who miss 2+ milestones by Day 45 have only a <strong>58% retention rate</strong>.
            The buddy assignment playbook increases milestone completion by <strong>35%</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
