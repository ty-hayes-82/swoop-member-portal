import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceArea, Tooltip } from 'recharts';
import { theme } from '@/config/theme';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return currencyFormatter.format(amount);
};

const formatPercent = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return percentFormatter.format(amount / 100);
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const SectionCard = ({ title, subtitle, children, actions }) => (
  <section
    style={{
      background: theme.colors.bgCard,
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.border}`,
      padding: theme.spacing.lg,
      boxShadow: theme.shadow.sm,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.md,
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <h2 style={{ margin: 0, fontSize: '18px' }}>{title}</h2>
      {subtitle && <p style={{ margin: 0, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>{subtitle}</p>}
    </div>
    {children}
    {actions}
  </section>
);

const ActivityCard = ({ label, value, trend }) => (
  <div
    style={{
      background: theme.colors.bg,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
      padding: theme.spacing.md,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <strong style={{ fontSize: theme.fontSize.xl }}>{value}</strong>
      {trend !== undefined && (
        <span style={{ fontSize: theme.fontSize.sm, color: trend >= 0 ? theme.colors.success : theme.colors.urgent }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed?.(1) ?? trend}
        </span>
      )}
    </div>
  </div>
);

const RiskCard = ({ label, detail, action, severity }) => (
  <div
    style={{
      borderRadius: theme.radius.md,
      border: `1px solid ${severity === 'critical' ? theme.colors.urgent : theme.colors.warning}40`,
      background: severity === 'critical' ? `${theme.colors.urgent}08` : `${theme.colors.warning}08`,
      padding: theme.spacing.md,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}
  >
    <strong>{label}</strong>
    <p style={{ margin: 0, color: theme.colors.textSecondary }}>{detail}</p>
    <p style={{ margin: 0, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}><strong>Recommended:</strong> {action}</p>
  </div>
);

const TimelineItem = ({ icon, title, description, date }) => (
  <div style={{ display: 'flex', gap: theme.spacing.md }}>
    <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
    </div>
    <div style={{ flex: 1, paddingBottom: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <strong>{title}</strong>
        <span style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs }}>{formatDateTime(date)}</span>
      </div>
      <p style={{ margin: 0, color: theme.colors.textSecondary }}>{description}</p>
    </div>
  </div>
);

const TooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: theme.spacing.sm }}>
      <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600 }}>{item.label}</div>
      <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>Engagement score: {item.score}</div>
    </div>
  );
};

export default function MemberProfile() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let isMounted = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fetch(`/api/member-detail?memberId=${encodeURIComponent(memberId ?? '')}`)
      .then(async (response) => {
        if (!response.ok) {
          const message = await response.json().catch(() => ({}));
          throw new Error(message.error || 'Unable to load member');
        }
        return response.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setState({ loading: false, error: null, data });
      })
      .catch((error) => {
        if (!isMounted) return;
        setState({ loading: false, error: error.message, data: null });
      });
    return () => {
      isMounted = false;
    };
  }, [memberId]);

  const profile = state.data;

  const headerStats = useMemo(() => (
    profile ? [
      { label: 'Membership', value: profile.member.membershipType ?? '—' },
      { label: 'Joined', value: formatDate(profile.member.joinDate) },
      { label: 'Status', value: profile.member.status ?? 'Active' },
    ] : []
  ), [profile]);

  const activityCards = useMemo(() => {
    if (!profile) return [];
    return [
      { label: profile.activitySummary.rounds.label, value: profile.activitySummary.rounds.value ?? '—', trend: profile.activitySummary.rounds.trend },
      { label: profile.activitySummary.dining.label, value: formatCurrency(profile.activitySummary.dining.value), trend: profile.activitySummary.dining.trend },
      { label: profile.activitySummary.email.label, value: `${profile.activitySummary.email.value ?? 0}%`, trend: profile.activitySummary.email.trend },
      { label: profile.activitySummary.events.label, value: profile.activitySummary.events.value ?? '—', trend: profile.activitySummary.events.trend },
    ];
  }, [profile]);

  const timeline = profile?.engagementTimeline ?? [];
  const riskSignals = profile?.riskSignals ?? [];
  const financials = profile?.financials ?? {};

  return (
    <div style={{ background: theme.colors.bg, minHeight: '100vh', padding: theme.spacing.xl }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          style={{
            alignSelf: 'flex-start',
            border: 'none',
            background: theme.colors.bgCard,
            borderRadius: theme.radius.md,
            padding: '8px 14px',
            boxShadow: theme.shadow.sm,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ← Back to Dashboard
        </button>

        {state.loading && (
          <div style={{ background: theme.colors.bgCard, borderRadius: theme.radius.lg, border: `1px solid ${theme.colors.border}`, padding: theme.spacing.xl, textAlign: 'center' }}>
            Loading member profile…
          </div>
        )}

        {state.error && (
          <div style={{ background: `${theme.colors.urgent}10`, borderRadius: theme.radius.lg, border: `1px solid ${theme.colors.urgent}40`, padding: theme.spacing.xl }}>
            <strong>Unable to load member profile.</strong>
            <p style={{ marginTop: theme.spacing.sm }}>{state.error}</p>
          </div>
        )}

        {profile && !state.loading && (
          <>
            {/* Header */}
            <section
              style={{
                background: theme.colors.bgCard,
                borderRadius: theme.radius.lg,
                border: `1px solid ${theme.colors.border}`,
                padding: theme.spacing.lg,
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing.lg,
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    background: theme.colors.bgDeep,
                    border: `2px solid ${theme.colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    fontWeight: 700,
                  }}
                >
                  {profile.member.initials || '??'}
                </div>
                <div>
                  <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Member Profile</span>
                  <h1 style={{ margin: '4px 0', fontSize: 36 }}>{profile.member.name}</h1>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {headerStats.map((stat) => (
                      <div key={stat.label} style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
                        <strong style={{ color: theme.colors.textPrimary }}>{stat.value}</strong> · {stat.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Health Score</div>
                <div style={{ fontSize: 56, fontFamily: theme.fonts.mono, color: profile.member.healthScore > 69 ? theme.colors.success : profile.member.healthScore > 40 ? theme.colors.warning : theme.colors.urgent }}>
                  {profile.member.healthScore ?? '—'}
                </div>
                <div style={{ fontSize: theme.fontSize.sm, color: profile.member.scoreDelta >= 0 ? theme.colors.success : theme.colors.urgent }}>
                  {profile.member.scoreDelta >= 0 ? '▲' : '▼'} {Math.abs(profile.member.scoreDelta).toFixed(1)} vs last week
                </div>
              </div>
            </section>

            {/* Health timeline */}
            <SectionCard title="Health Score Timeline" subtitle="Last five weeks">
              {profile.healthTimeline?.length ? (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={profile.healthTimeline} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                      <XAxis dataKey="label" stroke={theme.colors.textMuted} fontSize={12} />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip content={<TooltipContent />} />
                      <ReferenceArea y1={70} y2={100} fill={theme.colors.success} fillOpacity={0.08} stroke="none" />
                      <ReferenceArea y1={50} y2={70} fill={theme.colors.warning} fillOpacity={0.06} stroke="none" />
                      <ReferenceArea y1={30} y2={50} fill={theme.colors.urgent} fillOpacity={0.04} stroke="none" />
                      <Line type="monotone" dataKey="score" stroke={theme.colors.accent} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: theme.colors.textSecondary }}>Not enough historical data.</p>
              )}
            </SectionCard>

            {/* Activity summary */}
            <SectionCard title="Activity Summary">
              <div className="grid-responsive-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.md }}>
                {activityCards.map((card) => (
                  <ActivityCard key={card.label} {...card} />
                ))}
              </div>
            </SectionCard>

            {/* Risk signals */}
            <SectionCard title="Risk Signals" subtitle="Signals driving current risk score">
              {riskSignals.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: theme.spacing.md }}>
                  {riskSignals.map((signal) => (
                    <RiskCard key={signal.id} {...signal} />
                  ))}
                </div>
              ) : (
                <p style={{ color: theme.colors.textSecondary }}>No active risks — keep monitoring weekly.</p>
              )}
            </SectionCard>

            {/* Engagement timeline */}
            <SectionCard title="Engagement Timeline" subtitle="Most recent touchpoints">
              {timeline.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                  {timeline.map((item) => (
                    <TimelineItem key={item.id} icon={item.icon ?? '•'} title={item.type?.toUpperCase?.() ?? 'Event'} description={item.description} date={item.date} />
                  ))}
                </div>
              ) : (
                <p style={{ color: theme.colors.textSecondary }}>No recent touchpoints logged.</p>
              )}
            </SectionCard>

            {/* Contact & outreach */}
            <SectionCard title="Contact & Outreach">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: theme.spacing.md }}>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Email</div>
                  <div style={{ fontSize: theme.fontSize.md, fontWeight: 600 }}>{profile.contact?.email ?? '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Phone</div>
                  <div style={{ fontSize: theme.fontSize.md, fontWeight: 600 }}>{profile.contact?.phone ?? '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Preferred Channel</div>
                  <div style={{ fontSize: theme.fontSize.md, fontWeight: 600 }}>{profile.contact?.preferredChannel ?? '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>Last Outreach</div>
                  <div style={{ fontSize: theme.fontSize.md, fontWeight: 600 }}>{formatDateTime(profile.outreachHistory?.lastOutreachDate)}</div>
                </div>
              </div>
              <p style={{ margin: 0, color: theme.colors.textSecondary }}>{profile.outreachHistory?.notes}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  style={{
                    padding: '10px 16px',
                    borderRadius: theme.radius.md,
                    background: theme.colors.accent,
                    color: theme.colors.white,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => window.alert('Outreach logged in demo environment.')}
                >
                  Log Outreach
                </button>
              </div>
            </SectionCard>

            {/* Financial summary */}
            <SectionCard title="Financial Summary">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: theme.spacing.md }}>
                <ActivityCard label="Annual Dues" value={formatCurrency(financials.annualDues)} />
                <ActivityCard label="YTD Golf Spend" value={formatCurrency(financials.ytdGolfSpend)} />
                <ActivityCard label="YTD Dining Spend" value={formatCurrency(financials.ytdDiningSpend)} />
                <ActivityCard label="YTD Event Spend" value={formatCurrency(financials.ytdEventSpend)} />
                <ActivityCard label="Lifetime Value (est)" value={formatCurrency(financials.lifetimeValue)} />
                <ActivityCard label="Renewal Date" value={formatDate(financials.renewalDate)} />
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
