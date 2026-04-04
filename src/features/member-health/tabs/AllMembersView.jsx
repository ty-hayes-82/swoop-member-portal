import { useState, useEffect, useMemo } from 'react';
import { theme } from '@/config/theme';
import MemberLink from '@/components/MemberLink.jsx';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import { PlaybookActionCard } from '@/components/ui';
import { getAtRiskMembers, getWatchMembers, getHealthDistribution, getArchetypeProfiles, setRosterCache } from '@/services/memberService';
import { isAuthenticatedClub } from '@/config/constants';
import { memberProfiles } from '@/data/members';
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
  // Include real profiles first
  Object.values(memberProfiles).forEach(p => {
    roster.push({ memberId: p.memberId, name: p.name, score: p.healthScore, archetype: p.archetype, duesAnnual: p.duesAnnual, memberValueAnnual: p.memberValueAnnual, tier: p.tier, joinDate: p.joinDate, trend: p.trend, topRisk: p.riskSignals?.[0]?.label || 'No current risks', lastSeenLocation: p.lastSeenLocation });
  });
  // Include at-risk and watch members
  (atRiskMembers || []).forEach(m => {
    if (!roster.find(r => r.memberId === m.memberId)) {
      roster.push({ memberId: m.memberId, name: m.name, score: m.score, archetype: m.archetype, duesAnnual: m.duesAnnual || 15000, tier: m.score < 30 ? 'Critical' : 'At Risk', joinDate: '2020-03-15', trend: 'down', topRisk: m.signal || m.action || 'Engagement declining' });
    }
  });
  (watchMembers || []).forEach(m => {
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

const allMembers = isAuthenticatedClub() ? [] : generateRoster();
if (!isAuthenticatedClub()) setRosterCache(allMembers);

function getHealthLevel(score) {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
}

function FilterChip({ label, onRemove, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing.xs,
        padding: '4px 10px',
        borderRadius: theme.radius.full,
        fontSize: theme.fontSize.xs,
        fontWeight: 600,
        background: color + '20',
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: theme.fontSize.sm,
          padding: 0,
          lineHeight: 1,
          opacity: 0.7,
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
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
    ? theme.colors.success 
    : member.score >= 50 
    ? theme.colors.warning 
    : member.score >= 30 
    ? theme.colors.riskAtRiskAlt 
    : theme.colors.urgent;

  // DES-P05: Zebra striping with improved hover states
  const zebraBackground = index % 2 === 0 ? theme.colors.bg : theme.colors.bgDeep;
  const hoverBackground = hovered ? theme.colors.bgCardHover : zebraBackground;

  return (
    <>
      <tr
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderTop: `1px solid ${theme.colors.border}`,
          cursor: 'pointer',
          background: hoverBackground,
          transition: 'background 0.15s ease, transform 0.15s ease',
          transform: hovered ? 'translateX(2px)' : 'translateX(0)',
        }}
      >
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
          <MemberLink
            mode="drawer"
            memberId={member.memberId}
            style={{
              fontWeight: 600,
              color: hovered ? theme.colors.accent : theme.colors.textPrimary,
              textDecoration: hovered ? 'underline' : 'none',
              textDecorationColor: `${theme.colors.accent}50`,
              transition: 'color 0.12s ease',
            }}
          >
            {member.name}
          </MemberLink>
        </td>
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontWeight: 700,
              color: healthColor,
            }}
          >
            {member.score}
          </span>
        </td>
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
          <span
            style={{
              fontSize: theme.fontSize.xs,
              color: healthColor,
              fontWeight: 600,
            }}
          >
            {healthLevel}
          </span>
        </td>
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
          <ArchetypeBadge archetype={member.archetype} size="xs" />
        </td>
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
            {member.tier}
          </span>
        </td>
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}` }}>
          <span style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
            ${(member.memberValueAnnual || 0).toLocaleString()}
          </span>
        </td>
        <td style={{ padding: `${theme.spacing.sm} ${theme.spacing.md}`, textAlign: 'right' }}>
          <span
            style={{
              color: isExpanded ? theme.colors.accent : theme.colors.textMuted,
              fontSize: '14px',
              fontWeight: 600,
              transition: 'transform 0.15s ease, color 0.12s ease',
              display: 'inline-block',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            ›
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr style={{ background: theme.colors.bgDeep }}>
          <td colSpan={7} style={{ padding: theme.spacing.md }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {/* Member Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.md }}>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: theme.spacing.xs }}>
                    Last Seen
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
                    {member.lastSeenLocation || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: theme.spacing.xs }}>
                    Member Since
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
                    {new Date(member.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: theme.spacing.xs }}>
                    Annual Dues
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, fontFamily: theme.fonts.mono }}>
                    ${member.duesAnnual.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: theme.spacing.xs }}>
                    Health Trend
                  </div>
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    {member.trend?.slice(-7).map((score, i) => (
                      <div
                        key={i}
                        style={{
                          width: '8px',
                          height: `${Math.max(4, score / 2)}px`,
                          background: score >= 70 ? theme.colors.success : score >= 50 ? theme.colors.warning : score >= 30 ? theme.colors.riskAtRiskAlt : theme.colors.urgent,
                          borderRadius: '2px',
                          opacity: 0.4 + (i * 0.1),
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Risk Signal */}
              {member.topRisk && member.topRisk !== 'No current risks' && (
                <div style={{ 
                  padding: theme.spacing.sm, 
                  background: theme.colors.warning + '10', 
                  borderRadius: theme.radius.sm,
                  borderLeft: `3px solid ${theme.colors.warning}`,
                }}>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: theme.spacing.xs }}>
                    Primary Risk Signal:
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>
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
      // Simulate activity recency based on health score as proxy
      // (in prod, would use actual last_activity_date from backend)
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
      { level: 'Healthy', count: counts.Healthy, percentage: counts.Healthy / total, color: theme.colors.success, min: 70 },
      { level: 'Watch', count: counts.Watch, percentage: counts.Watch / total, color: theme.colors.warning, min: 50 },
      { level: 'At Risk', count: counts['At Risk'], percentage: counts['At Risk'] / total, color: theme.colors.riskAtRiskAlt || '#ea580c', min: 30 },
      { level: 'Critical', count: counts.Critical, percentage: counts.Critical / total, color: theme.colors.urgent, min: 0 },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Health Distribution Cards - Clickable */}
      <div>
        <div style={{ 
          fontSize: theme.fontSize.sm, 
          color: theme.colors.textMuted, 
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Filter by Health Level (click to filter)
        </div>
        <div className="grid-responsive-4">
          {filteredHealthDist.map((d) => {
            const isActive = activeHealthLevel === d.level;
            return (
              <div
                key={d.level}
                onClick={() => applyHealthFilter(d.level)}
                style={{
                  background: theme.colors.bgCard,
                  boxShadow: isActive ? theme.shadow.md : theme.shadow.sm,
                  borderRadius: theme.radius.md,
                  border: `2px solid ${isActive ? d.color : d.color + '40'}`,
                  padding: theme.spacing.md,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = theme.shadow.md;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = theme.shadow.sm;
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
                  <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {d.level}
                  </span>
                  <span style={{ fontSize: theme.fontSize.xs, color: d.color }}>
                    {(d.percentage * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono, fontWeight: 700, color: d.color }}>
                  {d.count}
                </div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>members</div>
                <div style={{ height: 4, background: theme.colors.border, borderRadius: 2, marginTop: theme.spacing.sm }}>
                  <div style={{ height: '100%', background: d.color, borderRadius: 2, width: `${d.percentage * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Archetype Filter - Clickable */}
      <div>
        <div style={{ 
          fontSize: theme.fontSize.sm, 
          color: theme.colors.textMuted, 
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Filter by Archetype (click to filter)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {memberArchetypes.map((arch) => {
            const isActive = archetypeFilter === arch.archetype;
            return (
              <div
                key={arch.archetype}
                onClick={() => setArchetypeFilter(isActive ? null : arch.archetype)}
                style={{
                  cursor: 'pointer',
                  opacity: isActive ? 1 : 0.7,
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = '0.7';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <ArchetypeBadge archetype={arch.archetype} size="md" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Filter */}
      <div>
        <div style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.textMuted,
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          Filter by Last Activity
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
          {ACTIVITY_FILTERS.map((f) => {
            const isActive = activityFilter === f.key;
            return (
              <button
                key={f.key ?? 'all'}
                onClick={() => { setActivityFilter(isActive ? null : f.key); setPage(0); }}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${isActive ? theme.colors.accent : theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  background: isActive ? `${theme.colors.accent}15` : theme.colors.bg,
                  color: isActive ? theme.colors.accent : theme.colors.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filters */}
      {(healthFilter || archetypeFilter || activityFilter) && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: theme.spacing.sm,
          padding: theme.spacing.sm,
          background: theme.colors.bgCard,
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.border}`,
        }}>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Active Filters:
          </span>
          {healthFilter && (
            <FilterChip
              label={`Health: ${healthFilter.max ? `${healthFilter.min}-${healthFilter.max}` : `${healthFilter.min}+`}`}
              onRemove={() => setHealthFilter(null)}
              color={theme.colors.members}
            />
          )}
          {archetypeFilter && (
            <FilterChip
              label={`Archetype: ${archetypeFilter}`}
              onRemove={() => setArchetypeFilter(null)}
              color={theme.colors.accent}
            />
          )}
          {activityFilter && (
            <FilterChip
              label={`Activity: ${ACTIVITY_FILTERS.find(f => f.key === activityFilter)?.label || activityFilter}`}
              onRemove={() => { setActivityFilter(null); setPage(0); }}
              color={theme.colors.info || '#2563eb'}
            />
          )}
          <button
            onClick={clearFilters}
            style={{
              marginLeft: 'auto',
              padding: '4px 12px',
              fontSize: theme.fontSize.xs,
              color: theme.colors.textMuted,
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Member List Table */}
      <div style={{ 
        background: theme.colors.bgDeep, 
        borderRadius: theme.radius.md, 
        border: `1px solid ${theme.colors.border}`,
        overflow: 'hidden',
      }}>
        <div style={{ 
          padding: theme.spacing.md, 
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
              All Members
            </span>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
              style={{
                padding: '6px 12px', fontSize: theme.fontSize.xs, fontFamily: theme.fonts.sans,
                background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm, color: theme.colors.textPrimary, outline: 'none',
                minWidth: 180,
              }}
            />
          </div>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            Showing {Math.min(page * PAGE_SIZE + 1, sortedMembers.length)}–{Math.min((page + 1) * PAGE_SIZE, sortedMembers.length)} of {sortedMembers.length} members{searchTerm && ` matching "${searchTerm}"`}
          </span>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ 
            width: '100%', 
            minWidth: 900, 
            borderCollapse: 'collapse', 
            fontSize: theme.fontSize.sm,
          }}
          className="member-table">
            <thead>
              <tr style={{ background: theme.colors.bg }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      textAlign: col.key === 'expand' ? 'right' : 'left',
                      color: theme.colors.textMuted,
                      fontSize: theme.fontSize.xs,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 500,
                    }}
                  >
                    {col.sortable === false ? (
                      <span>{col.label}</span>
                    ) : (
                      <button
                        onClick={() => toggleSort(col.key)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          font: 'inherit',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {col.label}
                        {sortColumn === col.key && (
                          <span style={{ fontSize: '11px' }}>
                            {sortDir === 'asc' ? '▲' : '▼'}
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
                  <td colSpan={7} style={{ padding: theme.spacing.lg, textAlign: 'center', color: theme.colors.textMuted }}>
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
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderTop: `1px solid ${theme.colors.border}`,
              background: theme.colors.bg,
            }}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 600,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  background: page === 0 ? theme.colors.bgDeep : theme.colors.bgCard,
                  color: page === 0 ? theme.colors.textMuted : theme.colors.textPrimary,
                  cursor: page === 0 ? 'default' : 'pointer',
                  opacity: page === 0 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 600,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  background: page >= totalPages - 1 ? theme.colors.bgDeep : theme.colors.bgCard,
                  color: page >= totalPages - 1 ? theme.colors.textMuted : theme.colors.textPrimary,
                  cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                  opacity: page >= totalPages - 1 ? 0.5 : 1,
                }}
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
