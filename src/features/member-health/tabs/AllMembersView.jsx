import { useState, useEffect, useMemo } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import { PlaybookActionCard } from '@/components/ui';
import { getAtRiskMembers, getWatchMembers, getHealthDistribution, getArchetypeProfiles, setRosterCache, getMemberRoster } from '@/services/memberService';
import { isAuthenticatedClub } from '@/config/constants';
import { memberProfiles, memberArchetypes } from '@/data/members';
import DataEmptyState from '@/components/ui/DataEmptyState';

// Generate full 300-member roster from all available data sources
const FIRST_NAMES = ['James','Robert','John','Michael','David','William','Richard','Joseph','Thomas','Christopher','Charles','Daniel','Matthew','Anthony','Mark','Steven','Paul','Andrew','Joshua','Kenneth','Kevin','Brian','George','Timothy','Ronald','Edward','Jason','Jeffrey','Ryan','Jacob','Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon','Benjamin','Samuel','Patrick','Alexander','Frank','Raymond','Jack','Dennis','Jerry','Tyler','Aaron','Jose','Nathan','Henry','Douglas','Peter','Zachary','Kyle','Noah','Ethan','Jeremy','Walter','Christian','Keith','Roger','Terry','Harry','Ralph','Sean','Jesse','Roy','Louis','Alan','Eugene','Russell','Randy','Philip','Howard','Vincent','Bobby','Dylan','Johnny','Phillip','Victor','Clarence','Travis','Austin','Martha','Donna','Sandra','Gloria','Teresa','Sara','Debra','Alice','Rachel','Emma','Lisa','Nancy','Betty','Margaret','Dorothy','Kimberly','Emily','Donna','Michelle','Carol','Amanda','Melissa','Deborah','Stephanie','Rebecca','Sharon','Laura','Cynthia','Kathleen','Amy','Angela','Shirley','Anna','Brenda','Pamela','Nicole','Samantha','Katherine','Christine','Helen','Debbie','Janet','Catherine','Maria','Heather','Diane','Olivia','Julie','Joyce','Virginia','Victoria','Kelly','Lauren','Christina','Joan','Evelyn','Judith','Andrea','Hannah','Megan','Cheryl','Jacqueline','Martha','Gloria','Teresa','Ann','Sara','Madison','Frances','Kathryn','Janice','Jean','Abigail','Julia','Grace','Judy'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz','Morgan','Cooper','Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim','Cox','Ward','Richardson','Watson','Brooks','Chavez','Wood','James','Bennett','Gray','Mendoza','Ruiz','Hughes','Price','Alvarez','Castillo','Sanders','Patel','Myers','Long','Ross','Foster','Jimenez','Powell','Jenkins','Perry','Russell','Sullivan','Bell','Coleman','Butler','Henderson','Barnes','Gonzales','Fisher','Vasquez','Simmons','Marks','Fox','Dean','Walsh','Burke'];
const ARCHETYPES = ['Die-Hard Golfer','Social Butterfly','Balanced Active','Weekend Warrior','Declining','New Member','Ghost','Snowbird'];
const ARCHETYPE_WEIGHTS = [60, 45, 55, 45, 25, 30, 15, 25]; // matches memberArchetypes counts
const TRENDS = ['up','down','stable','stable','up','stable','down','stable'];
const LOCATIONS = ['Clubhouse','Golf Course','Practice Range','Pool Area','Dining Room','Pro Shop','Fitness Center','Tennis Courts',null,null];

function generateRoster() {
  const roster = [];
  const atRisk = getAtRiskMembers();
  const watch = getWatchMembers();
  // Include real profiles first
  Object.values(memberProfiles).forEach(p => {
    roster.push({ memberId: p.memberId, name: p.name, score: p.healthScore, archetype: p.archetype, duesAnnual: p.duesAnnual, memberValueAnnual: p.memberValueAnnual, tier: p.tier, joinDate: p.joinDate, trend: p.trend, topRisk: p.riskSignals?.[0]?.label || 'No current risks', lastSeenLocation: p.lastSeenLocation });
  });
  // Include at-risk and watch members
  (atRisk || []).forEach(m => {
    if (!roster.find(r => r.memberId === m.memberId)) {
      roster.push({ memberId: m.memberId, name: m.name, score: m.score, archetype: m.archetype, duesAnnual: m.duesAnnual || 15000, tier: m.score < 30 ? 'Critical' : 'At Risk', joinDate: '2020-03-15', trend: 'down', topRisk: m.signal || m.action || 'Engagement declining' });
    }
  });
  (watch || []).forEach(m => {
    if (!roster.find(r => r.memberId === m.memberId)) {
      roster.push({ memberId: m.memberId, name: m.name, score: m.score, archetype: m.archetype, duesAnnual: m.duesAnnual || 15000, tier: 'Watch', joinDate: '2021-06-01', trend: 'stable', topRisk: m.signal || 'Minor engagement shift' });
    }
  });
  // Generate remaining to reach 300, matching healthDistribution exactly
  // Target: 200 Healthy, 35 Watch, 39 At Risk, 26 Critical = 300 total
  const currentCounts = { Healthy: 0, Watch: 0, 'At Risk': 0, Critical: 0 };
  roster.forEach(m => {
    const lvl = (m.score ?? m.healthScore ?? 70) >= 70 ? 'Healthy' : (m.score ?? 70) >= 50 ? 'Watch' : (m.score ?? 70) >= 30 ? 'At Risk' : 'Critical';
    currentCounts[lvl] = (currentCounts[lvl] || 0) + 1;
  });
  const targets = { Healthy: 200, Watch: 35, 'At Risk': 39, Critical: 26 };
  const needed = {
    Healthy: Math.max(0, targets.Healthy - currentCounts.Healthy),
    Watch: Math.max(0, targets.Watch - currentCounts.Watch),
    'At Risk': Math.max(0, targets['At Risk'] - currentCounts['At Risk']),
    Critical: Math.max(0, targets.Critical - currentCounts.Critical),
  };

  // Deterministic pseudo-random using index as seed
  let id = 400;
  const scoreRanges = { Healthy: [70, 98], Watch: [50, 69], 'At Risk': [30, 49], Critical: [5, 29] };
  const levelOrder = ['Healthy', 'Watch', 'At Risk', 'Critical'];

  for (const level of levelOrder) {
    for (let i = 0; i < needed[level]; i++) {
      const idx = id - 400;
      const [lo, hi] = scoreRanges[level];
      const score = lo + (((idx * 7 + 13) % (hi - lo + 1)));
      const archIdx = ((idx * 3 + 5) % ARCHETYPES.length);
      const fn = FIRST_NAMES[((idx * 11 + 3) % FIRST_NAMES.length)];
      const ln = LAST_NAMES[((idx * 7 + 1) % LAST_NAMES.length)];
      const dues = [12000, 14000, 15000, 16000, 18000, 20000, 22000, 25000, 28000, 31000][idx % 10];
      const yr = 2015 + (idx % 10);
      const mo = String(1 + (idx % 12)).padStart(2, '0');
      roster.push({
        memberId: `mbr_${id++}`,
        name: `${fn} ${ln}`,
        score,
        archetype: ARCHETYPES[archIdx],
        duesAnnual: dues,
        tier: level,
        joinDate: `${yr}-${mo}-01`,
        trend: level === 'Healthy' ? 'stable' : level === 'Watch' ? 'stable' : 'down',
        topRisk: level === 'Healthy' ? 'No current risks' : level === 'Watch' ? 'Minor engagement shift' : 'Engagement declining',
        lastSeenLocation: LOCATIONS[idx % LOCATIONS.length],
      });
    }
  }
  return roster;
}

// Moved inside component — module-scope call ran before _init() populated data

function getHealthLevel(score) {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
}

function FilterChip({ label, onRemove, color }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: color + '20', color: color, border: `1px solid ${color}40` }}
    >
      {label}
      <button
        onClick={onRemove}
        className="bg-transparent border-none text-inherit cursor-pointer text-sm p-0 leading-none opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </span>
  );
}

function MemberRow({ member, isExpanded, onToggle, index }) {
  const [hovered, setHovered] = useState(false);
  const healthLevel = getHealthLevel(member.score);
  const healthColor = member.score >= 70
    ? '#22c55e'
    : member.score >= 50
    ? '#f59e0b'
    : member.score >= 30
    ? '#ea580c'
    : '#ef4444';

  return (
    <>
      <tr
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`border-t border-gray-200 cursor-pointer transition-all duration-150 ${index % 2 === 0 ? 'bg-[#F8F9FA]' : 'bg-gray-100'} hover:bg-gray-50 hover:translate-x-0.5`}
      >
        <td className="px-4 py-2">
          <MemberLink
            mode="drawer"
            memberId={member.memberId}
            className={`font-semibold transition-colors duration-100 ${hovered ? 'text-brand-500 underline decoration-brand-500/50' : 'text-[#1a1a2e]'}`}
          >
            {member.name}
          </MemberLink>
        </td>
        <td className="px-4 py-2">
          <span className="font-mono font-bold" style={{ color: healthColor }}>
            {member.score}
          </span>
        </td>
        <td className="px-4 py-2">
          <span className="text-xs font-semibold" style={{ color: healthColor }}>
            {healthLevel}
          </span>
        </td>
        <td className="px-4 py-2">
          <ArchetypeBadge archetype={member.archetype} size="xs" />
        </td>
        <td className="px-4 py-2">
          <span className="text-xs text-gray-500">
            {member.tier}
          </span>
        </td>
        <td className="px-4 py-2">
          <span className="font-mono text-xs text-gray-500">
            ${(member.memberValueAnnual || 0).toLocaleString()}
          </span>
        </td>
        <td className="px-4 py-2 text-right">
          <span
            className={`text-sm font-semibold inline-block transition-all duration-150 ${isExpanded ? 'text-brand-500 rotate-90' : 'text-gray-400 rotate-0'}`}
          >
            ›
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-100">
          <td colSpan={7} className="p-4">
            <div className="flex flex-col gap-4">
              {/* Member Details */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Last Seen
                  </div>
                  <div className="text-sm text-[#1a1a2e]">
                    {member.lastSeenLocation || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Member Since
                  </div>
                  <div className="text-sm text-[#1a1a2e]">
                    {new Date(member.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Annual Dues
                  </div>
                  <div className="text-sm text-[#1a1a2e] font-mono">
                    ${member.duesAnnual.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Health Trend
                  </div>
                  <div className="flex gap-0.5 items-center">
                    {member.trend?.slice(-7).map((score, i) => (
                      <div
                        key={i}
                        className="w-2 rounded-sm"
                        style={{
                          height: `${Math.max(4, score / 2)}px`,
                          background: score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : score >= 30 ? '#ea580c' : '#ef4444',
                          opacity: 0.4 + (i * 0.1),
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Risk Signal */}
              {member.topRisk && member.topRisk !== 'No current risks' && (
                <div className="p-2 bg-amber-500/10 rounded-lg border-l-[3px] border-l-amber-500">
                  <div className="text-xs text-gray-400 mb-1">
                    Primary Risk Signal:
                  </div>
                  <div className="text-sm text-[#1a1a2e]">
                    {member.topRisk}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <QuickActions
                memberName={member.name}
                memberId={member.memberId}
                context={member.topRisk}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const PAGE_SIZE = 25;

const ACTIVITY_FILTERS = [
  { key: null, label: 'All' },
  { key: 'active', label: 'Active (30d)' },
  { key: 'inactive', label: 'Inactive (30-60d)' },
  { key: 'dormant', label: 'Dormant (60d+)' },
];

export default function AllMembersView({ initialArchetype = null }) {
  const allMembers = useMemo(() => {
    const members = isAuthenticatedClub() ? getMemberRoster() : generateRoster();
    if (!isAuthenticatedClub()) setRosterCache(members);
    return members;
  }, []);

  if (isAuthenticatedClub() && allMembers.length === 0) {
    return <DataEmptyState icon="👥" title="No members imported yet" description="Import your member roster to see health scores, archetypes, and engagement data for every member." dataType="members" />;
  }

  const [expandedMember, setExpandedMember] = useState(null);
  const [healthFilter, setHealthFilter] = useState(null);
  const [archetypeFilter, setArchetypeFilter] = useState(initialArchetype);
  const [activityFilter, setActivityFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync with parent archetype chip selection
  useEffect(() => {
    setArchetypeFilter(initialArchetype);
    setPage(0);
  }, [initialArchetype]);
  const [page, setPage] = useState(0);
  const [sortColumn, setSortColumn] = useState('score');
  const [sortDir, setSortDir] = useState('asc');

  // Filter members based on selected filters
  const filteredMembers = useMemo(() => {
    let filtered = [...allMembers];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(m => m.name.toLowerCase().includes(q));
    }

    if (healthFilter) {
      const { min, max } = healthFilter;
      filtered = filtered.filter(m => {
        if (max) return m.score >= min && m.score < max;
        return m.score >= min;
      });
    }

    if (archetypeFilter) {
      filtered = filtered.filter(m => m.archetype === archetypeFilter);
    }

    if (activityFilter) {
      filtered = filtered.filter(m => {
        if (activityFilter === 'active') return m.score >= 50;
        if (activityFilter === 'inactive') return m.score >= 25 && m.score < 50;
        if (activityFilter === 'dormant') return m.score < 25;
        return true;
      });
    }

    return filtered;
  }, [allMembers, healthFilter, archetypeFilter, activityFilter, searchTerm]);

  // Reactive health distribution — updates when any filter changes
  const filteredHealthDist = useMemo(() => {
    const counts = { Healthy: 0, Watch: 0, 'At Risk': 0, Critical: 0 };
    filteredMembers.forEach(m => {
      const s = m.score ?? 0;
      if (s >= 70) counts.Healthy++;
      else if (s >= 50) counts.Watch++;
      else if (s >= 30) counts['At Risk']++;
      else counts.Critical++;
    });
    const total = filteredMembers.length || 1;
    return [
      { level: 'Healthy', count: counts.Healthy, percentage: counts.Healthy / total, color: '#22c55e', min: 70 },
      { level: 'Watch', count: counts.Watch, percentage: counts.Watch / total, color: '#f59e0b', min: 50 },
      { level: 'At Risk', count: counts['At Risk'], percentage: counts['At Risk'] / total, color: '#ea580c', min: 30 },
      { level: 'Critical', count: counts.Critical, percentage: counts.Critical / total, color: '#ef4444', min: 0 },
    ];
  }, [filteredMembers]);

  // Sort filtered members
  const sortedMembers = useMemo(() => {
    const mapKey = {
      name: (m) => m.name.toLowerCase(),
      score: (m) => m.score,
      level: (m) => m.score,
      archetype: (m) => m.archetype.toLowerCase(),
      tier: (m) => m.tier.toLowerCase(),
      value: (m) => m.memberValueAnnual || 0,
    };
    const getter = mapKey[sortColumn] ?? mapKey.score;
    return [...filteredMembers].sort((a, b) => {
      const valA = getter(a);
      const valB = getter(b);
      if (valA === valB) return 0;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return sortDir === 'asc' ? -1 : 1;
    });
  }, [filteredMembers, sortColumn, sortDir]);

  const toggleSort = (column) => {
    if (sortColumn === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDir('asc');
    }
  };

  // Reset page when filters change
  const applyHealthFilter = (level) => {
    handleHealthClick(level);
    setPage(0);
  };

  const clearFilters = () => {
    setHealthFilter(null);
    setActiveHealthLevel(null);
    setArchetypeFilter(null);
    setActivityFilter(null);
    setPage(0);
  };

  const [activeHealthLevel, setActiveHealthLevel] = useState(null);

  const handleHealthClick = (level) => {
    const ranges = {
      'Healthy': { min: 70, max: null },
      'Watch': { min: 50, max: 70 },
      'At Risk': { min: 30, max: 50 },
      'Critical': { min: 0, max: 30 },
    };
    // Toggle: clicking active filter clears it
    if (activeHealthLevel === level) {
      setHealthFilter(null);
      setActiveHealthLevel(null);
    } else {
      setHealthFilter(ranges[level]);
      setActiveHealthLevel(level);
    }
  };

  const columns = [
    { key: 'name', label: 'Member' },
    { key: 'score', label: 'Score' },
    { key: 'level', label: 'Level' },
    { key: 'archetype', label: 'Archetype' },
    { key: 'tier', label: 'Tier' },
    { key: 'value', label: 'Annual Value' },
    { key: 'expand', label: '', sortable: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Health Distribution Cards - Clickable */}
      <div>
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
          Filter by Health Level (click to filter)
        </div>
        <div className="grid-responsive-4">
          {filteredHealthDist.map((d) => {
            const isActive = activeHealthLevel === d.level;
            return (
              <div
                key={d.level}
                onClick={() => applyHealthFilter(d.level)}
                className={`bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 ${isActive ? 'shadow-theme-md scale-[1.02]' : 'shadow-theme-xs scale-100 hover:scale-[1.02] hover:shadow-theme-md'}`}
                style={{ border: `2px solid ${isActive ? d.color : d.color + '40'}` }}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">
                    {d.level}
                  </span>
                  <span className="text-xs" style={{ color: d.color }}>
                    {(d.percentage * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-[28px] font-mono font-bold" style={{ color: d.color }}>
                  {d.count}
                </div>
                <div className="text-xs text-gray-400">members</div>
                <div className="h-1 bg-gray-200 rounded-sm mt-2">
                  <div className="h-full rounded-sm" style={{ background: d.color, width: `${d.percentage * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Archetype Filter - Clickable */}
      <div>
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
          Filter by Archetype (click to filter)
        </div>
        <div className="flex flex-wrap gap-2">
          {memberArchetypes.map((arch) => {
            const isActive = archetypeFilter === arch.archetype;
            return (
              <div
                key={arch.archetype}
                onClick={() => setArchetypeFilter(isActive ? null : arch.archetype)}
                className={`cursor-pointer transition-all duration-200 ${isActive ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
              >
                <ArchetypeBadge archetype={arch.archetype} size="md" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Filter */}
      <div>
        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
          Filter by Last Activity
        </div>
        <div className="flex gap-2 flex-wrap">
          {ACTIVITY_FILTERS.map((f) => {
            const isActive = activityFilter === f.key;
            return (
              <button
                key={f.key ?? 'all'}
                onClick={() => { setActivityFilter(isActive ? null : f.key); setPage(0); }}
                className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-xl cursor-pointer transition-all duration-150 ${isActive ? 'border border-brand-500 bg-brand-500/10 text-brand-500' : 'border border-gray-200 bg-gray-50 text-gray-500'}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filters */}
      {(healthFilter || archetypeFilter || activityFilter) && (
        <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            Active Filters:
          </span>
          {healthFilter && (
            <FilterChip
              label={`Health: ${healthFilter.max ? `${healthFilter.min}-${healthFilter.max}` : `${healthFilter.min}+`}`}
              onRemove={() => setHealthFilter(null)}
              color={'#ff8b00'}
            />
          )}
          {archetypeFilter && (
            <FilterChip
              label={`Archetype: ${archetypeFilter}`}
              onRemove={() => setArchetypeFilter(null)}
              color={'#ff8b00'}
            />
          )}
          {activityFilter && (
            <FilterChip
              label={`Activity: ${ACTIVITY_FILTERS.find(f => f.key === activityFilter)?.label || activityFilter}`}
              onRemove={() => { setActivityFilter(null); setPage(0); }}
              color={'#2563eb'}
            />
          )}
          <button
            onClick={clearFilters}
            className="ml-auto px-3 py-1 text-xs text-gray-400 bg-transparent border border-gray-200 rounded-lg cursor-pointer uppercase tracking-wider"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Member List Table */}
      <div className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
              All Members
            </span>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
              className="px-3 py-1.5 text-xs font-sans bg-gray-100 border border-gray-200 rounded-lg text-[#1a1a2e] outline-none min-w-[180px]"
            />
          </div>
          <span className="text-xs text-gray-400">
            Showing {Math.min(page * PAGE_SIZE + 1, sortedMembers.length)}–{Math.min((page + 1) * PAGE_SIZE, sortedMembers.length)} of {sortedMembers.length} members{searchTerm && ` matching "${searchTerm}"`}
          </span>
        </div>
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full min-w-[900px] border-collapse text-sm member-table">
            <thead>
              <tr className="bg-gray-50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-2 text-xs text-gray-400 uppercase tracking-wider font-medium ${col.key === 'expand' ? 'text-right' : 'text-left'}`}
                  >
                    {col.sortable === false ? (
                      <span>{col.label}</span>
                    ) : (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className="bg-transparent border-none text-inherit font-inherit cursor-pointer inline-flex items-center gap-1"
                      >
                        {col.label}
                        {sortColumn === col.key && (
                          <span className="text-[11px]">
                            {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
                          </span>
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    No members match the current filters
                  </td>
                </tr>
              ) : (
                sortedMembers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((member, index) => (
                  <MemberRow
                    key={member.memberId}
                    member={member}
                    index={index}
                    isExpanded={expandedMember === member.memberId}
                    onToggle={() => setExpandedMember(expandedMember === member.memberId ? null : member.memberId)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {sortedMembers.length > PAGE_SIZE && (() => {
          const totalPages = Math.ceil(sortedMembers.length / PAGE_SIZE);
          return (
            <div className="flex justify-between items-center px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className={`px-3.5 py-1.5 text-[13px] font-semibold border border-gray-200 rounded-lg cursor-pointer ${page === 0 ? 'bg-gray-100 text-gray-400 opacity-50 cursor-default' : 'bg-white text-[#1a1a2e]'}`}
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className={`px-3.5 py-1.5 text-[13px] font-semibold border border-gray-200 rounded-lg cursor-pointer ${page >= totalPages - 1 ? 'bg-gray-100 text-gray-400 opacity-50 cursor-default' : 'bg-white text-[#1a1a2e]'}`}
              >
                Next
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
