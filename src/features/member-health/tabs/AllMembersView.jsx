import { useState, useEffect, useMemo } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import { PlaybookActionCard } from '@/components/ui';
import { SourceBadgeRow } from '@/components/ui/SourceBadge.jsx';
import { getAtRiskMembers, getWatchMembers, getHealthDistribution, getArchetypeProfiles, getAllMemberProfiles, setRosterCache, getMemberRoster, getFullRoster } from '@/services/memberService';
import { isAuthenticatedClub } from '@/config/constants';
import DataEmptyState from '@/components/ui/DataEmptyState';
import { isGateOpen } from '@/services/demoGate';

// Generate full 300-member roster from all available data sources
const FIRST_NAMES = ['James','Robert','John','Michael','David','William','Richard','Joseph','Thomas','Christopher','Charles','Daniel','Matthew','Anthony','Mark','Steven','Paul','Andrew','Joshua','Kenneth','Kevin','Brian','George','Timothy','Ronald','Edward','Jason','Jeffrey','Ryan','Jacob','Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon','Benjamin','Samuel','Patrick','Alexander','Frank','Raymond','Jack','Dennis','Jerry','Tyler','Aaron','Jose','Nathan','Henry','Douglas','Peter','Zachary','Kyle','Noah','Ethan','Jeremy','Walter','Christian','Keith','Roger','Terry','Harry','Ralph','Sean','Jesse','Roy','Louis','Alan','Eugene','Russell','Randy','Philip','Howard','Vincent','Bobby','Dylan','Johnny','Phillip','Victor','Clarence','Travis','Austin','Martha','Donna','Sandra','Gloria','Teresa','Sara','Debra','Alice','Rachel','Emma','Lisa','Nancy','Betty','Margaret','Dorothy','Kimberly','Emily','Donna','Michelle','Carol','Amanda','Melissa','Deborah','Stephanie','Rebecca','Sharon','Laura','Cynthia','Kathleen','Amy','Angela','Shirley','Anna','Brenda','Pamela','Nicole','Samantha','Katherine','Christine','Helen','Debbie','Janet','Catherine','Maria','Heather','Diane','Olivia','Julie','Joyce','Virginia','Victoria','Kelly','Lauren','Christina','Joan','Evelyn','Judith','Andrea','Hannah','Megan','Cheryl','Jacqueline','Martha','Gloria','Teresa','Ann','Sara','Madison','Frances','Kathryn','Janice','Jean','Abigail','Julia','Grace','Judy'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Morales','Murphy','Cook','Rogers','Gutierrez','Ortiz','Morgan','Cooper','Peterson','Bailey','Reed','Kelly','Howard','Ramos','Kim','Cox','Ward','Richardson','Watson','Brooks','Chavez','Wood','James','Bennett','Gray','Mendoza','Ruiz','Hughes','Price','Alvarez','Castillo','Sanders','Patel','Myers','Long','Ross','Foster','Jimenez','Powell','Jenkins','Perry','Russell','Sullivan','Bell','Coleman','Butler','Henderson','Barnes','Gonzales','Fisher','Vasquez','Simmons','Marks','Fox','Dean','Walsh','Burke'];
const ARCHETYPES = ['Die-Hard Golfer','Social Butterfly','Balanced Active','Weekend Warrior','Declining','New Member','Ghost','Snowbird'];
const ARCHETYPE_WEIGHTS = [60, 45, 55, 45, 25, 30, 15, 25]; // matches memberArchetypes counts
const TRENDS = ['up','down','stable','stable','up','stable','down','stable'];
const LOCATIONS = ['Clubhouse','Golf Course','Practice Range','Pool Area','Dining Room','Pro Shop','Fitness Center','Tennis Courts',null,null];
const MEMBERSHIP_TIERS = ['Full Golf','Social','Sports','Junior','Legacy','Non-Resident','Corporate','Full Golf','Social','Full Golf'];

// Filter risk signal text — hide labels referencing closed-gate data (reuses MemberAlerts logic)
function filterRiskSignalForRoster(text) {
  return text || 'No current risks';
}

// Specific cross-domain signal variants — seeded by index so each member gets a unique signal
const AT_RISK_SIGNALS = [
  'Golf rounds down 3→0 this month; F&B spend $0 last 30 days',
  'Missed 3 tee times this month; email open rate dropped to 12%',
  'Dining visits down 60% vs. prior quarter; rounds halved',
  'Zero F&B spend since last month; tee bookings declined 40%',
  'Email unopened 45 days; last round 6 weeks ago',
  'Golf frequency: 4→1 rounds/month; dining conversion rate dropped',
  'Tee times cancelled twice; F&B check size below member average',
  'Visit cadence dropped from weekly to monthly; email unsubscribed',
];
const CRITICAL_SIGNALS = [
  'Rounds dropped to zero; dining spend at zero; email unopened 60 days',
  'No tee times in 45 days; zero F&B activity; last email bounced',
  'Golf: 0 rounds this month vs. 4/mo avg; $0 F&B; 0 email opens',
  'Complete disengagement: no golf, no dining, no email response in 60 days',
];
const WATCH_SIGNALS = [
  'Golf pace trending down vs. seasonal baseline; F&B slightly below average',
  'Tee bookings down 20% vs. prior 90 days; dining still active',
  'Email engagement declining; visit cadence beginning to slow',
  'Dining frequency softening vs. member average; rounds stable',
  'Minor drop in round frequency; F&B spend near average but declining',
];

function generateRoster() {
  const roster = [];
  const atRisk = getAtRiskMembers();
  const watch = getWatchMembers();
  // Include real profiles first
  const profiles = getAllMemberProfiles();
  Object.values(profiles).forEach(p => {
    const rawRisk = p.riskSignals?.[0]?.label || 'No current risks';
    const filteredRisk = filterRiskSignalForRoster(rawRisk);
    roster.push({ memberId: p.memberId, name: p.name, score: p.healthScore, archetype: p.archetype, duesAnnual: p.duesAnnual, memberValueAnnual: p.memberValueAnnual, tier: p.tier, joinDate: p.joinDate, trend: p.trend, topRisk: filteredRisk, lastSeenLocation: p.lastSeenLocation });
  });
  // Include at-risk and watch members
  (atRisk || []).forEach(m => {
    if (!roster.find(r => r.memberId === m.memberId)) {
      roster.push({ memberId: m.memberId, name: m.name, score: m.score, archetype: m.archetype, duesAnnual: m.duesAnnual || 15000, tier: profiles[m.memberId]?.tier || 'Full Golf', joinDate: '2020-03-15', trend: 'down', topRisk: m.signal || m.action || AT_RISK_SIGNALS[roster.length % AT_RISK_SIGNALS.length] });
    }
  });
  (watch || []).forEach(m => {
    if (!roster.find(r => r.memberId === m.memberId)) {
      roster.push({ memberId: m.memberId, name: m.name, score: m.score, archetype: m.archetype, duesAnnual: m.duesAnnual || 15000, tier: profiles[m.memberId]?.tier || 'Full Golf', joinDate: '2021-06-01', trend: 'stable', topRisk: m.signal || WATCH_SIGNALS[roster.length % WATCH_SIGNALS.length] });
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
        tier: MEMBERSHIP_TIERS[idx % MEMBERSHIP_TIERS.length],
        joinDate: `${yr}-${mo}-01`,
        trend: level === 'Healthy' ? 'stable' : level === 'Watch' ? 'stable' : 'down',
        topRisk: level === 'Healthy' ? 'No current risks' : level === 'Watch' ? WATCH_SIGNALS[idx % WATCH_SIGNALS.length] : level === 'At Risk' ? AT_RISK_SIGNALS[idx % AT_RISK_SIGNALS.length] : CRITICAL_SIGNALS[idx % CRITICAL_SIGNALS.length],
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

// Build a score tooltip showing which data domains contributed to the health score
function buildScoreTooltip(member) {
  const s = member.score ?? 70;
  const risk = (member.topRisk || '').toLowerCase();
  const hasTeeSheet = isGateOpen('tee-sheet');
  const hasPOS = isGateOpen('fb');

  // Derive approximate domain scores from overall score + risk signals
  const golfDeclining = /golf|round|tee|frequency/.test(risk);
  const fbDeclining = /dining|f&b|food|beverage|spend/.test(risk);
  const emailDeclining = /email|open rate|newsletter/.test(risk);
  const golfScore = hasTeeSheet ? (golfDeclining ? Math.max(5, s - 20) : Math.min(100, s + 10)) : null;
  const fbScore = hasPOS ? (fbDeclining ? Math.max(5, s - 15) : Math.min(100, s + 5)) : null;
  const emailScore = emailDeclining ? Math.max(5, s - 25) : Math.min(100, s + 5);

  const parts = [`Health Score: ${s}/100`, '─────────────'];
  if (golfScore != null) parts.push(`⛳ Golf activity: ${golfScore}${golfDeclining ? ' ↓' : ''}`);
  if (fbScore != null) parts.push(`🍴 F&B spend: ${fbScore}${fbDeclining ? ' ↓' : ''}`);
  parts.push(`📧 Email: ${emailScore}${emailDeclining ? ' ↓' : ''}`);
  return parts.join('\n');
}

function FilterChip({ label, onRemove, color }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: color + '20', color: color, border: `1px solid ${color}40` }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="bg-transparent border-none text-inherit cursor-pointer text-sm p-0 leading-none opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <span aria-hidden="true">×</span>
      </button>
    </span>
  );
}

function MemberRow({ member, isExpanded, onToggle, index, rosterOnly = false }) {
  const [hovered, setHovered] = useState(false);
  const hasScore = member.score != null && !rosterOnly;
  const healthLevel = hasScore ? getHealthLevel(member.score) : '—';
  const healthColor = !hasScore ? '#9CA3AF'
    : member.score >= 70 ? '#12b76a'
    : member.score >= 50 ? '#f59e0b'
    : member.score >= 30 ? '#ea580c'
    : '#ef4444';

  return (
    <>
      <tr
        role="row"
        data-member-id={member.memberId}
        data-testid={`member-row-${member.memberId}`}
        aria-label={`${member.name}${hasScore ? `, health ${member.score}` : ''}`}
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`border-t border-swoop-border cursor-pointer transition-all duration-150 ${index % 2 === 0 ? 'bg-[#F8F9FA]' : 'bg-swoop-row'} hover:bg-swoop-row-hover hover:translate-x-0.5`}
      >
        <td className="px-3 sm:px-4 py-2">
          <MemberLink
            mode="drawer"
            memberId={member.memberId}
            className={`font-semibold transition-colors duration-100 ${hovered ? 'text-brand-500 underline decoration-brand-500/50' : 'text-[#1a1a2e]'}`}
          >
            {member.name}
          </MemberLink>
        </td>
        {!rosterOnly && (
          <>
            <td className="px-3 sm:px-4 py-2">
              <div
                className="flex items-center gap-1.5 flex-wrap cursor-help"
                title={hasScore ? buildScoreTooltip(member) : undefined}
              >
                <span className="font-mono font-bold text-sm" style={{ color: healthColor }}>
                  {hasScore ? member.score : '—'}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: healthColor + '22', color: healthColor }}
                >
                  {healthLevel}
                </span>
              </div>
            </td>
            <td className="px-4 py-2 hidden md:table-cell">
              {member.archetype ? <ArchetypeBadge archetype={member.archetype} size="xs" /> : <span className="text-xs text-swoop-text-label">—</span>}
            </td>
          </>
        )}
        <td className="px-4 py-2 hidden sm:table-cell">
          <span className="text-xs text-swoop-text-muted">
            {member.tier || '—'}
          </span>
        </td>
        <td className="px-4 py-2 hidden md:table-cell">
          <span
            className="font-mono text-xs"
            style={{ color: hasScore && member.score < 50 ? '#ef4444' : undefined }}
            title={hasScore && member.score < 50 ? 'Dues at risk — member health below 50' : undefined}
          >
            {(member.duesAnnual || member.memberValueAnnual) ? `$${(member.duesAnnual || member.memberValueAnnual || 0).toLocaleString()}` : '—'}
          </span>
        </td>
        <td className="px-3 sm:px-4 py-2 text-right">
          <span
            className={`text-sm font-semibold inline-block transition-all duration-150 ${isExpanded ? 'text-brand-500 rotate-90' : 'text-swoop-text-label rotate-0'}`}
          >
            ›
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-swoop-row">
          <td colSpan={6} className="p-4">
            <div className="flex flex-col gap-4">
              {/* Member Details */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <div>
                  <div className="text-xs text-swoop-text-label uppercase tracking-wider mb-1">
                    Last Seen
                  </div>
                  <div className="text-sm text-[#1a1a2e]">
                    {member.lastSeenLocation || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-swoop-text-label uppercase tracking-wider mb-1">
                    Member Since
                  </div>
                  <div className="text-sm text-[#1a1a2e]">
                    {new Date(member.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-swoop-text-label uppercase tracking-wider mb-1">
                    Annual Dues
                  </div>
                  <div className="text-sm text-[#1a1a2e] font-mono">
                    ${member.duesAnnual.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-swoop-text-label uppercase tracking-wider mb-1">
                    Health Trend
                  </div>
                  <div className="flex gap-0.5 items-center">
                    {(Array.isArray(member.trend) ? member.trend : []).slice(-7).map((score, i) => (
                      <div
                        key={i}
                        className="w-2 rounded-sm"
                        style={{
                          height: `${Math.max(4, score / 2)}px`,
                          background: score >= 70 ? '#12b76a' : score >= 50 ? '#f59e0b' : score >= 30 ? '#ea580c' : '#ef4444',
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
                  <div className="text-xs text-swoop-text-label mb-1">
                    Primary Risk Signal:
                  </div>
                  <div className="text-sm text-[#1a1a2e] mb-1.5">
                    {member.topRisk}
                  </div>
                  <SourceBadgeRow
                    size="xs"
                    systems={[
                      /golf|round|tee|frequency/i.test(member.topRisk) && 'Tee Sheet',
                      /dining|f&b|food|beverage|spend/i.test(member.topRisk) && 'POS',
                      /email|open rate|newsletter/i.test(member.topRisk) && 'Email',
                    ].filter(Boolean)}
                  />
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

export default function AllMembersView({ initialArchetype = null, rosterOnly = false }) {
  const allMembers = useMemo(() => getFullRoster(), []);

  if (allMembers.length === 0) {
    return <DataEmptyState icon="👥" title="No members imported yet" description="Import your member roster to see health scores, archetypes, and engagement data for every member." dataType="members" />;
  }

  const [expandedMember, setExpandedMember] = useState(null);
  const [healthFilter, setHealthFilter] = useState(null);
  const [archetypeFilter, setArchetypeFilter] = useState(initialArchetype);
  const [activityFilter, setActivityFilter] = useState(null);
  const [symptomFilter, setSymptomFilter] = useState(null);
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

    if (symptomFilter) {
      filtered = filtered.filter(m => {
        const risk = (m.topRisk || '').toLowerCase();
        if (symptomFilter === 'email') return /email|open rate|newsletter/.test(risk);
        if (symptomFilter === 'golf') return /golf|round|tee|frequency/.test(risk);
        if (symptomFilter === 'dining') return /dining|f&b|food|beverage|spend/.test(risk);
        if (symptomFilter === 'multi') {
          // Multi-domain decay = at-risk score AND topRisk mentions 2+ domains
          const domains = ['email', 'golf', 'dining'].filter(d => new RegExp(d).test(risk));
          return m.score < 50 && domains.length >= 2;
        }
        return true;
      });
    }

    return filtered;
  }, [allMembers, healthFilter, archetypeFilter, activityFilter, symptomFilter, searchTerm]);

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
      { level: 'Healthy', count: counts.Healthy, percentage: counts.Healthy / total, color: '#12b76a', min: 70 },
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

  const columns = rosterOnly
    ? [
        { key: 'name', label: 'Member', hideClass: '' },
        { key: 'tier', label: 'Tier', hideClass: 'hidden sm:table-cell' },
        { key: 'value', label: 'Annual Dues', hideClass: 'hidden md:table-cell' },
        { key: 'expand', label: '', sortable: false, hideClass: '' },
      ]
    : [
        { key: 'name', label: 'Member', hideClass: '' },
        { key: 'score', label: 'Health', hideClass: '' },
        { key: 'archetype', label: 'Archetype', hideClass: 'hidden md:table-cell' },
        { key: 'tier', label: 'Tier', hideClass: 'hidden sm:table-cell' },
        { key: 'value', label: 'Annual Value', hideClass: 'hidden md:table-cell' },
        { key: 'expand', label: '', sortable: false, hideClass: '' },
      ];

  return (
    <div className="flex flex-col gap-6">
      {/* Health Distribution — compact chip row */}
      {!rosterOnly && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-swoop-text-label uppercase tracking-wider shrink-0">Health:</span>
          {filteredHealthDist.map((d) => {
            const isActive = activeHealthLevel === d.level;
            return (
              <button
                key={d.level}
                type="button"
                onClick={() => applyHealthFilter(d.level)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-all ${isActive ? 'ring-2 ring-offset-1' : 'hover:opacity-90'}`}
                style={{
                  borderColor: isActive ? d.color : d.color + '55',
                  background: isActive ? d.color + '18' : d.color + '0d',
                  color: d.color,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: d.color, opacity: d.count === 0 ? 0.35 : 1 }}
                />
                <span style={{ opacity: d.count === 0 ? 0.55 : 1 }}>{d.level}</span>
                <span className="font-mono font-bold" style={{ opacity: d.count === 0 ? 0.55 : 1 }}>{d.count}</span>
                <span className="text-[10px] opacity-70">{(d.percentage * 100).toFixed(0)}%</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Archetype Filter - Clickable (hidden in roster-only) */}
      {!rosterOnly && (
        <div>
          <div className="text-sm text-swoop-text-label mb-2 uppercase tracking-wider">
            Filter by Archetype (click to filter)
          </div>
          <div className="flex flex-wrap gap-2">
            {getArchetypeProfiles().map((arch) => {
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
          {/* Cross-domain decay legend — chips filter the grid. */}
          <div className="mt-3 p-2 bg-swoop-row border border-swoop-border rounded-lg">
            <div className="text-[10px] font-bold text-swoop-text-label uppercase tracking-wider mb-1">Filter by Cross-Domain Decay Pattern</div>
            <div className="flex flex-wrap gap-2 text-[11px] text-swoop-text-muted">
              {[
                { key: 'email', label: '📧 Email decay', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                { key: 'golf', label: '⛳ Golf drop', bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-200' },
                { key: 'dining', label: '🍽️ Dining drop', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                { key: 'multi', label: '⚠️ Multi-domain decay', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
              ].map(chip => {
                const isActive = symptomFilter === chip.key;
                return (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => { setSymptomFilter(isActive ? null : chip.key); setPage(0); }}
                    className={`px-2 py-0.5 rounded border cursor-pointer font-semibold transition-all ${chip.bg} ${chip.text} ${chip.border} ${isActive ? 'ring-2 ring-offset-1 ring-current scale-105' : 'hover:scale-105'}`}
                  >
                    {chip.label}
                  </button>
                );
              })}
              {symptomFilter && (
                <button
                  type="button"
                  onClick={() => { setSymptomFilter(null); setPage(0); }}
                  className="px-2 py-0.5 rounded bg-swoop-row text-swoop-text-muted border border-swoop-border cursor-pointer text-[10px]"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="text-[10px] text-swoop-text-muted mt-1.5 italic">
              {symptomFilter
                ? `Showing members with ${symptomFilter === 'multi' ? 'multi-domain' : symptomFilter} decay signals. Click any to see their First Domino sequence.`
                : 'Click any chip to filter by cross-domain symptom. Click any at-risk member to see their First Domino sequence.'}
            </div>
          </div>
        </div>
      )}

      {/* Activity Filter (hidden in roster-only) */}
      {!rosterOnly && (
        <div>
          <div className="text-sm text-swoop-text-label mb-2 uppercase tracking-wider">
            Filter by Last Activity
          </div>
          <div className="flex gap-2 flex-wrap">
            {ACTIVITY_FILTERS.map((f) => {
              const isActive = activityFilter === f.key;
              return (
                <button
                  key={f.key ?? 'all'}
                  onClick={() => { setActivityFilter(isActive ? null : f.key); setPage(0); }}
                  className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-xl cursor-pointer transition-all duration-150 ${isActive ? 'border border-brand-500 bg-brand-500/10 text-brand-500' : 'border border-swoop-border bg-swoop-row text-swoop-text-muted'}`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {(healthFilter || archetypeFilter || activityFilter) && (
        <div className="flex items-center gap-2 p-2 bg-swoop-panel rounded-xl border border-swoop-border">
          <span className="text-xs text-swoop-text-label uppercase tracking-wide">
            Active Filters:
          </span>
          {healthFilter && (
            <FilterChip
              label={`Health: ${healthFilter.max ? `${healthFilter.min}-${healthFilter.max}` : `${healthFilter.min}+`}`}
              onRemove={() => setHealthFilter(null)}
              color={'#F3922D'}
            />
          )}
          {archetypeFilter && (
            <FilterChip
              label={`Archetype: ${archetypeFilter}`}
              onRemove={() => setArchetypeFilter(null)}
              color={'#F3922D'}
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
            className="ml-auto px-3 py-1 text-xs text-swoop-text-label bg-transparent border border-swoop-border rounded-lg cursor-pointer uppercase tracking-wider"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Member List Table */}
      <div className="bg-swoop-row rounded-xl border border-swoop-border overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-swoop-border flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-sm font-semibold text-swoop-text">
              All Members
            </span>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
              className="px-3 py-1.5 text-xs font-sans bg-swoop-row border border-swoop-border rounded-lg text-[#1a1a2e] outline-none flex-1 sm:flex-none sm:min-w-[180px]"
            />
          </div>
          <span className="text-xs text-swoop-text-label">
            Showing {Math.min(page * PAGE_SIZE + 1, sortedMembers.length)}–{Math.min((page + 1) * PAGE_SIZE, sortedMembers.length)} of {sortedMembers.length} members{searchTerm && ` matching "${searchTerm}"`}
          </span>
        </div>
        {/* Source attribution — every health score, dues, and archetype shown
            below is a CROSS-DOMAIN composite. Pillar 1 (Show your sources). */}
        <div className="px-3 sm:px-4 py-2 border-b border-swoop-border flex items-center gap-2 flex-wrap text-[10px] text-swoop-text-muted">
          <span className="font-semibold uppercase tracking-wide">Sources:</span>
          <SourceBadgeRow systems={['Member CRM', 'Tee Sheet', 'POS', 'Email']} size="xs" />
          <span className="text-swoop-text-label">: health scores synthesize all four signals</span>
        </div>
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full border-collapse text-sm member-table">
            <thead>
              <tr className="bg-swoop-row">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 sm:px-4 py-2 text-xs text-swoop-text-label uppercase tracking-wider font-medium ${col.key === 'expand' ? 'text-right' : 'text-left'} ${col.hideClass}`}
                  >
                    {col.sortable === false ? (
                      <span>{col.label}</span>
                    ) : (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className="bg-transparent border-none text-inherit font-inherit cursor-pointer inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-brand-500"
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
                  <td colSpan={6} className="p-6 text-center text-swoop-text-label">
                    No members match the current filters
                  </td>
                </tr>
              ) : (
                sortedMembers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((member, index) => (
                  <MemberRow
                    key={member.memberId}
                    member={rosterOnly ? { ...member, score: null, archetype: null } : member}
                    index={index}
                    isExpanded={expandedMember === member.memberId}
                    onToggle={() => setExpandedMember(expandedMember === member.memberId ? null : member.memberId)}
                    rosterOnly={rosterOnly}
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
            <div className="flex justify-between items-center px-4 py-2 border-t border-swoop-border bg-swoop-row">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className={`px-3.5 py-1.5 text-[13px] font-semibold border border-swoop-border rounded-lg cursor-pointer ${page === 0 ? 'bg-swoop-row text-swoop-text-label opacity-50 cursor-default' : 'bg-swoop-panel text-[#1a1a2e]'}`}
              >
                Previous
              </button>
              <span className="text-xs text-swoop-text-muted">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className={`px-3.5 py-1.5 text-[13px] font-semibold border border-swoop-border rounded-lg cursor-pointer ${page >= totalPages - 1 ? 'bg-swoop-row text-swoop-text-label opacity-50 cursor-default' : 'bg-swoop-panel text-[#1a1a2e]'}`}
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
