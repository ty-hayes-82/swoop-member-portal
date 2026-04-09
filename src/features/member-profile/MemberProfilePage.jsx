import { useState, useEffect } from 'react';
import { StoryHeadline } from '@/components/ui';
import SourceBadge from '@/components/ui/SourceBadge';
import { useMemberProfile } from '@/context/MemberProfileContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { getMemberProfile } from '@/services/memberService';
import MemberDecayChain from './MemberDecayChain.jsx';
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// --- Helpers ---
const fmt$ = (v) => (Number.isFinite(v) ? `$${Math.round(v).toLocaleString()}` : '\u2014');
const fmtPct = (v) => (Number.isFinite(v) ? `${Math.round(v * 100)}%` : '\u2014');
const fmtDate = (v) => {
  if (!v) return '\u2014';
  try { return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return '\u2014'; }
};

const HEALTH_COLORS = {
  healthy: '#12b76a',
  watch: '#f59e0b',
  'at-risk': '#ef4444',
  critical: '#8E1C17',
};

function healthBucket(score) {
  if (score >= 70) return 'healthy';
  if (score >= 50) return 'watch';
  if (score >= 30) return 'at-risk';
  return 'critical';
}

function healthLabel(score) {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
}

// --- Stat card ---
function Stat({ label, value, accent, sub, mono }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div className={`text-[28px] font-bold mt-1 ${mono ? 'font-mono' : ''}`} style={{ color: accent || '#1a1a2e' }}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// --- Section wrapper ---
function Section({ title, children, cols, collapsible = false, defaultCollapsed = false, summary, sourceSystems }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isCollapsed = collapsible && collapsed;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      {title && (
        <div
          onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
          className={`flex justify-between items-center ${isCollapsed ? '' : 'mb-4'} ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="m-0 text-base font-bold text-[#1a1a2e]">{title}</h3>
            {isCollapsed && summary && <span className="text-xs text-gray-400">{summary}</span>}
            {!isCollapsed && Array.isArray(sourceSystems) && sourceSystems.length > 0 && (
              <div className="flex gap-1 flex-wrap items-center">
                {sourceSystems.map(s => (
                  <SourceBadge key={s} system={s} size="xs" />
                ))}
              </div>
            )}
          </div>
          {collapsible && <span className="text-xs text-gray-400 transition-transform duration-200" style={{ transform: collapsed ? 'rotate(0)' : 'rotate(180deg)' }}>{'\u25BC'}</span>}
        </div>
      )}
      {!isCollapsed && (cols ? <div className="gap-4" style={{ display: 'grid', gridTemplateColumns: cols }}>{children}</div> : children)}
    </div>
  );
}

// --- First Domino panel — now sourced from shared MemberDecayChain ---
// The previous inline FirstDominoPanel has been replaced by <MemberDecayChain />
// (see ./MemberDecayChain.jsx) so the drawer and full page share one source
// of truth for the decay-chain card, source labels, first-signal counter,
// and the inline Approve & Log action.

// --- Category icons & colors for snapshot ---
const SNAPSHOT_CATEGORIES = [
  { key: 'dining',  label: 'Food & Dining', types: ['Dining', 'F&B', 'Lounge'],              icon: '\uD83C\uDF7D\uFE0F', color: '#f59e0b' },
  { key: 'golf',    label: 'Golf',          types: ['Golf', 'Practice', 'Tee Sheet'],         icon: '\u26F3',             color: '#12b76a' },
  { key: 'events',  label: 'Events',        types: ['Event', 'Events', 'Social'],             icon: '\uD83C\uDF89',       color: '#8b5cf6' },
  { key: 'spa',     label: 'Spa & Wellness',types: ['Spa', 'Wellness', 'Pool', 'Fitness'],    icon: '\uD83E\uDDD6',       color: '#ec4899' },
  { key: 'courts',  label: 'Courts',        types: ['Tennis', 'Pickleball', 'Courts', 'Court'],icon: '\uD83C\uDFBE',      color: '#06b6d4' },
  { key: 'email',   label: 'Email',         types: ['Email'],                                  icon: '\u2709\uFE0F',       color: '#3B82F6' },
];

function buildSnapshot(activity, preferences, staffNotes) {
  const groups = {};
  SNAPSHOT_CATEGORIES.forEach((cat) => { groups[cat.key] = []; });

  // Group activity entries by category
  (activity || []).forEach((evt) => {
    const t = (evt.type || evt.domain || '').toLowerCase();
    for (const cat of SNAPSHOT_CATEGORIES) {
      if (cat.types.some((ct) => t.includes(ct.toLowerCase()))) {
        groups[cat.key].push(evt);
        break;
      }
    }
  });

  // Attach preference hints
  const prefHints = {};
  if (preferences.dining) prefHints.dining = preferences.dining;
  if (preferences.teeWindows) prefHints.golf = preferences.teeWindows;
  if (preferences.notes) {
    // Check if notes mention spa, courts, etc.
    const notesLower = preferences.notes.toLowerCase();
    if (notesLower.includes('spa') || notesLower.includes('pool') || notesLower.includes('wellness')) prefHints.spa = preferences.notes;
    if (notesLower.includes('court') || notesLower.includes('tennis') || notesLower.includes('pickleball')) prefHints.courts = preferences.notes;
  }

  // Pull hints from staff notes too
  (staffNotes || []).forEach((note) => {
    const text = (typeof note === 'string' ? note : note.text || note.note || '').toLowerCase();
    if (text.includes('spa') || text.includes('pool') || text.includes('massage')) prefHints.spa = prefHints.spa || (typeof note === 'string' ? note : note.text || note.note);
    if (text.includes('court') || text.includes('tennis') || text.includes('pickleball')) prefHints.courts = prefHints.courts || (typeof note === 'string' ? note : note.text || note.note);
  });

  // Also check family notes for hints
  return { groups, prefHints };
}

function SnapshotCard({ cat, items, prefHint, familyHints }) {
  const hasContent = items.length > 0 || prefHint || (familyHints && familyHints.length > 0);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{cat.icon}</span>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: cat.color }}>{cat.label}</span>
        {items.length > 0 && (
          <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{items.length} recent</span>
        )}
      </div>
      {prefHint && (
        <div className="text-xs text-gray-500 italic border-l-2 pl-2 mb-1" style={{ borderColor: `${cat.color}60` }}>
          {prefHint}
        </div>
      )}
      {familyHints && familyHints.length > 0 && familyHints.map((fh, i) => (
        <div key={i} className="text-xs text-gray-400 italic border-l-2 pl-2 mb-1 border-purple-300">
          {fh.name}: {fh.note}
        </div>
      ))}
      {items.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {items.slice(0, 3).map((evt, i) => (
            <div key={i} className="flex gap-2 items-start text-xs">
              <span className="shrink-0 text-gray-400 font-mono whitespace-nowrap">{evt.timestamp || fmtDate(evt.date)}</span>
              <span className="text-gray-700">{evt.detail || evt.event || evt.description}</span>
            </div>
          ))}
          {items.length > 3 && (
            <div className="text-[10px] text-gray-400">+{items.length - 3} more in timeline</div>
          )}
        </div>
      ) : !prefHint && (!familyHints || familyHints.length === 0) ? (
        <div className="text-xs text-gray-300">No recent activity</div>
      ) : null}
    </div>
  );
}

// --- Main component ---
export default function MemberProfilePage() {
  const { memberRouteId } = useNavigationContext();
  const [memberId, setMemberId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { openProfile } = useMemberProfile();

  // Get member ID from NavigationContext (primary) or URL hash (fallback)
  useEffect(() => {
    if (memberRouteId) {
      setMemberId(memberRouteId);
      return;
    }
    const hash = window.location.hash;
    const match = hash.match(/members?\/([^&/]+)/i);
    if (match) setMemberId(match[1]);
  }, [memberRouteId]);

  // Seed profile IDs — use static data to avoid DB mismatch
  const SEED_IDS = new Set(['mbr_203', 'mbr_089', 'mbr_271', 'mbr_146', 'mbr_312']);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;
    setLoading(true);

    // For seed profiles, use static data directly (DB may have different records)
    if (SEED_IDS.has(memberId)) {
      const staticProfile = getMemberProfile(memberId);
      if (staticProfile && !cancelled) {
        setProfile(staticProfile);
        setLoading(false);
      }
      return () => { cancelled = true; };
    }

    const authToken = localStorage.getItem('swoop_auth_token');
    fetch(`/api/member-detail?id=${encodeURIComponent(memberId)}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!cancelled) {
          if (!data || (!data.member && !data.memberId)) {
            const fallback = getMemberProfile(memberId);
            setProfile(fallback);
            setLoading(false);
            return;
          }
          if (data?.member) {
            const m = data.member;
            const f = data.financials ?? {};
            const c = data.contact ?? {};
            const km = data.keyMetrics ?? [];
            setProfile({
              ...data,
              memberId: m.id,
              name: m.name,
              initials: m.initials,
              firstName: m.name?.split(" ")[0],
              lastName: m.name?.split(" ").slice(1).join(" "),
              membershipType: m.membershipType,
              memberSince: m.joinDate,
              membershipStatus: m.status,
              archetype: m.archetype,
              healthScore: m.healthScore,
              scoreDelta: m.scoreDelta,
              healthTrend: m.healthTrend,
              tier: m.healthScore >= 70 ? "Gold" : m.healthScore >= 50 ? "Silver" : "Bronze",
              trend: (data.engagementHistory ?? []).map((w) => w.score),
              duesAnnual: f.annualDues,
              memberValueAnnual: f.ytdTotal || f.annualDues,
              accountBalance: f.ytdTotal ?? 0,
              emailOpenRate: null,
              roundsPlayed: km.find((k) => k.id === "rounds")?.value ?? null,
              diningSpend: km.find((k) => k.id === "dining")?.value ?? null,
              contact: c,
              family: data.family ?? [],
              preferences: data.preferences ?? {},
              activityTimeline: data.activityTimeline ?? [],
              riskSignals: data.riskSignals ?? [],
              notes: data.notes ?? [],
              invoices: data.invoices ?? {},
            });
          } else {
            setProfile(data);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const fallback = getMemberProfile(memberId);
          setProfile(fallback);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [memberId]);

  if (!memberId) {
    return (
      <div className="flex flex-col gap-6">
        <StoryHeadline
          variant="insight"
          headline="Select a member to view their full profile"
          context="Search by name or member ID to see engagement history, preferences, family, invoices, and activity timeline."
        />
        <MemberRoster onSelect={setMemberId} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-gray-400">
        Loading member profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-4 min-h-[400px] pt-20">
        <div className="text-lg text-gray-400">Member not found</div>
        <button onClick={() => setMemberId(null)} className="border border-gray-200 rounded-lg px-4 py-2 bg-transparent text-[#1a1a2e] cursor-pointer">
          {'\u2190'} Back to roster
        </button>
      </div>
    );
  }

  const score = Number(profile.healthScore) || 0;
  const bucket = healthBucket(score);
  const color = HEALTH_COLORS[bucket];
  const trend = Array.isArray(profile.trend) ? profile.trend : [];
  const trendData = trend.map((v, i) => ({ week: `W${i + 1}`, score: v }));
  const activity = Array.isArray(profile.activityTimeline || profile.activity) ? (profile.activityTimeline || profile.activity) : [];
  const riskSignals = Array.isArray(profile.riskSignals) ? profile.riskSignals : [];
  const staffNotes = Array.isArray(profile.notes || profile.staffNotes) ? (profile.notes || profile.staffNotes) : [];
  const family = Array.isArray(profile.family) ? profile.family : [];
  const preferences = profile.preferences || {};
  const invoices = profile.invoices || {};
  const invoiceItems = Array.isArray(invoices.items) ? invoices.items : [];
  const contact = profile.contact || {};

  const contextReason = riskSignals.length > 0 ? riskSignals[0]?.label : null;

  // Build snapshot data for habits section
  const { groups: snapshotGroups, prefHints } = buildSnapshot(activity, preferences, staffNotes);

  // Collect family hints relevant to each category
  const familyHintsByCategory = {};
  family.forEach((fm) => {
    const note = (fm.notes || '').toLowerCase();
    if (note.includes('spa') || note.includes('pool') || note.includes('wellness')) {
      (familyHintsByCategory.spa = familyHintsByCategory.spa || []).push({ name: fm.name, note: fm.notes });
    }
    if (note.includes('court') || note.includes('tennis') || note.includes('pickleball')) {
      (familyHintsByCategory.courts = familyHintsByCategory.courts || []).push({ name: fm.name, note: fm.notes });
    }
    if (note.includes('golf') || note.includes('tee') || note.includes('clinic')) {
      (familyHintsByCategory.golf = familyHintsByCategory.golf || []).push({ name: fm.name, note: fm.notes });
    }
    if (note.includes('wine') || note.includes('dinner') || note.includes('grill') || note.includes('dining')) {
      (familyHintsByCategory.dining = familyHintsByCategory.dining || []).push({ name: fm.name, note: fm.notes });
    }
    if (note.includes('event') || note.includes('camp') || note.includes('social')) {
      (familyHintsByCategory.events = familyHintsByCategory.events || []).push({ name: fm.name, note: fm.notes });
    }
  });

  // Determine which categories have any content (activity, pref hint, or family hint)
  const activeCategories = SNAPSHOT_CATEGORIES.filter((cat) => {
    return snapshotGroups[cat.key].length > 0 || prefHints[cat.key] || (familyHintsByCategory[cat.key] && familyHintsByCategory[cat.key].length > 0);
  });
  const emptyCategories = SNAPSHOT_CATEGORIES.filter((cat) => {
    return snapshotGroups[cat.key].length === 0 && !prefHints[cat.key] && (!familyHintsByCategory[cat.key] || familyHintsByCategory[cat.key].length === 0);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Why am I looking at this member? — context banner */}
      {contextReason && (
        <div className="px-3.5 py-2.5 rounded-lg bg-red-500/[0.04] border border-red-500/[0.13] border-l-[3px] border-l-red-500 text-sm text-[#1a1a2e]">
          <span className="font-bold text-error-500 mr-1.5">Flagged:</span>
          {contextReason}
        </div>
      )}

      {/* Back button + header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <button onClick={() => setMemberId(null)} className="border border-gray-200 rounded-lg px-3.5 py-1.5 bg-white text-gray-500 cursor-pointer text-sm">
          {'\u2190'} All Members
        </button>
        <button onClick={() => openProfile(memberId)} className="border border-gray-200 rounded-lg px-3.5 py-1.5 bg-white text-gray-500 cursor-pointer text-sm">
          Open Quick View {'\u2192'}
        </button>
      </div>

      {/* Hero header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-6 items-center">
        <div>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="m-0 text-[28px] font-bold text-[#1a1a2e]">
              {profile.name || `${profile.firstName} ${profile.lastName}`}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
              {healthLabel(score)} {'\u00B7'} {score}
            </span>
          </div>
          <div className="flex gap-6 mt-2 flex-wrap text-sm text-gray-500">
            <span>{profile.archetype}</span>
            <span>{profile.tier || profile.membershipType}</span>
            {profile.externalId && <span>ID: {profile.externalId}</span>}
            {profile.memberSince && <span>Member since {fmtDate(profile.memberSince)}</span>}
            {profile.membershipStatus && profile.membershipStatus !== 'active' && (
              <span className="text-error-500 font-semibold">{profile.membershipStatus.toUpperCase()}</span>
            )}
          </div>
          {contact.lastSeenLocation && (
            <div className="mt-2 text-xs text-gray-400">
              Last seen: {contact.lastSeenLocation}
            </div>
          )}
        </div>
        {/* Health score gauge */}
        <div className="text-center min-w-[120px]">
          <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center mx-auto" style={{ border: `6px solid ${color}` }}>
            <span className="text-[32px] font-bold font-mono" style={{ color }}>{score}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1.5">Health Score</div>
          {/* Pillar 3: PROVE IT — dues at risk callout.
              2026-04-09 v2 audit fix: when MemberDecayChain renders below
              (score < 50 path), its own dollar anchor chip is the
              storyboard-aligned position. Suppressing this chip when the
              chain will render avoids the duplicate-anchor flagged by the
              audit. Keep this fallback for edge cases where the chain has
              fewer than 2 decay events (chain returns null then). */}
          {score < 50 && profile.duesAnnual > 0 && (() => {
            const events = (profile.activity ?? []).length + (profile.riskSignals ?? []).length;
            if (events >= 2) return null;
            return (
              <div
                className="mt-2 px-2 py-1 rounded-md font-mono font-bold text-[11px]"
                style={{
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                }}
                title={`$${profile.duesAnnual.toLocaleString()}/yr in dues at risk`}
              >
                ${Math.round(profile.duesAnnual / 1000)}K/yr at risk
              </div>
            );
          })()}
        </div>
      </div>

      {/* First Domino — Engagement Decay Sequence (shared component, mirrors drawer hierarchy) */}
      {score < 50 && (
        <MemberDecayChain member={profile} variant="page" />
      )}

      {/* Key metrics row */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <Stat label="Annual Dues" value={fmt$(profile.duesAnnual)} accent={'#1a1a2e'} />
        <Stat label="Total Value" value={fmt$(profile.memberValueAnnual)} accent={'#ff8b00'} />
        <Stat label="Account Balance" value={fmt$(profile.accountBalance)} accent={profile.accountBalance < 0 ? '#ef4444' : '#12b76a'} />
        <Stat label="Email Open Rate" value={fmtPct(profile.emailOpenRate)} accent={'#ff8b00'} mono />
        <Stat label="Rounds (30d)" value={profile.roundsPlayed ?? '\u2014'} accent={'#12b76a'} mono />
        <Stat label="Dining Spend (30d)" value={fmt$(profile.diningSpend)} accent={'#f59e0b'} />
      </div>

      {/* Member Habits & Activity Snapshot */}
      {(activeCategories.length > 0 || emptyCategories.length > 0) && (
        <Section title="Member Snapshot">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeCategories.map((cat) => (
              <SnapshotCard
                key={cat.key}
                cat={cat}
                items={snapshotGroups[cat.key]}
                prefHint={prefHints[cat.key]}
                familyHints={familyHintsByCategory[cat.key]}
              />
            ))}
          </div>
          {emptyCategories.length > 0 && activeCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {emptyCategories.map((cat) => (
                <span key={cat.key} className="text-[11px] text-gray-300 flex items-center gap-1">
                  <span>{cat.icon}</span> {cat.label}: No data
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* First Domino panel moved up next to the hero header; see <MemberDecayChain /> above */}

      {/* Two-column grid: trend + risk signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health trend chart */}
        <Section title="Health Score Trend" sourceSystems={['Analytics']}>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={'#E5E7EB'} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke={color} fill={`${color}30`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              Insufficient trend data
            </div>
          )}
        </Section>

        {/* Risk signals */}
        <Section title="Risk Signals" sourceSystems={['Analytics', 'Tee Sheet', 'POS', 'Email']}>
          {riskSignals.length > 0 ? (
            <div className="flex flex-col gap-2">
              {riskSignals.map((signal, i) => (
                <div key={i} className="p-2 rounded-lg border border-red-500/20 bg-red-500/[0.05]">
                  <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {signal.label || signal.detail || signal}
                  </div>
                  {signal.source && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Source: {signal.source} {signal.confidence ? `\u00B7 Confidence: ${signal.confidence}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-success-500 text-sm">No active risk signals</div>
          )}
        </Section>
      </div>

      {/* Preferences & Family */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preferences */}
        <Section title="Preferences & Notes" sourceSystems={['Member CRM']}>
          <div className="flex flex-col gap-4">
            {preferences.teeWindows && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Tee Time Preference</div>
                <div className="text-sm text-[#1a1a2e] mt-0.5">{preferences.teeWindows}</div>
              </div>
            )}
            {preferences.dining && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Dining Preference</div>
                <div className="text-sm text-[#1a1a2e] mt-0.5">{preferences.dining}</div>
              </div>
            )}
            {preferences.favoriteSpots && preferences.favoriteSpots.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Favorite Spots</div>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {(Array.isArray(preferences.favoriteSpots) ? preferences.favoriteSpots : [preferences.favoriteSpots]).map((spot, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full text-xs bg-brand-500/10 border border-brand-500/20 text-gray-500">
                      {spot}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {preferences.notes && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Member Notes</div>
                <div className="text-sm text-gray-500 mt-0.5 leading-normal">{preferences.notes}</div>
              </div>
            )}
            {!preferences.teeWindows && !preferences.dining && !preferences.notes && (
              <div className="text-gray-400 text-sm">No preferences on file</div>
            )}
          </div>
        </Section>

        {/* Family */}
        <Section title="Family Members" sourceSystems={['Member CRM']}>
          {family.length > 0 ? (
            <div className="flex flex-col gap-2">
              {family.map((member, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-gray-200 bg-gray-100">
                  <div>
                    <div className="text-sm font-semibold">{member.name}</div>
                    <div className="text-xs text-gray-400">
                      {member.relationship} {member.age ? `\u00B7 Age ${member.age}` : ''}
                    </div>
                  </div>
                  {member.memberStatus && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{
                      background: member.memberStatus === 'Active' ? '#12b76a20' : '#f59e0b20',
                      color: member.memberStatus === 'Active' ? '#12b76a' : '#f59e0b',
                    }}>{member.memberStatus}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No family members on file</div>
          )}
        </Section>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-white border border-gray-200 rounded-xl">
        {[
          { label: 'Schedule call', icon: '\uD83D\uDCDE', color: '#039855' },
          { label: 'Send email', icon: '\u2709\uFE0F', color: '#3B82F6' },
          { label: 'Send SMS', icon: '\uD83D\uDCF1', color: '#ff8b00' },
          { label: 'Offer comp', icon: '\uD83C\uDF81', color: '#8b5cf6' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => {}}
            className="px-2.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
            style={{ border: `1px solid ${action.color}25`, background: `${action.color}06`, color: action.color }}
          >
            <span className="text-sm">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* Contact info */}
      <Section title="Contact Information" cols="repeat(auto-fit, minmax(200px, 1fr))" sourceSystems={['Member CRM']}>
        <div>
          <div className="text-xs text-gray-400 uppercase">Email</div>
          <div className="text-sm mt-0.5">{contact.email || profile.email || '\u2014'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase">Phone</div>
          <div className="text-sm mt-0.5">{contact.phone || profile.phone || '\u2014'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase">Preferred Channel</div>
          <div className="text-sm mt-0.5">{contact.preferredChannel || '\u2014'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase">Last Seen</div>
          <div className="text-sm mt-0.5">{contact.lastSeenLocation || '\u2014'}</div>
        </div>
      </Section>

      {/* Invoices */}
      <Section title="Invoice History" collapsible defaultCollapsed summary={`${invoiceItems.length} invoices`} sourceSystems={['POS', 'Member CRM']}>
        {invoiceItems.length > 0 ? (
          <>
            {invoices.summary && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
                  <div className="text-[10px] text-gray-400 uppercase">Total Billed</div>
                  <div className="text-base font-bold font-mono">{fmt$(invoices.summary.totalBilled)}</div>
                </div>
                <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
                  <div className="text-[10px] text-gray-400 uppercase">Total Paid</div>
                  <div className="text-base font-bold font-mono text-success-500">{fmt$(invoices.summary.totalPaid)}</div>
                </div>
                <div className="p-2 rounded-lg border" style={{ background: invoices.summary.outstanding > 0 ? '#ef444410' : '#F3F4F6', borderColor: invoices.summary.outstanding > 0 ? '#ef444430' : '#E5E7EB' }}>
                  <div className="text-[10px] text-gray-400 uppercase">Outstanding</div>
                  <div className="text-base font-bold font-mono" style={{ color: invoices.summary.outstanding > 0 ? '#ef4444' : '#1a1a2e' }}>{fmt$(invoices.summary.outstanding)}</div>
                </div>
                <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
                  <div className="text-[10px] text-gray-400 uppercase">Payment Status</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: invoices.summary.paymentStatus === 'current' ? '#12b76a' : invoices.summary.paymentStatus === 'chronic' ? '#ef4444' : '#f59e0b' }}>
                    {(invoices.summary.paymentStatus || 'unknown').charAt(0).toUpperCase() + (invoices.summary.paymentStatus || 'unknown').slice(1)}
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Date', 'Type', 'Description', 'Amount', 'Status', 'Paid', 'Late Fee'].map((h) => (
                      <th key={h} className="px-2.5 py-2 text-left text-gray-400 font-semibold uppercase tracking-tight">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.slice(0, 20).map((inv, i) => {
                    const statusColor = inv.status === 'paid' ? '#12b76a' : inv.status === 'current' ? '#f59e0b' : '#ef4444';
                    return (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="px-2.5 py-2 font-mono">{fmtDate(inv.dueDate || inv.invoiceDate)}</td>
                        <td className="px-2.5 py-2">{inv.type}</td>
                        <td className="px-2.5 py-2 text-gray-500 max-w-[200px]">{inv.description}</td>
                        <td className="px-2.5 py-2 font-mono">{fmt$(inv.amount)}</td>
                        <td className="px-2.5 py-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${statusColor}15`, color: statusColor }}>
                            {inv.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 font-mono text-success-500">{inv.paidAmount > 0 ? fmt$(inv.paidAmount) : '\u2014'}</td>
                        <td className="px-2.5 py-2 font-mono" style={{ color: inv.lateFee > 0 ? '#ef4444' : '#9CA3AF' }}>{inv.lateFee > 0 ? fmt$(inv.lateFee) : '\u2014'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-sm">No invoice history available</div>
        )}
      </Section>

      {/* Activity timeline */}
      <Section title="Activity Timeline" collapsible defaultCollapsed summary={`${(profile.activity || []).length} entries`} sourceSystems={['Tee Sheet', 'POS', 'Email', 'Events']}>
        {activity.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
            {activity.map((event, i) => (
              <div key={i} className="flex gap-4 items-start p-2 rounded-lg border-b border-gray-200">
                <span className="shrink-0 w-20 text-xs text-gray-400 font-mono pt-0.5">
                  {fmtDate(event.date)}
                </span>
                <div>
                  <div className="text-sm text-[#1a1a2e]">{event.event || event.description}</div>
                  {event.domain && <div className="text-xs text-gray-400 mt-0.5">{event.domain}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-sm">No recent activity</div>
        )}
      </Section>

      {/* Staff notes */}
      {staffNotes.length > 0 && (
        <Section title="Staff Notes" sourceSystems={['Swoop App']}>
          <div className="flex flex-col gap-2">
            {staffNotes.map((note, i) => (
              <div key={i} className="p-4 rounded-lg bg-gray-100 border border-gray-200">
                <div className="text-sm text-[#1a1a2e]">{typeof note === 'string' ? note : note.note || note.text}</div>
                {note.author && (
                  <div className="text-xs text-gray-400 mt-1">
                    {note.author} {note.date ? `\u00B7 ${fmtDate(note.date)}` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// --- Member roster for selection ---
function MemberRoster({ onSelect }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/members')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.atRiskMembers) {
          setMembers(data.atRiskMembers);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = search.length >= 1
    ? members.filter((m) => m.name?.toLowerCase().includes(search.toLowerCase()) || m.memberId?.includes(search))
    : members;

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or member ID..."
        className="px-4 py-3 rounded-lg border border-gray-200 bg-white text-[#1a1a2e] text-sm max-w-[400px]"
      />
      <div className="text-xs text-gray-400">
        Showing {filtered.length} at-risk members {'\u00B7'} Click any row to view full profile
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full border-collapse text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200">
              {['Name', 'Score', 'Archetype', 'Type', 'Annual Dues', 'Top Risk'].map((h) => (
                <th key={h} className="px-3.5 py-2.5 text-left text-gray-400 text-xs font-semibold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-5 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-5 text-center text-gray-400">No members found</td></tr>
            ) : filtered.map((m) => {
              const sc = m.score ?? m.healthScore ?? 0;
              const bk = healthBucket(sc);
              const cl = HEALTH_COLORS[bk];
              return (
                <tr
                  key={m.memberId}
                  onClick={() => onSelect(m.memberId)}
                  className="border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                >
                  <td className="px-3.5 py-2.5 font-semibold">{m.name}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="font-mono font-bold" style={{ color: cl }}>{sc}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-gray-500">{m.archetype}</td>
                  <td className="px-3.5 py-2.5 text-gray-500">{m.membershipType}</td>
                  <td className="px-3.5 py-2.5 font-mono">{fmt$(m.annualDues || m.duesAnnual)}</td>
                  <td className="px-3.5 py-2.5 text-gray-500 max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap">{m.topRisk}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
