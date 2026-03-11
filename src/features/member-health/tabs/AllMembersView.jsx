import { useState, useMemo } from 'react';
import { theme } from '@/config/theme';
import MemberLink from '@/components/MemberLink.jsx';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import { memberProfiles, atRiskMembers, healthDistribution, memberArchetypes } from '@/data/members';

// Generate full member list from all available profiles
const allMembers = Object.values(memberProfiles).map(profile => ({
  memberId: profile.memberId,
  name: profile.name,
  score: profile.healthScore,
  archetype: profile.archetype,
  duesAnnual: profile.duesAnnual,
  memberValueAnnual: profile.memberValueAnnual,
  tier: profile.tier,
  joinDate: profile.joinDate,
  trend: profile.trend,
  topRisk: profile.riskSignals?.[0]?.label || 'No current risks',
  lastSeenLocation: profile.lastSeenLocation,
}));

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

function MemberRow({ member, isExpanded, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const healthLevel = getHealthLevel(member.score);
  const healthColor = member.score >= 70 
    ? theme.colors.success 
    : member.score >= 50 
    ? theme.colors.warning 
    : member.score >= 30 
    ? theme.colors.riskAtRiskAlt 
    : theme.colors.urgent;

  return (
    <>
      <tr
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderTop: `1px solid ${theme.colors.border}`,
          cursor: 'pointer',
          background: hovered ? theme.colors.bgCardHover : 'transparent',
          transition: 'background 0.12s ease',
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

export default function AllMembersView() {
  const [expandedMember, setExpandedMember] = useState(null);
  const [healthFilter, setHealthFilter] = useState(null);
  const [archetypeFilter, setArchetypeFilter] = useState(null);
  const [sortColumn, setSortColumn] = useState('score');
  const [sortDir, setSortDir] = useState('asc');

  // Filter members based on selected filters
  const filteredMembers = useMemo(() => {
    let filtered = [...allMembers];

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

    return filtered;
  }, [allMembers, healthFilter, archetypeFilter]);

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

  const clearFilters = () => {
    setHealthFilter(null);
    setArchetypeFilter(null);
  };

  const handleHealthClick = (level) => {
    const ranges = {
      'Healthy': { min: 70, max: null },
      'Watch': { min: 50, max: 70 },
      'At Risk': { min: 30, max: 50 },
      'Critical': { min: 0, max: 30 },
    };
    setHealthFilter(ranges[level]);
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
          {healthDistribution.map((d) => {
            const isActive = healthFilter?.min === d.min;
            return (
              <div
                key={d.level}
                onClick={() => handleHealthClick(d.level)}
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

      {/* Active Filters */}
      {(healthFilter || archetypeFilter) && (
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
          <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
            All Members
          </span>
          <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            Showing {sortedMembers.length} of {allMembers.length} members
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            minWidth: 900, 
            borderCollapse: 'collapse', 
            fontSize: theme.fontSize.sm,
          }}>
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
                sortedMembers.map((member) => (
                  <MemberRow
                    key={member.memberId}
                    member={member}
                    isExpanded={expandedMember === member.memberId}
                    onToggle={() => setExpandedMember(expandedMember === member.memberId ? null : member.memberId)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
