import { useState, useEffect } from 'react';
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
  healthy: '#22c55e',
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
    <div style={{
      background: '#ffffff', border: `1px solid ${'#E5E7EB'}`,
      borderRadius: '12px', padding: '16px',
    }}>
      <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: accent || '#1a1a2e', fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit', marginTop: 4 }}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// --- Section wrapper ---
function Section({ title, children, cols, collapsible = false, defaultCollapsed = false, summary }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isCollapsed = collapsible && collapsed;

  return (
    <div style={{
      background: '#ffffff', border: `1px solid ${'#E5E7EB'}`,
      borderRadius: '16px', padding: '24px',
    }}>
      {title && (
        <div
          onClick={collapsible ? () => setCollapsed(!collapsed) : undefined}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCollapsed ? 0 : '16px', cursor: collapsible ? 'pointer' : 'default' }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>{title}</h3>
            {isCollapsed && summary && <span className="text-xs text-gray-400">{summary}</span>}
          </div>
          {collapsible && <span style={{ fontSize: 12, color: '#9CA3AF', transition: 'transform 0.2s', transform: collapsed ? 'rotate(0)' : 'rotate(180deg)' }}>{'\u25BC'}</span>}
        </div>
      )}
      {!isCollapsed && (cols ? <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '16px' }}>{children}</div> : children)}
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
          if (!data || (!data.member && !data.memberId)) {
            // API returned empty — fall back to static service
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, color: '#9CA3AF' }}>
        Loading member profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minHeight: 400, paddingTop: 80 }}>
        <div style={{ fontSize: '18px', color: '#9CA3AF' }}>Member not found</div>
        <button onClick={() => setMemberId(null)} style={{
          border: `1px solid ${'#E5E7EB'}`, borderRadius: '8px',
          padding: '8px 16px', background: 'none', color: '#1a1a2e', cursor: 'pointer',
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
    <div className="flex flex-col gap-6">
      {/* Why am I looking at this member? — context banner */}
      {contextReason && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: `${'#ef4444'}06`,
          border: `1px solid ${'#ef4444'}20`,
          borderLeft: `3px solid ${'#ef4444'}`,
          fontSize: '14px',
          color: '#1a1a2e',
        }}>
          <span style={{ fontWeight: 700, color: '#ef4444', marginRight: 6 }}>Flagged:</span>
          {contextReason}
        </div>
      )}

      {/* Back button + header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <button onClick={() => setMemberId(null)} style={{
          border: `1px solid ${'#E5E7EB'}`, borderRadius: '8px',
          padding: '6px 14px', background: '#ffffff', color: '#6B7280',
          cursor: 'pointer', fontSize: '14px',
        }}>← All Members</button>
        <button onClick={() => openProfile(memberId)} style={{
          border: `1px solid ${'#E5E7EB'}`, borderRadius: '8px',
          padding: '6px 14px', background: '#ffffff', color: '#6B7280',
          cursor: 'pointer', fontSize: '14px',
        }}>Open Quick View →</button>
      </div>

      {/* Hero header */}
      <div style={{
        background: '#ffffff', border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px', padding: '32px',
        display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1a1a2e' }}>
              {profile.name || `${profile.firstName} ${profile.lastName}`}
            </h1>
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: '12px', fontWeight: 700,
              background: `${color}20`, color, border: `1px solid ${color}40`,
            }}>
              {healthLabel(score)} · {score}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '8px', flexWrap: 'wrap', fontSize: '14px', color: '#6B7280' }}>
            <span>{profile.archetype}</span>
            <span>{profile.tier || profile.membershipType}</span>
            <span>ID: {profile.memberId}</span>
            {profile.memberSince && <span>Member since {fmtDate(profile.memberSince)}</span>}
            {profile.membershipStatus && profile.membershipStatus !== 'active' && (
              <span className="text-error-500 font-semibold">{profile.membershipStatus.toUpperCase()}</span>
            )}
          </div>
          {contact.lastSeenLocation && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#9CA3AF' }}>
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
            <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color }}>{score}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 6 }}>Health Score</div>
        </div>
      </div>

      {/* Key metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        <Stat label="Annual Dues" value={fmt$(profile.duesAnnual)} accent={'#1a1a2e'} />
        <Stat label="Total Value" value={fmt$(profile.memberValueAnnual)} accent={'#465fff'} />
        <Stat label="Account Balance" value={fmt$(profile.accountBalance)} accent={profile.accountBalance < 0 ? '#ef4444' : '#22c55e'} />
        <Stat label="Email Open Rate" value={fmtPct(profile.emailOpenRate)} accent={'#465fff'} mono />
        <Stat label="Rounds (30d)" value={profile.roundsPlayed ?? '—'} accent={'#22c55e'} mono />
        <Stat label="Dining Spend (30d)" value={fmt$(profile.diningSpend)} accent={'#f59e0b'} />
      </div>

      {/* Two-column grid: trend + risk signals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Health trend chart */}
        <Section title="Health Score Trend">
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
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
              Insufficient trend data
            </div>
          )}
        </Section>

        {/* Risk signals */}
        <Section title="Risk Signals">
          {riskSignals.length > 0 ? (
            <div className="flex flex-col gap-2">
              {riskSignals.map((signal, i) => (
                <div key={i} style={{
                  padding: '8px', borderRadius: '8px',
                  border: `1px solid ${'#ef4444'}30`, background: `${'#ef4444'}08`,
                }}>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {signal.label || signal.detail || signal}
                  </div>
                  {signal.source && (
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 2 }}>
                      Source: {signal.source} {signal.confidence ? `· Confidence: ${signal.confidence}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#22c55e', fontSize: '14px' }}>No active risk signals</div>
          )}
        </Section>
      </div>

      {/* Preferences & Family */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Preferences */}
        <Section title="Preferences & Notes">
          <div className="flex flex-col gap-4">
            {preferences.teeWindows && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Tee Time Preference</div>
                <div style={{ fontSize: '14px', color: '#1a1a2e', marginTop: 2 }}>{preferences.teeWindows}</div>
              </div>
            )}
            {preferences.dining && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Dining Preference</div>
                <div style={{ fontSize: '14px', color: '#1a1a2e', marginTop: 2 }}>{preferences.dining}</div>
              </div>
            )}
            {preferences.favoriteSpots && preferences.favoriteSpots.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Favorite Spots</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {(Array.isArray(preferences.favoriteSpots) ? preferences.favoriteSpots : [preferences.favoriteSpots]).map((spot, i) => (
                    <span key={i} style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: '12px',
                      background: `${'#465fff'}15`, border: `1px solid ${'#465fff'}30`,
                      color: '#6B7280',
                    }}>{spot}</span>
                  ))}
                </div>
              </div>
            )}
            {preferences.notes && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Member Notes</div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginTop: 2, lineHeight: 1.5 }}>{preferences.notes}</div>
              </div>
            )}
            {!preferences.teeWindows && !preferences.dining && !preferences.notes && (
              <div style={{ color: '#9CA3AF', fontSize: '14px' }}>No preferences on file</div>
            )}
          </div>
        </Section>

        {/* Family */}
        <Section title="Family Members">
          {family.length > 0 ? (
            <div className="flex flex-col gap-2">
              {family.map((member, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px', borderRadius: '8px',
                  border: `1px solid ${'#E5E7EB'}`, background: '#F3F4F6',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{member.name}</div>
                    <div className="text-xs text-gray-400">
                      {member.relationship} {member.age ? `· Age ${member.age}` : ''}
                    </div>
                  </div>
                  {member.memberStatus && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, fontSize: '10px', fontWeight: 600,
                      background: member.memberStatus === 'Active' ? `${'#22c55e'}20` : `${'#f59e0b'}20`,
                      color: member.memberStatus === 'Active' ? '#22c55e' : '#f59e0b',
                    }}>{member.memberStatus}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#9CA3AF', fontSize: '14px' }}>No family members on file</div>
          )}
        </Section>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'flex', gap: '8px', padding: '16px',
        background: '#ffffff', border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '12px',
      }}>
        {[
          { label: 'Schedule call', icon: '📞', color: '#16a34a' },
          { label: 'Send email', icon: '✉️', color: '#3B82F6' },
          { label: 'Send SMS', icon: '📱', color: '#465fff' },
          { label: 'Offer comp', icon: '🎁', color: '#8b5cf6' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => {}}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: '8px',
              border: `1px solid ${action.color}25`, background: `${action.color}06`,
              color: action.color, fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span className="text-sm">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* Contact info */}
      <Section title="Contact Information" cols="repeat(auto-fit, minmax(200px, 1fr))">
        <div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase' }}>Email</div>
          <div style={{ fontSize: '14px', marginTop: 2 }}>{contact.email || profile.email || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase' }}>Phone</div>
          <div style={{ fontSize: '14px', marginTop: 2 }}>{contact.phone || profile.phone || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase' }}>Preferred Channel</div>
          <div style={{ fontSize: '14px', marginTop: 2 }}>{contact.preferredChannel || '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase' }}>Last Seen</div>
          <div style={{ fontSize: '14px', marginTop: 2 }}>{contact.lastSeenLocation || '—'}</div>
        </div>
      </Section>

      {/* Invoices */}
      <Section title="Invoice History" collapsible defaultCollapsed summary={`${invoiceItems.length} invoices`}>
        {invoiceItems.length > 0 ? (
          <>
            {invoices.summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: '#F3F4F6', border: `1px solid ${'#E5E7EB'}` }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Total Billed</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{fmt$(invoices.summary.totalBilled)}</div>
                </div>
                <div style={{ padding: '8px', borderRadius: '8px', background: '#F3F4F6', border: `1px solid ${'#E5E7EB'}` }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Total Paid</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#22c55e' }}>{fmt$(invoices.summary.totalPaid)}</div>
                </div>
                <div style={{ padding: '8px', borderRadius: '8px', background: invoices.summary.outstanding > 0 ? `${'#ef4444'}10` : '#F3F4F6', border: `1px solid ${invoices.summary.outstanding > 0 ? '#ef4444' + '30' : '#E5E7EB'}` }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Outstanding</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: invoices.summary.outstanding > 0 ? '#ef4444' : '#1a1a2e' }}>{fmt$(invoices.summary.outstanding)}</div>
                </div>
                <div style={{ padding: '8px', borderRadius: '8px', background: '#F3F4F6', border: `1px solid ${'#E5E7EB'}` }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Payment Status</div>
                  <div style={{
                    fontSize: '14px', fontWeight: 700, marginTop: 2,
                    color: invoices.summary.paymentStatus === 'current' ? '#22c55e' : invoices.summary.paymentStatus === 'chronic' ? '#ef4444' : '#f59e0b',
                  }}>
                    {(invoices.summary.paymentStatus || 'unknown').charAt(0).toUpperCase() + (invoices.summary.paymentStatus || 'unknown').slice(1)}
                  </div>
                </div>
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${'#E5E7EB'}` }}>
                    {['Date', 'Type', 'Description', 'Amount', 'Status', 'Paid', 'Late Fee'].map((h) => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.slice(0, 20).map((inv, i) => {
                    const statusColor = inv.status === 'paid' ? '#22c55e' : inv.status === 'current' ? '#f59e0b' : '#ef4444';
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${'#E5E7EB'}` }}>
                        <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace" }}>{fmtDate(inv.dueDate || inv.invoiceDate)}</td>
                        <td style={{ padding: '8px 10px' }}>{inv.type}</td>
                        <td style={{ padding: '8px 10px', color: '#6B7280', maxWidth: 200 }}>{inv.description}</td>
                        <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace" }}>{fmt$(inv.amount)}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '10px', fontWeight: 600, background: `${statusColor}15`, color: statusColor }}>
                            {inv.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#22c55e' }}>{inv.paidAmount > 0 ? fmt$(inv.paidAmount) : '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", color: inv.lateFee > 0 ? '#ef4444' : '#9CA3AF' }}>{inv.lateFee > 0 ? fmt$(inv.lateFee) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ color: '#9CA3AF', fontSize: '14px' }}>No invoice history available</div>
        )}
      </Section>

      {/* Activity timeline */}
      <Section title="Activity Timeline" collapsible defaultCollapsed summary={`${(profile.activity || []).length} entries`}>
        {activity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: 400, overflowY: 'auto' }}>
            {activity.map((event, i) => (
              <div key={i} style={{
                display: 'flex', gap: '16px', alignItems: 'flex-start',
                padding: '8px', borderRadius: '8px',
                borderBottom: `1px solid ${'#E5E7EB'}`,
              }}>
                <span style={{ flexShrink: 0, width: 80, fontSize: '12px', color: '#9CA3AF', fontFamily: "'JetBrains Mono', monospace", paddingTop: 2 }}>
                  {fmtDate(event.date)}
                </span>
                <div>
                  <div style={{ fontSize: '14px', color: '#1a1a2e' }}>{event.event || event.description}</div>
                  {event.domain && <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 2 }}>{event.domain}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#9CA3AF', fontSize: '14px' }}>No recent activity</div>
        )}
      </Section>

      {/* Staff notes */}
      {staffNotes.length > 0 && (
        <Section title="Staff Notes">
          <div className="flex flex-col gap-2">
            {staffNotes.map((note, i) => (
              <div key={i} style={{
                padding: '16px', borderRadius: '8px',
                background: '#F3F4F6', border: `1px solid ${'#E5E7EB'}`,
              }}>
                <div style={{ fontSize: '14px', color: '#1a1a2e' }}>{typeof note === 'string' ? note : note.note || note.text}</div>
                {note.author && (
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 4 }}>
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
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or member ID..."
        style={{
          padding: '12px 16px', borderRadius: '8px',
          border: `1px solid ${'#E5E7EB'}`, background: '#ffffff',
          color: '#1a1a2e', fontSize: '14px', maxWidth: 400,
        }}
      />
      <div className="text-xs text-gray-400">
        Showing {filtered.length} at-risk members · Click any row to view full profile
      </div>
      <div style={{
        background: '#ffffff', border: `1px solid ${'#E5E7EB'}`,
        borderRadius: '16px', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${'#E5E7EB'}` }}>
              {['Name', 'Score', 'Archetype', 'Type', 'Annual Dues', 'Top Risk'].map((h) => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left', color: '#9CA3AF',
                  fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#9CA3AF' }}>No members found</td></tr>
            ) : filtered.map((m) => {
              const sc = m.score ?? m.healthScore ?? 0;
              const bk = healthBucket(sc);
              const cl = HEALTH_COLORS[bk];
              return (
                <tr
                  key={m.memberId}
                  onClick={() => onSelect(m.memberId)}
                  style={{ borderBottom: `1px solid ${'#E5E7EB'}`, cursor: 'pointer' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: cl, fontWeight: 700 }}>{sc}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6B7280' }}>{m.archetype}</td>
                  <td style={{ padding: '10px 14px', color: '#6B7280' }}>{m.membershipType}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace" }}>{fmt$(m.annualDues || m.duesAnnual)}</td>
                  <td style={{ padding: '10px 14px', color: '#6B7280', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.topRisk}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
