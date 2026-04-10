import { useState, useMemo } from 'react';
import { getAtRiskMembers, getMemberProfile, getFullRoster } from '@/services/memberService';
import { getTodayTeeSheet } from '@/services/operationsService';
import { DEMO_BRIEFING } from '@/services/briefingService';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import { useMobileNav } from '../context/MobileNavContext';

const MODE_OPTIONS = [
  { key: 'onPremise', label: 'On Premise Now' },
  { key: 'atRisk', label: 'At-Risk' },
  { key: 'all', label: 'All Members' },
];

/**
 * Build the "On Premise Now" roster by combining:
 *   1) getTodayTeeSheet() — real tee sheet rows for today
 *   2) DEMO_BRIEFING.todayRisks.atRiskTeetimes — 3 at-risk tee times with times
 *   3) A SYNTHESIZED lunch/dining reservation list pulled from full roster
 *      members whose archetype is dining-heavy (Social Butterfly / Balanced Active)
 *
 * TODO(dining-reservations): Replace the synthesized lunch set with a real
 * getDiningReservations() service once one exists. The tee-sheet half of this
 * function is already wired to live data and can stay as-is.
 *
 * Each returned member carries a `currentContext` string (e.g. "Tee time 9:20 AM ·
 * North course" or "Lunch reservation 12:30 · Grill Room") that the card renders
 * prominently when mode === 'onPremise'.
 */
function buildOnPremiseRoster() {
  const teeSheet = getTodayTeeSheet() || [];
  const atRiskTeetimes = DEMO_BRIEFING?.todayRisks?.atRiskTeetimes || [];
  const roster = getFullRoster() || [];
  const rosterById = new Map(roster.map(m => [m.memberId, m]));

  const out = new Map();

  // 1) Tee sheet rows — these already have memberId, name, time, course, healthScore, duesAnnual
  teeSheet.forEach(row => {
    if (!row.memberId) return;
    const rosterHit = rosterById.get(row.memberId);
    out.set(row.memberId, {
      memberId: row.memberId,
      name: row.name,
      archetype: row.archetype || rosterHit?.archetype || '—',
      score: row.healthScore ?? rosterHit?.score ?? 70,
      duesAnnual: row.duesAnnual ?? rosterHit?.duesAnnual ?? 0,
      topRisk: rosterHit?.topRisk || 'No current risks',
      lastSeenLocation: rosterHit?.lastSeenLocation,
      currentContext: `Tee time ${row.time} · ${row.course} course`,
      _onPremiseKind: 'tee',
    });
  });

  // 2) At-risk tee times from the daily briefing (may overlap with tee sheet)
  atRiskTeetimes.forEach(t => {
    if (out.has(t.memberId)) return; // already covered by tee sheet
    const rosterHit = rosterById.get(t.memberId);
    out.set(t.memberId, {
      memberId: t.memberId,
      name: t.name,
      archetype: rosterHit?.archetype || 'At-Risk',
      score: t.health ?? rosterHit?.score ?? 40,
      duesAnnual: rosterHit?.duesAnnual ?? 0,
      topRisk: rosterHit?.topRisk || 'At-risk tee time',
      lastSeenLocation: rosterHit?.lastSeenLocation,
      currentContext: `Tee time ${t.time} · tee sheet`,
      _onPremiseKind: 'tee',
    });
  });

  // 3) SYNTHESIZED lunch reservations — pick up to 6 dining-heavy roster members
  //    not already on premise via tee sheet. Assign staggered lunch slots.
  // TODO(dining-reservations): replace with real getDiningReservations() source.
  const diningArchetypes = new Set(['Social Butterfly', 'Balanced Active']);
  const diningSpots = ['Grill Room', 'Terrace', 'Main Dining', 'Grill Room bar'];
  const lunchSlots = ['11:45 AM', '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM', '1:00 PM'];
  const synthesizedLunch = roster
    .filter(m => diningArchetypes.has(m.archetype) && !out.has(m.memberId))
    .slice(0, 6);
  synthesizedLunch.forEach((m, i) => {
    out.set(m.memberId, {
      memberId: m.memberId,
      name: m.name,
      archetype: m.archetype,
      score: m.score ?? 70,
      duesAnnual: m.duesAnnual ?? 0,
      topRisk: m.topRisk || 'No current risks',
      lastSeenLocation: m.lastSeenLocation,
      currentContext: `Lunch reservation ${lunchSlots[i % lunchSlots.length]} · ${diningSpots[i % diningSpots.length]}`,
      _onPremiseKind: 'dining',
    });
  });

  return Array.from(out.values());
}

const HEALTH_COLORS = { critical: '#EF4444', atRisk: '#F59E0B', watch: '#3B82F6', healthy: '#12b76a' };
function getHealthColor(score) {
  if (score < 30) return HEALTH_COLORS.critical;
  if (score < 50) return HEALTH_COLORS.atRisk;
  if (score < 70) return HEALTH_COLORS.watch;
  return HEALTH_COLORS.healthy;
}

const HEALTH_FILTERS = [
  { key: 'critical', label: 'Critical', min: 0, max: 29, color: '#EF4444' },
  { key: 'atRisk', label: 'At-Risk', min: 30, max: 49, color: '#F59E0B' },
  { key: 'watch', label: 'Watch', min: 50, max: 69, color: '#3B82F6' },
];

const SORT_OPTIONS = [
  { key: 'time', label: 'Time' },
  { key: 'health', label: 'Health' },
  { key: 'dues', label: 'Dues' },
  { key: 'name', label: 'Name' },
];

function MobileMemberCard({ member, expanded, onToggle, showContext }) {
  const { showToast, addAction } = useApp();
  const color = getHealthColor(member.score);
  const profile = expanded ? getMemberProfile(member.memberId) : null;
  const prefs = profile?.preferences || {};
  const hasPrefs = !!(prefs.favoriteSpots?.length || prefs.teeWindows || prefs.dining || prefs.notes);

  const quickAction = (type, label) => {
    showToast(`${label} for ${member.name}`, 'success');
    trackAction({ actionType: type, memberId: member.memberId, memberName: member.name });
    addAction?.({ description: `${label} — ${member.name}`, memberId: member.memberId, memberName: member.name, actionType: 'RETENTION_OUTREACH', source: 'Mobile Quick Action', priority: 'medium', impactMetric: `$${(member.duesAnnual || 0).toLocaleString()}/yr` });
  };

  return (
    <div
      onClick={onToggle}
      style={{
        borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: `${color}18`, border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace",
          flexShrink: 0,
        }}>
          {member.score}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F0F0F' }}>{member.name}</div>
          {showContext && member.currentContext ? (
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F0F0F', marginTop: '3px', lineHeight: 1.3 }}>
              {member.currentContext}
            </div>
          ) : null}
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
            {member.archetype} · ${(member.duesAnnual || 0).toLocaleString()}/yr
          </div>
          {member.lastSeenLocation ? (
            <div style={{ fontSize: '11px', color: '#12b76a', marginTop: '3px', fontWeight: 600 }}>
              📍 {member.lastSeenLocation}
            </div>
          ) : null}
        </div>
        <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #F3F4F6' }}>
          {/* Status line */}
          <div style={{ fontSize: '13px', color: '#374151', padding: '10px 0', lineHeight: 1.5 }}>
            {member.topRisk && member.topRisk !== 'No current risks' && member.topRisk !== 'Monitoring'
              ? <span>⚠ {member.topRisk}</span>
              : <span style={{ color: '#12b76a' }}>✓ No current risks</span>
            }
          </div>

          {/* Profile details */}
          {profile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <InfoItem label="Member since" value={profile.joinDate ? new Date(profile.joinDate).getFullYear() : '—'} />
              <InfoItem label="Last visit" value={(() => {
                const raw = profile.activity?.[0]?.timestamp;
                if (!raw) return '—';
                const parsed = new Date(raw);
                if (Number.isNaN(parsed.getTime())) {
                  // Some demo rows use non-ISO labels like "Jan 16 · 1:12 PM" — surface the leading date portion.
                  return String(raw).split('·')[0].trim() || '—';
                }
                return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              })()} />
              <InfoItem label="Archetype" value={member.archetype} />
              <InfoItem label="Annual value" value={`$${(profile.duesAnnual || member.duesAnnual || 0).toLocaleString()}`} />
            </div>
          )}

          {/* Preferences — only when at least one field is present */}
          {hasPrefs && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Preferences
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {prefs.favoriteSpots?.length ? (
                  <InfoItem label="Favorite spots" value={prefs.favoriteSpots.join(', ')} />
                ) : null}
                {prefs.teeWindows ? <InfoItem label="Tee windows" value={prefs.teeWindows} /> : null}
                {prefs.dining ? <InfoItem label="Dining" value={prefs.dining} /> : null}
                {prefs.notes ? <InfoItem label="Notes" value={prefs.notes} /> : null}
              </div>
            </div>
          )}

          {/* Quick actions — on-premise uses face-to-face actions; off-premise uses remote contact. */}
          {showContext ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <QuickBtn icon="🤝" label="Greet" onClick={(e) => { e.stopPropagation(); quickAction('greet_in_person', 'Greeting logged'); }} />
              <QuickBtn icon="🎁" label="Comp" onClick={(e) => { e.stopPropagation(); quickAction('comp_in_person', 'Comp offered'); }} />
              <QuickBtn icon="🪑" label="Reseat" onClick={(e) => { e.stopPropagation(); quickAction('move_seat', 'Better seat assigned'); }} />
              <QuickBtn icon="📣" label="Tell GM" onClick={(e) => { e.stopPropagation(); quickAction('handoff_to_gm', 'GM hand-off requested'); }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <QuickBtn icon="📞" label="Call" onClick={(e) => { e.stopPropagation(); quickAction('call', 'Call scheduled'); }} />
              <QuickBtn icon="💬" label="SMS" onClick={(e) => { e.stopPropagation(); quickAction('sms', 'SMS drafted'); }} />
              <QuickBtn icon="✉️" label="Email" onClick={(e) => { e.stopPropagation(); quickAction('email', 'Email queued'); }} />
              <QuickBtn icon="🎁" label="Comp" onClick={(e) => { e.stopPropagation(); quickAction('comp', 'Comp offer logged'); }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={{ padding: '6px 8px', background: '#F9FAFB', borderRadius: '8px' }}>
      <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{value}</div>
    </div>
  );
}

function QuickBtn({ icon, label, onClick }) {
  return (
    // minHeight 44px — Apple HIG tap target minimum.
    <button onClick={onClick} style={{
      padding: '13px 10px', borderRadius: '10px', border: '1px solid #E5E7EB',
      background: '#FAFAFA', cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center', gap: '6px',
      fontSize: '13px', fontWeight: 600, color: '#374151',
      minHeight: '44px',
    }}>
      {icon} {label}
    </button>
  );
}

function FilterChip({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: '20px', border: 'none',
        background: active ? `${color}15` : '#F3F4F6',
        color: active ? color : '#6B7280',
        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
        whiteSpace: 'nowrap', flexShrink: 0,
        outline: active ? `2px solid ${color}40` : 'none',
      }}
    >
      {label}
    </button>
  );
}

export default function MemberLookupScreen() {
  const [mode, setMode] = useState('onPremise');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [healthFilter, setHealthFilter] = useState(null);
  const [sortBy, setSortBy] = useState('time');

  // Source roster depends on mode
  const sourceList = useMemo(() => {
    if (mode === 'atRisk') return getAtRiskMembers();
    if (mode === 'all') return getFullRoster();
    return buildOnPremiseRoster();
  }, [mode]);

  const archetypes = useMemo(() => {
    const set = new Set(sourceList.map(m => m.archetype).filter(Boolean));
    return [...set];
  }, [sourceList]);

  const [archetypeFilter, setArchetypeFilter] = useState(null);
  const [showArchetypes, setShowArchetypes] = useState(false);

  const filtered = useMemo(() => {
    let items = sourceList;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(m => m.name.toLowerCase().includes(q));
    }

    // Health filter
    if (healthFilter) {
      const f = HEALTH_FILTERS.find(hf => hf.key === healthFilter);
      if (f) items = items.filter(m => m.score >= f.min && m.score <= f.max);
    }

    // Archetype filter
    if (archetypeFilter) {
      items = items.filter(m => m.archetype === archetypeFilter);
    }

    // Sort
    items = [...items].sort((a, b) => {
      if (sortBy === 'health') return a.score - b.score;
      if (sortBy === 'dues') return (b.duesAnnual || 0) - (a.duesAnnual || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'time') {
        const parseTime = (m) => {
          const ctx = m.currentContext || m.time || '';
          const match = String(ctx).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (!match) return Infinity;
          let h = parseInt(match[1], 10);
          const min = parseInt(match[2], 10);
          const ampm = (match[3] || '').toUpperCase();
          if (ampm === 'PM' && h !== 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          return h * 60 + min;
        };
        return parseTime(a) - parseTime(b);
      }
      return 0;
    });

    return items.slice(0, 30);
  }, [sourceList, search, healthFilter, archetypeFilter, sortBy]);

  const hasActiveFilter = healthFilter || archetypeFilter;

  const modeLabel = MODE_OPTIONS.find(m => m.key === mode)?.label || '';
  const countSuffix = mode === 'onPremise' ? 'on premise now'
    : mode === 'atRisk' ? 'at-risk members'
    : 'total members';

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Mode toggle — staff-facing: On Premise / At-Risk / All. minHeight 44px for HIG tap target. */}
      <div style={{ display: 'flex', gap: '6px', background: '#F3F4F6', padding: '4px', borderRadius: '12px' }}>
        {MODE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => { setMode(opt.key); setExpandedId(null); setArchetypeFilter(null); setHealthFilter(null); }}
            style={{
              flex: 1, padding: '13px 10px', borderRadius: '9px', border: 'none',
              background: mode === opt.key ? '#0F0F0F' : 'transparent',
              color: mode === opt.key ? '#fff' : '#6B7280',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              transition: 'all 120ms ease',
              minHeight: '44px',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search members..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
        style={{
          width: '100%', padding: '12px 16px', fontSize: '16px',
          border: '1px solid #E5E7EB', borderRadius: '12px',
          background: '#F9FAFB', outline: 'none', boxSizing: 'border-box',
          WebkitAppearance: 'none',
        }}
      />

      {/* Row 1: Health filters — always visible */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {HEALTH_FILTERS.map(f => (
          <FilterChip
            key={f.key}
            label={f.label}
            active={healthFilter === f.key}
            color={f.color}
            onClick={() => setHealthFilter(healthFilter === f.key ? null : f.key)}
          />
        ))}
        <FilterChip
          label={archetypeFilter ? `Type: ${archetypeFilter}` : 'Type ▾'}
          active={!!archetypeFilter || showArchetypes}
          color="#6366F1"
          onClick={() => setShowArchetypes(!showArchetypes)}
        />
      </div>

      {/* Row 2: Archetype dropdown — shown when "Type" is tapped */}
      {showArchetypes && (
        <div style={{
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', gap: '6px', overflowX: 'auto',
            WebkitOverflowScrolling: 'touch', paddingBottom: '4px',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            {archetypes.map(arch => (
              <FilterChip
                key={arch}
                label={arch}
                active={archetypeFilter === arch}
                color="#6366F1"
                onClick={() => {
                  setArchetypeFilter(archetypeFilter === arch ? null : arch);
                  setShowArchetypes(false);
                }}
              />
            ))}
          </div>
          {/* Fade gradient on right edge */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: '4px', width: '40px',
            background: 'linear-gradient(to right, transparent, #F8F9FA)',
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* Sort + count row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
          {search || hasActiveFilter ? `${filtered.length} results` : `${sourceList.length} ${countSuffix}`}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              style={{
                padding: '4px 10px', borderRadius: '8px', border: 'none',
                background: sortBy === opt.key ? '#0F0F0F' : '#F3F4F6',
                color: sortBy === opt.key ? '#fff' : '#6B7280',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
          No members match your search or filters.
        </div>
      )}

      {filtered.map(member => (
        <MobileMemberCard
          key={member.memberId}
          member={member}
          expanded={expandedId === member.memberId}
          showContext={mode === 'onPremise'}
          onToggle={() => setExpandedId(expandedId === member.memberId ? null : member.memberId)}
        />
      ))}
    </div>
  );
}
