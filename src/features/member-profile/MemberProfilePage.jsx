import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import { StoryHeadline } from '@/components/ui';
import { useMemberProfile } from '@/context/MemberProfileContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { getMemberProfile } from '@/services/memberService';
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// --- Helpers ---
const fmt$ = (v) => (Number.isFinite(v) ? `$${Math.round(v).toLocaleString()}` : '—');
const fmtPct = (v) => (Number.isFinite(v) ? `${Math.round(v * 100)}%` : '—');
const fmtDate = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return '—'; }
};

const HEALTH_COLORS = {
  healthy: theme.colors.success,
  watch: theme.colors.warning,
  'at-risk': theme.colors.urgent,
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
    <div style={{
      background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md, padding: theme.spacing.md,
    }}>
      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: theme.fontSize.xxl, fontWeight: 700, color: accent || theme.colors.textPrimary, fontFamily: mono ? theme.fonts.mono : 'inherit', marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// --- Section wrapper ---
function Section({ title, children, cols, collapsible = false, defaultCollapsed = false, summary }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isCollapsed = collapsible && collapsed;

  return (
    <div style={{
      background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg, padding: theme.spacing.lg,
    }}>
      {title && (
        <div
          onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCollapsed ? 0 : theme.spacing.md, cursor: collapsible ? 'pointer' : 'default' }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary }}>{title}</h3>
            {isCollapsed && summary && <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{summary}</span>}
          </div>
          {collapsible && <span style={{ fontSize: 12, color: theme.colors.textMuted, transition: 'transform 0.2s', transform: collapsed ? 'rotate(0)' : 'rotate(180deg)' }}>{'\u25BC'}</span>}
        </div>
      )}
      {!isCollapsed && (cols ? <div style={{ display: 'grid', gridTemplateColumns: cols, gap: theme.spacing.md }}>{children}</div> : children)}
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

    fetch(`/api/member-detail?id=${encodeURIComponent(memberId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!cancelled) {
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
          // Fall back to static service for non-API members
          const fallback = getMemberProfile(memberId);
          setProfile(fallback);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [memberId]);

  if (!memberId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, color: theme.colors.textMuted }}>
        Loading member profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing.md, minHeight: 400, paddingTop: 80 }}>
        <div style={{ fontSize: theme.fontSize.lg, color: theme.colors.textMuted }}>Member not found</div>
        <button onClick={() => setMemberId(null)} style={{
          border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm,
          padding: '8px 16px', background: 'none', color: theme.colors.textPrimary, cursor: 'pointer',
        }}>← Back to roster</button>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Why am I looking at this member? — context banner */}
      {contextReason && (
        <div style={{
          padding: '10px 14px',
          borderRadius: theme.radius.sm,
          background: `${theme.colors.urgent}06`,
          border: `1px solid ${theme.colors.urgent}20`,
          borderLeft: `3px solid ${theme.colors.urgent}`,
          fontSize: theme.fontSize.sm,
          color: theme.colors.textPrimary,
        }}>
          <span style={{ fontWeight: 700, color: theme.colors.urgent, marginRight: 6 }}>Flagged:</span>
          {contextReason}
        </div>
      )}

      {/* Back button + header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.md }}>
        <button onClick={() => setMemberId(null)} style={{
          border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm,
          padding: '6px 14px', background: theme.colors.bgCard, color: theme.colors.textSecondary,
          cursor: 'pointer', fontSize: theme.fontSize.sm,
        }}>← All Members</button>
        <button onClick={() => openProfile(memberId)} style={{
          border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm,
          padding: '6px 14px', background: theme.colors.bgCard, color: theme.colors.textSecondary,
          cursor: 'pointer', fontSize: theme.fontSize.sm,
        }}>Open Quick View →</button>
      </div>

      {/* Hero header */}
      <div style={{
        background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg, padding: theme.spacing.xl,
        display: 'grid', gridTemplateColumns: '1fr auto', gap: theme.spacing.lg, alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: theme.colors.textPrimary }}>
              {profile.name || `${profile.firstName} ${profile.lastName}`}
            </h1>
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: theme.fontSize.xs, fontWeight: 700,
              background: `${color}20`, color, border: `1px solid ${color}40`,
            }}>
              {healthLabel(score)} · {score}
            </span>
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.lg, marginTop: theme.spacing.sm, flexWrap: 'wrap', fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
            <span>{profile.archetype}</span>
            <span>{profile.tier || profile.membershipType}</span>
            <span>ID: {profile.memberId}</span>
            {profile.memberSince && <span>Member since {fmtDate(profile.memberSince)}</span>}
            {profile.membershipStatus && profile.membershipStatus !== 'active' && (
              <span style={{ color: theme.colors.urgent, fontWeight: 600 }}>{profile.membershipStatus.toUpperCase()}</span>
            )}
          </div>
          {contact.lastSeenLocation && (
            <div style={{ marginTop: theme.spacing.sm, fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
              Last seen: {contact.lastSeenLocation}
            </div>
          )}
        </div>
        {/* Health score gauge */}
        <div style={{ textAlign: 'center', minWidth: 120 }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            border: `6px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
          }}>
            <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: theme.fonts.mono, color }}>{score}</span>
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 6 }}>Health Score</div>
        </div>
      </div>

      {/* Key metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: theme.spacing.md }}>
        <Stat label="Annual Dues" value={fmt$(profile.duesAnnual)} accent={theme.colors.textPrimary} />
        <Stat label="Total Value" value={fmt$(profile.memberValueAnnual)} accent={theme.colors.accent} />
        <Stat label="Account Balance" value={fmt$(profile.accountBalance)} accent={profile.accountBalance < 0 ? theme.colors.urgent : theme.colors.success} />
        <Stat label="Email Open Rate" value={fmtPct(profile.emailOpenRate)} accent={theme.colors.members} mono />
        <Stat label="Rounds (30d)" value={profile.roundsPlayed ?? '—'} accent={theme.colors.chartGolf} mono />
        <Stat label="Dining Spend (30d)" value={fmt$(profile.diningSpend)} accent={theme.colors.fb} />
      </div>

      {/* Two-column grid: trend + risk signals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
        {/* Health trend chart */}
        <Section title="Health Score Trend">
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: theme.colors.textMuted }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: theme.colors.textMuted }} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke={color} fill={`${color}30`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.textMuted }}>
              Insufficient trend data
            </div>
          )}
        </Section>

        {/* Risk signals */}
        <Section title="Risk Signals">
          {riskSignals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {riskSignals.map((signal, i) => (
                <div key={i} style={{
                  padding: theme.spacing.sm, borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.urgent}30`, background: `${theme.colors.urgent}08`,
                }}>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
                    {signal.label || signal.detail || signal}
                  </div>
                  {signal.source && (
                    <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
                      Source: {signal.source} {signal.confidence ? `· Confidence: ${signal.confidence}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: theme.colors.success, fontSize: theme.fontSize.sm }}>No active risk signals</div>
          )}
        </Section>
      </div>

      {/* Preferences & Family */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
        {/* Preferences */}
        <Section title="Preferences & Notes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {preferences.teeWindows && (
              <div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tee Time Preference</div>
                <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, marginTop: 2 }}>{preferences.teeWindows}</div>
              </div>
            )}
            {preferences.dining && (
              <div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dining Preference</div>
                <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary, marginTop: 2 }}>{preferences.dining}</div>
              </div>
            )}
            {preferences.favoriteSpots && preferences.favoriteSpots.length > 0 && (
              <div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Favorite Spots</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {(Array.isArray(preferences.favoriteSpots) ? preferences.favoriteSpots : [preferences.favoriteSpots]).map((spot, i) => (
                    <span key={i} style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: theme.fontSize.xs,
                      background: `${theme.colors.accent}15`, border: `1px solid ${theme.colors.accent}30`,
                      color: theme.colors.textSecondary,
                    }}>{spot}</span>
                  ))}
                </div>
              </div>
            )}
            {preferences.notes && (
              <div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Member Notes</div>
                <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2, lineHeight: 1.5 }}>{preferences.notes}</div>
              </div>
            )}
            {!preferences.teeWindows && !preferences.dining && !preferences.notes && (
              <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>No preferences on file</div>
            )}
          </div>
        </Section>

        {/* Family */}
        <Section title="Family Members">
          {family.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {family.map((member, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: theme.spacing.sm, borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.border}`, background: theme.colors.bgDeep,
                }}>
                  <div>
                    <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600 }}>{member.name}</div>
                    <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                      {member.relationship} {member.age ? `· Age ${member.age}` : ''}
                    </div>
                  </div>
                  {member.memberStatus && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, fontSize: '10px', fontWeight: 600,
                      background: member.memberStatus === 'Active' ? `${theme.colors.success}20` : `${theme.colors.warning}20`,
                      color: member.memberStatus === 'Active' ? theme.colors.success : theme.colors.warning,
                    }}>{member.memberStatus}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>No family members on file</div>
          )}
        </Section>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'flex', gap: theme.spacing.sm, padding: theme.spacing.md,
        background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
      }}>
        {[
          { label: 'Schedule call', icon: '📞', color: '#16a34a' },
          { label: 'Send email', icon: '✉️', color: theme.colors.info500 || '#3B82F6' },
          { label: 'Send SMS', icon: '📱', color: theme.colors.accent },
          { label: 'Offer comp', icon: '🎁', color: '#8b5cf6' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => {}}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: theme.radius.sm,
              border: `1px solid ${action.color}25`, background: `${action.color}06`,
              color: action.color, fontSize: theme.fontSize.xs, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: '14px' }}>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* Contact info */}
      <Section title="Contact Information" cols="repeat(auto-fit, minmax(200px, 1fr))">
        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase' }}>Email</div>
          <div style={{ fontSize: theme.fontSize.sm, marginTop: 2 }}>{contact.email || profile.email || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase' }}>Phone</div>
          <div style={{ fontSize: theme.fontSize.sm, marginTop: 2 }}>{contact.phone || profile.phone || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase' }}>Preferred Channel</div>
          <div style={{ fontSize: theme.fontSize.sm, marginTop: 2 }}>{contact.preferredChannel || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase' }}>Last Seen</div>
          <div style={{ fontSize: theme.fontSize.sm, marginTop: 2 }}>{contact.lastSeenLocation || '—'}</div>
        </div>
      </Section>

      {/* Invoices */}
      <Section title="Invoice History" collapsible defaultCollapsed summary={`${invoiceItems.length} invoices`}>
        {invoiceItems.length > 0 ? (
          <>
            {invoices.summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <div style={{ padding: theme.spacing.sm, borderRadius: theme.radius.sm, background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}` }}>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted, textTransform: 'uppercase' }}>Total Billed</div>
                  <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, fontFamily: theme.fonts.mono }}>{fmt$(invoices.summary.totalBilled)}</div>
                </div>
                <div style={{ padding: theme.spacing.sm, borderRadius: theme.radius.sm, background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}` }}>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted, textTransform: 'uppercase' }}>Total Paid</div>
                  <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, fontFamily: theme.fonts.mono, color: theme.colors.success }}>{fmt$(invoices.summary.totalPaid)}</div>
                </div>
                <div style={{ padding: theme.spacing.sm, borderRadius: theme.radius.sm, background: invoices.summary.outstanding > 0 ? `${theme.colors.urgent}10` : theme.colors.bgDeep, border: `1px solid ${invoices.summary.outstanding > 0 ? theme.colors.urgent + '30' : theme.colors.border}` }}>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted, textTransform: 'uppercase' }}>Outstanding</div>
                  <div style={{ fontSize: theme.fontSize.md, fontWeight: 700, fontFamily: theme.fonts.mono, color: invoices.summary.outstanding > 0 ? theme.colors.urgent : theme.colors.textPrimary }}>{fmt$(invoices.summary.outstanding)}</div>
                </div>
                <div style={{ padding: theme.spacing.sm, borderRadius: theme.radius.sm, background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}` }}>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted, textTransform: 'uppercase' }}>Payment Status</div>
                  <div style={{
                    fontSize: theme.fontSize.sm, fontWeight: 700, marginTop: 2,
                    color: invoices.summary.paymentStatus === 'current' ? theme.colors.success : invoices.summary.paymentStatus === 'chronic' ? theme.colors.urgent : theme.colors.warning,
                  }}>
                    {(invoices.summary.paymentStatus || 'unknown').charAt(0).toUpperCase() + (invoices.summary.paymentStatus || 'unknown').slice(1)}
                  </div>
                </div>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.xs }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                    {['Date', 'Type', 'Description', 'Amount', 'Status', 'Paid', 'Late Fee'].map((h) => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: theme.colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.slice(0, 20).map((inv, i) => {
                    const statusColor = inv.status === 'paid' ? theme.colors.success : inv.status === 'current' ? theme.colors.warning : theme.colors.urgent;
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                        <td style={{ padding: '8px 10px', fontFamily: theme.fonts.mono }}>{fmtDate(inv.dueDate || inv.invoiceDate)}</td>
                        <td style={{ padding: '8px 10px' }}>{inv.type}</td>
                        <td style={{ padding: '8px 10px', color: theme.colors.textSecondary, maxWidth: 200 }}>{inv.description}</td>
                        <td style={{ padding: '8px 10px', fontFamily: theme.fonts.mono }}>{fmt$(inv.amount)}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '10px', fontWeight: 600, background: `${statusColor}15`, color: statusColor }}>
                            {inv.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontFamily: theme.fonts.mono, color: theme.colors.success }}>{inv.paidAmount > 0 ? fmt$(inv.paidAmount) : '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: theme.fonts.mono, color: inv.lateFee > 0 ? theme.colors.urgent : theme.colors.textMuted }}>{inv.lateFee > 0 ? fmt$(inv.lateFee) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>No invoice history available</div>
        )}
      </Section>

      {/* Activity timeline */}
      <Section title="Activity Timeline" collapsible defaultCollapsed summary={`${(profile.activity || []).length} entries`}>
        {activity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, maxHeight: 400, overflowY: 'auto' }}>
            {activity.map((event, i) => (
              <div key={i} style={{
                display: 'flex', gap: theme.spacing.md, alignItems: 'flex-start',
                padding: theme.spacing.sm, borderRadius: theme.radius.sm,
                borderBottom: `1px solid ${theme.colors.border}`,
              }}>
                <span style={{ flexShrink: 0, width: 80, fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontFamily: theme.fonts.mono, paddingTop: 2 }}>
                  {fmtDate(event.date)}
                </span>
                <div>
                  <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{event.event || event.description}</div>
                  {event.domain && <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>{event.domain}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>No recent activity</div>
        )}
      </Section>

      {/* Staff notes */}
      {staffNotes.length > 0 && (
        <Section title="Staff Notes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {staffNotes.map((note, i) => (
              <div key={i} style={{
                padding: theme.spacing.md, borderRadius: theme.radius.sm,
                background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}`,
              }}>
                <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>{typeof note === 'string' ? note : note.note || note.text}</div>
                {note.author && (
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 4 }}>
                    {note.author} {note.date ? `· ${fmtDate(note.date)}` : ''}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or member ID..."
        style={{
          padding: '12px 16px', borderRadius: theme.radius.sm,
          border: `1px solid ${theme.colors.border}`, background: theme.colors.bgCard,
          color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, maxWidth: 400,
        }}
      />
      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
        Showing {filtered.length} at-risk members · Click any row to view full profile
      </div>
      <div style={{
        background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              {['Name', 'Score', 'Archetype', 'Type', 'Annual Dues', 'Top Risk'].map((h) => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left', color: theme.colors.textMuted,
                  fontSize: theme.fontSize.xs, fontWeight: 600, textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: theme.colors.textMuted }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: theme.colors.textMuted }}>No members found</td></tr>
            ) : filtered.map((m) => {
              const sc = m.score ?? m.healthScore ?? 0;
              const bk = healthBucket(sc);
              const cl = HEALTH_COLORS[bk];
              return (
                <tr
                  key={m.memberId}
                  onClick={() => onSelect(m.memberId)}
                  style={{ borderBottom: `1px solid ${theme.colors.border}`, cursor: 'pointer' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = theme.colors.bgDeep; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontFamily: theme.fonts.mono, color: cl, fontWeight: 700 }}>{sc}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: theme.colors.textSecondary }}>{m.archetype}</td>
                  <td style={{ padding: '10px 14px', color: theme.colors.textSecondary }}>{m.membershipType}</td>
                  <td style={{ padding: '10px 14px', fontFamily: theme.fonts.mono }}>{fmt$(m.annualDues || m.duesAnnual)}</td>
                  <td style={{ padding: '10px 14px', color: theme.colors.textSecondary, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.topRisk}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
