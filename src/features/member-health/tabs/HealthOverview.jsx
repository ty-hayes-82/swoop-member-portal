// HealthOverview — members intelligence panel
// V6: inner 2-tab (Members / Email), archetype filter + First 90 Days toggle, Re-Score button
import { Fragment, useMemo, useState, useCallback } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import EmailTab from '@/features/member-health/tabs/EmailTab';
import { getHealthDistribution, getAtRiskMembers, getWatchMembers, getVolatileMembers, getMemberSummary } from '@/services/memberService';
import { getComplaintCorrelation } from '@/services/staffingService';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { isGateOpen } from '@/services/demoGate';
import { useApp } from '@/context/AppContext';

const REF_DATE = new Date('2026-01-31');

const levelDescriptions = {
  Healthy: 'are actively engaged across the club',
  Watch: 'need monitoring before small issues appear',
  'At Risk': 'are showing signs of disengagement',
  Critical: 'require immediate outreach',
};

const OWNER_COLORS = {
  'GM': '#6366f1',
  'Membership Director': '#f59e0b',
  'Pro Shop': '#22c55e',
  'Events Coordinator': '#8b5cf6',
  'F&B Director': '#3b82f6',
  'Front Desk': '#06b6d4',
};

const ARCHETYPE_COLORS = {
  'Declining': '#ef4444',
  'Ghost': '#9CA3AF',
  'Weekend Warrior': '#ea580c',
  'Die-Hard Golfer': '#039855',
  'Social Butterfly': '#db2777',
  'New Member': '#d97706',
  'Snowbird': '#0369a1',
  'Balanced Active': '#0284c7',
};

const ARCHETYPE_EMOJIS = {
  'Die-Hard Golfer': '⛳',
  'Social Butterfly': '🦋',
  'Balanced Active': '◉',
  'Weekend Warrior': '📅',
  'Declining': '📉',
  'New Member': '★',
  'Ghost': '👻',
  'Snowbird': '✈',
};

const ARCHETYPES = ['Die-Hard Golfer', 'Social Butterfly', 'Balanced Active', 'Weekend Warrior', 'Declining', 'New Member', 'Ghost', 'Snowbird'];

const ACTION_OWNERS = {
  'Ghost': 'GM',
  'Declining': 'Membership Director',
  'Weekend Warrior': 'Pro Shop',
  'Die-Hard Golfer': 'Pro Shop',
  'Social Butterfly': 'Events Coordinator',
  'New Member': 'Membership Director',
  'Snowbird': 'Front Desk',
  'Balanced Active': 'Membership Director',
};

function getComplaintInfo(memberId) {
  const complaint = getComplaintCorrelation().find(
    f => f.memberId === memberId && f.status !== 'resolved'
  );
  if (!complaint) return null;
  const days = Math.round((REF_DATE - new Date(complaint.date)) / (1000 * 60 * 60 * 24));
  return { days, category: complaint.category };
}

function getDifferentiatedAction(member, complaint) {
  const owner = ACTION_OWNERS[member.archetype] || 'Membership Director';
  if (complaint) {
    return { action: `Resolve complaint — ${complaint.category}, ${complaint.days} days open`, type: 'complaint', owner: complaint.days > 14 ? 'GM' : owner };
  }
  const risk = (member.topRisk || member.signal || '').toLowerCase();
  switch (member.archetype) {
    case 'Ghost':
      return { action: 'GM personal call — re-engagement conversation', type: 'ghost', owner: 'GM' };
    case 'Declining':
      return { action: 'Membership Director outreach — identify root cause of declining activity', type: 'declining', owner: 'Membership Director' };
    case 'Weekend Warrior':
      return { action: 'Priority Saturday tee time offer from Pro Shop', type: 'golf', owner: 'Pro Shop' };
    case 'Die-Hard Golfer': {
      const weeks = risk.match(/(\d+)\s*weeks?/)?.[1];
      return { action: `Pro shop outreach — ${weeks ? `check in, last round ${weeks} weeks ago` : 'check equipment/injury/schedule'}`, type: 'golf', owner: 'Pro Shop' };
    }
    case 'Social Butterfly':
      return { action: 'Invite to upcoming wine dinner or social event', type: 'social', owner: 'Events Coordinator' };
    case 'New Member':
      return { action: 'New member integration check-in — identify engagement gaps', type: 'new-member', owner: 'Membership Director' };
    case 'Snowbird':
      return { action: 'Send welcome-back package + tee time reservation', type: 'snowbird', owner: 'Front Desk' };
    default:
      break;
  }
  if (risk.includes('email') || risk.includes('open rate')) {
    const pct = risk.match(/(\d+)%/)?.[1] || '';
    return { action: `Check-in call — email engagement dropped${pct ? ` ${pct}%` : ''}`, type: 'email', owner };
  }
  if (risk.includes('dining') || risk.includes('f&b')) {
    return { action: 'Invite to upcoming dinner or dining event', type: 'dining', owner: 'F&B Director' };
  }
  return { action: member.action || 'Personalized outreach based on engagement pattern', type: 'general', owner };
}

function buildPriorityList(atRisk, watchList, volatileMembers) {
  const seen = new Set();
  const all = [];
  for (const m of atRisk) {
    if (!seen.has(m.memberId)) { seen.add(m.memberId); all.push({ ...m, tier: 'at-risk' }); }
  }
  for (const m of volatileMembers) {
    if (!seen.has(m.memberId)) { seen.add(m.memberId); all.push({ ...m, tier: 'volatile' }); }
  }
  for (const m of watchList) {
    if (!seen.has(m.memberId)) { seen.add(m.memberId); all.push({ ...m, tier: 'watch' }); }
  }
  return all
    .map(m => {
      const complaint = getComplaintInfo(m.memberId);
      const score = m.score ?? 50;
      const isNewMember = m.archetype === 'New Member';
      const priorityScore = (100 - score) + (complaint ? 20 : 0) + (score < 30 ? 15 : 0) + (isNewMember ? 10 : 0);
      const reason = complaint
        ? `Complaint unresolved ${complaint.days} days (${complaint.category})`
        : m.topRisk || m.signal || 'Health score declining';
      const { action, type, owner } = getDifferentiatedAction(m, complaint);
      return { ...m, priorityScore, reason, action, actionType: type, owner };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

const scoreColor = (score) =>
  score < 20 ? '#ef4444'
  : score < 30 ? '#f97316'
  : score < 50 ? '#f59e0b'
  : '#6B7280';

export default function HealthOverview() {
  const dist = getHealthDistribution();
  const atRisk = getAtRiskMembers();
  const watchList = getWatchMembers();
  const volatileMembers = getVolatileMembers();

  const [expandedId, setExpandedId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [innerTab, setInnerTab] = useState('members');
  const [archetypeFilter, setArchetypeFilter] = useState(null);
  const [archetypePickerOpen, setArchetypePickerOpen] = useState(false);
  const [showFirst90, setShowFirst90] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [rescoreMsg, setRescoreMsg] = useState(null);

  const { showToast } = useApp();

  const handleRescore = useCallback(async () => {
    setRescoring(true);
    setRescoreMsg(null);
    try {
      const clubId = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_club_id') : null;
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_auth_token') : null;
      const res = await fetch(`/api/compute-health-scores${clubId ? `?clubId=${clubId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && token !== 'demo' ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRescoreMsg({ type: 'success', text: `Scores updated for ${data.updated ?? 'all'} members.` });
        window.dispatchEvent(new CustomEvent('swoop:data-imported', { detail: { category: 'scores' } }));
      } else {
        setRescoreMsg({ type: 'error', text: data.error || 'Score update failed.' });
      }
    } catch (err) {
      setRescoreMsg({ type: 'error', text: `Score update failed: ${err.message}` });
    }
    setRescoring(false);
  }, []);

  if (atRisk.length === 0 && watchList.length === 0) {
    const summary = getMemberSummary();
    if (summary.total > 0) {
      const hasTee = isGateOpen('tee-sheet');
      const hasFb = isGateOpen('fb');
      const hasEmail = isGateOpen('email');
      const nextSource = !hasTee ? 'tee sheet' : !hasFb ? 'POS' : !hasEmail ? 'email' : null;
      const desc = nextSource
        ? `${summary.total} members imported${hasTee ? ' + tee sheet' : ''}${hasFb ? ' + POS' : ''}${hasEmail ? ' + email' : ''}. Connect your ${nextSource} to unlock deeper risk scoring.`
        : `${summary.total} members imported with all engagement sources connected. No members currently at risk.`;
      return <DataEmptyState icon="✅" title="No members at risk" description={desc} dataType="engagement data" />;
    }
    return <DataEmptyState icon="👥" title="No members imported yet" description="Import your member roster to start tracking member health and engagement." dataType="members" />;
  }

  const allPriorityMembers = useMemo(
    () => buildPriorityList(atRisk, watchList, volatileMembers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [atRisk.length, watchList.length, volatileMembers.length]
  );

  const displayedMembers = useMemo(() => {
    let list = allPriorityMembers;
    if (archetypeFilter) list = list.filter(m => m.archetype === archetypeFilter);
    if (showFirst90) list = list.filter(m => m.archetype === 'New Member');
    if (!archetypeFilter && !showFirst90 && !showAll) list = list.slice(0, 10);
    return list;
  }, [allPriorityMembers, archetypeFilter, showFirst90, showAll]);

  return (
    <div className="flex flex-col gap-6">

      {/* Health Distribution KPI Cards */}
      <div className="grid-responsive-4">
        {dist.map((d) => {
          const delta = Number.isFinite(d?.delta) ? d.delta : 0;
          const descriptor = levelDescriptions[d.level] ?? 'are in this state';
          const deltaColor = delta > 0 ? '#ef4444' : delta < 0 ? '#12b76a' : '#9CA3AF';
          const deltaCopy = delta === 0
            ? 'same as last month.'
            : `${Math.abs(delta)} ${delta > 0 ? 'more' : 'fewer'} than last month.`;
          return (
            <div key={d.level} className="bg-white shadow-theme-xs rounded-xl p-4" style={{ border: `1px solid ${d.color}40`, cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s, opacity 0.15s' }}>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">{d.level}</span>
                <span className="text-xs" style={{ color: d.color }}>{(d.percentage * 100).toFixed(0)}%</span>
              </div>
              <div className="text-[28px] font-mono font-bold" style={{ color: d.color }}>{d.count}</div>
              <div className="text-xs text-gray-400">members</div>
              <div className="h-1 bg-gray-200 rounded-sm mt-2">
                <div className="h-full rounded-sm" style={{ background: d.color, width: `${d.percentage * 100}%` }} />
              </div>
              <div className="mt-2 text-xs text-gray-500 leading-snug">
                <strong>{d.count} members</strong> {descriptor} —{' '}
                <span style={{ color: deltaColor }}>{deltaCopy}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main panel */}
      <div>

        {/* Inner tab bar + Re-Score */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex gap-px bg-gray-100 border border-gray-200 rounded-lg p-[3px] dark:bg-gray-800 dark:border-gray-700">
            {[['members', 'Members'], ['email', 'Email Engagement']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setInnerTab(key)}
                className={`px-4 py-[6px] rounded-[6px] text-[13px] font-semibold border-none transition-all duration-150 whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  innerTab === key
                    ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {rescoreMsg && (
              <span className={`text-[11px] font-medium ${rescoreMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {rescoreMsg.text}
              </span>
            )}
            <button
              type="button"
              onClick={handleRescore}
              disabled={rescoring}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-50 dark:bg-white/[0.03] dark:border-gray-700 dark:text-gray-400"
            >
              {rescoring ? (
                <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              )}
              Re-Score
            </button>
          </div>
        </div>

        {/* Members tab */}
        {innerTab === 'members' && (
          <>
            {/* Filter bar */}
            <div className="flex items-center gap-2 mb-2 px-2.5 py-[5px] bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-800/50 dark:border-gray-700" style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setArchetypePickerOpen(o => !o)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-gray-300 transition-colors whitespace-nowrap dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {archetypeFilter || 'Archetype'}
                  <svg
                    xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'transform 0.15s', transform: archetypePickerOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                {archetypeFilter && (
                  <button
                    type="button"
                    onClick={() => setArchetypeFilter(null)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    style={{
                      background: (ARCHETYPE_COLORS[archetypeFilter] || '#6b7280') + '18',
                      color: ARCHETYPE_COLORS[archetypeFilter] || '#6b7280',
                      border: `1px solid ${(ARCHETYPE_COLORS[archetypeFilter] || '#6b7280')}50`,
                    }}
                  >
                    {ARCHETYPE_EMOJIS[archetypeFilter]} {archetypeFilter}
                    <span className="ml-0.5 opacity-70">×</span>
                  </button>
                )}
              </div>

              <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 shrink-0" />

              <button
                type="button"
                onClick={() => setShowFirst90(f => !f)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  showFirst90
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                🌱 First 90 Days
              </button>
            </div>

            {/* Archetype pill shelf */}
            {archetypePickerOpen && (
              <div className="flex flex-wrap gap-1.5 p-2 mb-2 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
                {ARCHETYPES.map(a => {
                  const color = ARCHETYPE_COLORS[a] || '#6b7280';
                  const isActive = archetypeFilter === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => { setArchetypeFilter(isActive ? null : a); setArchetypePickerOpen(false); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer border transition-all whitespace-nowrap"
                      style={{
                        borderColor: isActive ? color : color + '60',
                        background: isActive ? color + '20' : color + '10',
                        color,
                        opacity: isActive ? 1 : 0.8,
                      }}
                    >
                      {ARCHETYPE_EMOJIS[a]} {a}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Member table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 text-[10px] text-gray-400 font-medium text-left" style={{ width: 28, paddingLeft: 14 }}>#</th>
                    <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left">Member</th>
                    <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left" style={{ width: 90 }}>Score</th>
                    <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left hidden sm:table-cell" style={{ width: 110 }}>Archetype</th>
                    <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left hidden md:table-cell">Signal</th>
                    <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-left hidden sm:table-cell" style={{ width: 130 }}>Assign To</th>
                    <th className="px-3 py-2 text-[10px] text-gray-400 font-medium text-center" style={{ width: 58 }}>Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedMembers.map((m, idx) => {
                    const sc = scoreColor(m.score);
                    const isExpanded = expandedId === m.memberId;
                    const hasEmailDecay = m.actionType === 'email' || (m.reason || '').toLowerCase().includes('email');
                    const ownerColor = OWNER_COLORS[m.owner] || '#6b7280';
                    const archetypeColor = ARCHETYPE_COLORS[m.archetype] || '#6b7280';
                    const rowBg = isExpanded
                      ? 'bg-indigo-50/40 dark:bg-indigo-500/5'
                      : idx % 2 === 0
                        ? 'bg-white hover:bg-gray-50 dark:bg-transparent dark:hover:bg-white/[0.02]'
                        : 'bg-gray-50/50 hover:bg-gray-50 dark:bg-white/[0.01] dark:hover:bg-white/[0.02]';

                    return (
                      <Fragment key={m.memberId}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : m.memberId)}
                          className={`border-t border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-150 ${rowBg}`}
                        >
                          <td className="py-2.5 text-[11px] font-mono font-bold text-center" style={{ paddingLeft: 14 }}>
                            {isExpanded
                              ? <span className="text-brand-500 text-[10px]">▼</span>
                              : <span className="text-gray-400">{idx + 1}</span>}
                          </td>
                          <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                            <MemberLink memberId={m.memberId} mode="drawer" className="font-semibold text-sm text-[#1a1a2e] hover:text-brand-500 transition-colors dark:text-white/90">
                              {m.name}
                            </MemberLink>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0" style={{ color: sc, background: sc + '15' }}>
                                {m.score}
                              </span>
                              <div className="flex-1 h-[3px] bg-gray-100 dark:bg-gray-700 rounded-full" style={{ minWidth: 24, maxWidth: 40 }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, m.score)}%`, background: sc }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 hidden sm:table-cell">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ color: archetypeColor, background: archetypeColor + '18', border: `1px solid ${archetypeColor}40` }}>
                              {m.archetype}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell" style={{ maxWidth: 260 }}>
                            <span className="line-clamp-1">{m.reason}</span>
                          </td>
                          <td className="px-3 py-2.5 hidden sm:table-cell">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ color: ownerColor, background: ownerColor + '18' }}>
                              {m.owner}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {hasEmailDecay && (
                              <div className="relative group inline-flex justify-center">
                                <span className="text-sm cursor-default select-none">✉</span>
                                <div className="hidden group-hover:block absolute right-0 top-full mt-1 z-10 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl pointer-events-none">
                                  <div className="font-bold mb-1 text-yellow-300">⚠ Email Decay</div>
                                  <div>Open {m.name.split(' ')[0]}&apos;s profile to review the engagement trend and take action.</div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[#f8faff] dark:bg-gray-800/30">
                            <td colSpan={7} className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex gap-8 flex-wrap items-start mb-3 pl-6">
                                <div>
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Signal</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-300 max-w-sm">{m.reason}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Recommended Action</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-300 max-w-sm">{m.action}</div>
                                  <span className="mt-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: OWNER_COLORS[m.owner] || '#6b7280', background: (OWNER_COLORS[m.owner] || '#6b7280') + '18' }}>
                                    {m.owner}
                                  </span>
                                </div>
                              </div>
                              <div className="pl-6" onClick={e => e.stopPropagation()}>
                                <MemberLink
                                  memberId={m.memberId}
                                  mode="drawer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-500 hover:underline cursor-pointer"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" x2="21" y1="14" y2="3" />
                                  </svg>
                                  Open member profile
                                </MemberLink>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Show all — only when no filters active */}
            {!archetypeFilter && !showFirst90 && allPriorityMembers.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAll(s => !s)}
                className="mt-2 px-4 py-2 text-xs font-semibold text-brand-500 bg-transparent border border-brand-500/20 rounded-lg cursor-pointer w-full text-center hover:bg-brand-500/5 transition-colors"
              >
                {showAll ? 'Show fewer' : `View all ${allPriorityMembers.length} members →`}
              </button>
            )}
          </>
        )}

        {/* Email Engagement tab */}
        {innerTab === 'email' && (
          <div className="mt-1">
            <EmailTab />
          </div>
        )}

      </div>
    </div>
  );
}
