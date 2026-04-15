// HealthOverview — members intelligence panel
// V7: full roster, paginated (25/page), archetype + health-tier + first-90 filters, interactive KPI cards
import { Fragment, useMemo, useState, useCallback, useEffect } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import EmailTab from '@/features/member-health/tabs/EmailTab';
import { getHealthDistribution, getAtRiskMembers, getWatchMembers, getFullRoster, getMemberSummary } from '@/services/memberService';
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

const PAGE_SIZE = 25;

const HEALTH_RANGES = {
  Healthy:   [70, 100],
  Watch:     [50,  69],
  'At Risk': [30,  49],
  Critical:  [ 0,  29],
};

export default function HealthOverview() {
  const dist = getHealthDistribution();

  const [expandedId, setExpandedId] = useState(null);
  const [innerTab, setInnerTab] = useState('members');
  const [archetypeFilter, setArchetypeFilter] = useState(null);
  const [archetypePickerOpen, setArchetypePickerOpen] = useState(false);
  const [showFirst90, setShowFirst90] = useState(false);
  const [healthFilter, setHealthFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [rescoring, setRescoring] = useState(false);
  const [rescoreMsg, setRescoreMsg] = useState(null);

  useApp(); // keep context subscription

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

  // Full roster enriched with action/owner — sorted worst-first
  const allMembers = useMemo(() => {
    const roster = getFullRoster();
    if (!roster.length) return [];
    return roster
      .map(m => {
        const score = m.score ?? m.healthScore ?? 50;
        const complaint = getComplaintInfo(m.memberId);
        const reason = complaint
          ? `Complaint unresolved ${complaint.days} days (${complaint.category})`
          : m.topRisk || 'No current risks';
        const { action, type, owner } = getDifferentiatedAction({ ...m, score }, complaint);
        return { ...m, score, reason, action, actionType: type, owner };
      })
      .sort((a, b) => a.score - b.score);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [archetypeFilter, showFirst90, healthFilter]);

  const filteredMembers = useMemo(() => {
    let list = allMembers;
    if (healthFilter) {
      const [lo, hi] = HEALTH_RANGES[healthFilter] ?? [0, 100];
      list = list.filter(m => m.score >= lo && m.score <= hi);
    }
    if (archetypeFilter) list = list.filter(m => m.archetype === archetypeFilter);
    if (showFirst90) {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
      list = list.filter(m => m.joinDate && new Date(m.joinDate) >= cutoff);
    }
    return list;
  }, [allMembers, archetypeFilter, showFirst90, healthFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const displayedMembers = filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (allMembers.length === 0) {
    const summary = getMemberSummary();
    if (summary.total > 0) {
      const desc = `${summary.total} members imported. Connect tee sheet, POS, or email to unlock deeper risk scoring.`;
      return <DataEmptyState icon="✅" title="No members at risk" description={desc} dataType="engagement data" />;
    }
    return <DataEmptyState icon="👥" title="No members imported yet" description="Import your member roster to start tracking member health and engagement." dataType="members" />;
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Health Distribution KPI Cards */}
      <div className="grid-responsive-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {dist.map((d) => {
          const delta = Number.isFinite(d?.delta) ? d.delta : 0;
          const descriptor = levelDescriptions[d.level] ?? 'are in this state';
          const deltaColor = delta > 0 ? '#ef4444' : delta < 0 ? '#12b76a' : '#9CA3AF';
          const deltaCopy = delta === 0
            ? 'same as last month.'
            : `${Math.abs(delta)} ${delta > 0 ? 'more' : 'fewer'} than last month.`;
          return (
            <div
              key={d.level}
              onClick={() => { setHealthFilter(healthFilter === d.level ? null : d.level); setInnerTab('members'); }}
              className="bg-swoop-panel shadow-theme-xs rounded-xl p-4"
              style={{ border: `1px solid ${d.color}40`, cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s, opacity 0.15s', opacity: 1 }}
            >
              <div className="flex justify-between mb-2">
                <span className="text-xs text-swoop-text-label uppercase tracking-wide">{d.level}</span>
                <span className="text-xs" style={{ color: d.color }}>{(d.percentage * 100).toFixed(0)}%</span>
              </div>
              <div className="text-[28px] font-mono font-bold" style={{ color: d.color }}>{d.count}</div>
              <div className="text-xs text-swoop-text-label">members</div>
              <div className="h-1 bg-swoop-border rounded-sm mt-2">
                <div className="h-full rounded-sm" style={{ background: d.color, width: `${d.percentage * 100}%` }} />
              </div>
              <div className="mt-2 text-xs text-swoop-text-muted leading-snug">
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
          <div className="flex gap-px bg-swoop-row border border-swoop-border rounded-lg p-[3px]">
            {[['members', 'Members'], ['email', 'Email Engagement']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setInnerTab(key)}
                className={`px-4 py-[6px] rounded-[6px] text-[13px] font-semibold border-none transition-all duration-150 whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  innerTab === key
                    ? 'bg-swoop-panel text-swoop-text shadow-theme-xs'
                    : 'bg-transparent text-swoop-text-muted hover:text-swoop-text-2'
                }`}
              >{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {rescoreMsg && (
              <span className={`text-[11px] font-medium ${rescoreMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {rescoreMsg.text}
              </span>
            )}
            <button
              type="button"
              onClick={handleRescore}
              disabled={rescoring}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-swoop-border bg-swoop-panel text-swoop-text-muted hover:border-swoop-border hover:text-swoop-text-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {rescoring ? (
                <span className="inline-block w-3 h-3 border-2 border-swoop-border border-t-transparent rounded-full animate-spin" />
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
            <div className="flex items-center gap-2 mb-2 px-2.5 py-[5px] bg-swoop-row border border-swoop-border rounded-lg" style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
              {/* Archetype dropdown trigger */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setArchetypePickerOpen(o => !o)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border border-swoop-border bg-swoop-panel text-swoop-text-muted cursor-pointer hover:border-swoop-border transition-colors whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Archetype
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'transform 0.15s', transform: archetypePickerOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {/* Active filter chips */}
              <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                {healthFilter && (
                  <button type="button" onClick={() => setHealthFilter(null)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    style={{ background: '#6366f118', color: '#6366f1', border: '1px solid #6366f150' }}>
                    {healthFilter} <span className="opacity-70">×</span>
                  </button>
                )}
                {archetypeFilter && (
                  <button type="button" onClick={() => setArchetypeFilter(null)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    style={{ background: (ARCHETYPE_COLORS[archetypeFilter] || '#6b7280') + '18', color: ARCHETYPE_COLORS[archetypeFilter] || '#6b7280', border: `1px solid ${(ARCHETYPE_COLORS[archetypeFilter] || '#6b7280')}50` }}>
                    {ARCHETYPE_EMOJIS[archetypeFilter]} {archetypeFilter} <span className="opacity-70">×</span>
                  </button>
                )}
                {(healthFilter || archetypeFilter || showFirst90) && (
                  <button type="button" onClick={() => { setHealthFilter(null); setArchetypeFilter(null); setShowFirst90(false); }}
                    className="text-[10px] text-swoop-text-label hover:text-gray-600 bg-transparent border-none cursor-pointer whitespace-nowrap shrink-0">
                    Clear all
                  </button>
                )}
              </div>

              {/* Member count */}
              <span className="text-[11px] text-swoop-text-label shrink-0 whitespace-nowrap">
                {filteredMembers.length === allMembers.length
                  ? `${allMembers.length} members`
                  : `${filteredMembers.length} of ${allMembers.length}`}
              </span>

              <div className="w-px h-4 bg-swoop-border shrink-0" />

              <button type="button" onClick={() => setShowFirst90(f => !f)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  showFirst90
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-swoop-border bg-swoop-panel text-swoop-text-muted hover:border-swoop-border'
                }`}>
                🌱 First 90 Days
              </button>
            </div>

            {/* Archetype pill shelf */}
            {archetypePickerOpen && (
              <div className="flex flex-wrap gap-1.5 p-2 mb-2 bg-swoop-panel border border-swoop-border rounded-lg">
                {ARCHETYPES.map(a => {
                  const color = ARCHETYPE_COLORS[a] || '#6b7280';
                  const isActive = archetypeFilter === a;
                  return (
                    <button key={a} type="button"
                      onClick={() => { setArchetypeFilter(isActive ? null : a); setArchetypePickerOpen(false); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer border transition-all whitespace-nowrap"
                      style={{ borderColor: isActive ? color : color + '60', background: isActive ? color + '20' : color + '10', color, opacity: isActive ? 1 : 0.8 }}>
                      {ARCHETYPE_EMOJIS[a]} {a}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Member table */}
            <div className="border border-swoop-border rounded-xl overflow-hidden">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-swoop-row border-b border-swoop-border">
                    <th className="py-2 text-[10px] text-swoop-text-label font-medium text-left" style={{ width: 28, paddingLeft: 14 }}>#</th>
                    <th className="px-3 py-2 text-[10px] text-swoop-text-label font-medium text-left">Member</th>
                    <th className="px-3 py-2 text-[10px] text-swoop-text-label font-medium text-left" style={{ width: 90 }}>Score</th>
                    <th className="px-3 py-2 text-[10px] text-swoop-text-label font-medium text-left hidden sm:table-cell" style={{ width: 110 }}>Archetype</th>
                    <th className="px-3 py-2 text-[10px] text-swoop-text-label font-medium text-left hidden md:table-cell">Signal</th>
                    <th className="px-3 py-2 text-[10px] text-swoop-text-label font-medium text-left hidden sm:table-cell" style={{ width: 130 }}>Assign To</th>
                    <th className="px-3 py-2 text-[10px] text-swoop-text-label font-medium text-center" style={{ width: 58 }}>Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedMembers.map((m, idx) => {
                    const globalIdx = (page - 1) * PAGE_SIZE + idx;
                    const sc = scoreColor(m.score);
                    const isExpanded = expandedId === m.memberId;
                    const hasEmailDecay = m.actionType === 'email' || (m.reason || '').toLowerCase().includes('email');
                    const ownerColor = OWNER_COLORS[m.owner] || '#6b7280';
                    const archetypeColor = ARCHETYPE_COLORS[m.archetype] || '#6b7280';
                    const rowBg = isExpanded
                      ? 'bg-indigo-50/40'
                      : idx % 2 === 0
                        ? 'bg-swoop-panel hover:bg-swoop-row-hover'
                        : 'bg-gray-50/50 hover:bg-swoop-row-hover';

                    return (
                      <Fragment key={m.memberId}>
                        <tr onClick={() => setExpandedId(isExpanded ? null : m.memberId)}
                          className={`border-t border-swoop-border cursor-pointer transition-all duration-150 ${rowBg}`}>
                          <td className="py-2.5 text-[11px] font-mono font-bold text-center" style={{ paddingLeft: 14 }}>
                            {isExpanded
                              ? <span className="text-brand-500 text-[10px]">▼</span>
                              : <span className="text-swoop-text-label">{globalIdx + 1}</span>}
                          </td>
                          <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                            <MemberLink memberId={m.memberId} mode="drawer" className="font-semibold text-sm text-[#1a1a2e] hover:text-brand-500 transition-colors">
                              {m.name}
                            </MemberLink>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0" style={{ color: sc, background: sc + '15' }}>
                                {m.score}
                              </span>
                              <div className="flex-1 h-[3px] bg-swoop-row rounded-full" style={{ minWidth: 24, maxWidth: 40 }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, m.score)}%`, background: sc }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 hidden sm:table-cell">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ color: archetypeColor, background: archetypeColor + '18', border: `1px solid ${archetypeColor}40` }}>
                              {m.archetype}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-swoop-text-muted hidden md:table-cell" style={{ maxWidth: 260 }}>
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
                                <div className="hidden group-hover:block absolute right-0 top-full mt-1 z-10 w-48 p-2 bg-swoop-canvas text-white text-[10px] rounded-lg shadow-xl pointer-events-none">
                                  <div className="font-bold mb-1 text-yellow-300">⚠ Email Decay</div>
                                  <div>Open {m.name.split(' ')[0]}&apos;s profile to review the engagement trend and take action.</div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[#f8faff]">
                            <td colSpan={7} className="px-4 py-3 border-t border-swoop-border-inset">
                              <div className="flex gap-8 flex-wrap items-start mb-3 pl-6">
                                <div>
                                  <div className="text-[10px] font-bold text-swoop-text-label uppercase tracking-wide mb-1">Signal</div>
                                  <div className="text-xs text-swoop-text-muted max-w-sm">{m.reason}</div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-swoop-text-label uppercase tracking-wide mb-1">Recommended Action</div>
                                  <div className="text-xs text-swoop-text-muted max-w-sm">{m.action}</div>
                                  <span className="mt-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: OWNER_COLORS[m.owner] || '#6b7280', background: (OWNER_COLORS[m.owner] || '#6b7280') + '18' }}>
                                    {m.owner}
                                  </span>
                                </div>
                              </div>
                              <div className="pl-6" onClick={e => e.stopPropagation()}>
                                <MemberLink memberId={m.memberId} mode="drawer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-500 hover:underline cursor-pointer">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[11px] text-swoop-text-label">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length} members
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-swoop-border bg-swoop-panel text-swoop-text-muted cursor-pointer hover:border-swoop-border disabled:opacity-40 disabled:cursor-default transition-colors">
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    // Show first, last, current ±1, and ellipsis
                    const p = totalPages <= 7 ? i + 1 : (() => {
                      const pages = new Set([1, totalPages, page - 1, page, page + 1].filter(x => x >= 1 && x <= totalPages));
                      return [...pages].sort((a,b)=>a-b)[i];
                    })();
                    if (!p) return null;
                    const prevP = i > 0 ? (totalPages <= 7 ? i : [...new Set([1, totalPages, page - 1, page, page + 1].filter(x => x >= 1 && x <= totalPages))].sort((a,b)=>a-b)[i-1]) : null;
                    return (
                      <Fragment key={p}>
                        {prevP && p - prevP > 1 && <span className="text-[11px] text-swoop-text-ghost px-0.5">…</span>}
                        <button type="button" onClick={() => setPage(p)}
                          className={`w-7 h-7 text-[11px] font-semibold rounded-md border cursor-pointer transition-colors ${
                            p === page
                              ? 'bg-brand-500 text-white border-brand-500'
                              : 'bg-swoop-panel border-swoop-border text-swoop-text-muted hover:border-swoop-border'
                          }`}>
                          {p}
                        </button>
                      </Fragment>
                    );
                  })}
                  <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-swoop-border bg-swoop-panel text-swoop-text-muted cursor-pointer hover:border-swoop-border disabled:opacity-40 disabled:cursor-default transition-colors">
                    Next →
                  </button>
                </div>
              </div>
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
