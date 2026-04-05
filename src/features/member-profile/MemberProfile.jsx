import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceArea,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return currencyFormatter.format(amount);
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const severityStyles = {
  critical: 'border-red-500/40 bg-red-50 text-red-900',
  warning: 'border-amber-500/40 bg-amber-50 text-amber-900',
  info: 'border-blue-500/30 bg-blue-50 text-blue-900',
};

const actionButtons = [
  { label: 'Send Email', icon: '✉️' },
  { label: 'Schedule Call', icon: '📞' },
  { label: 'Add Note', icon: '📝' },
];

const HealthTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow">
      <div className="text-sm font-semibold text-slate-700">{item.label}</div>
      <div className="text-sm text-slate-500">Health score: {item.score}</div>
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
    const authToken = localStorage.getItem('swoop_auth_token');
    fetch(`/api/member-detail?memberId=${encodeURIComponent(memberId ?? '')}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    })
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

  const healthColor = useMemo(() => {
    const score = profile?.member?.healthScore ?? 0;
    if (score >= 75) return '#16a34a';
    if (score >= 50) return '#facc15';
    if (score >= 30) return '#fb923c';
    return '#ef4444';
  }, [profile]);

  const metricValue = (metric) => {
    if (!metric) return '—';
    if (metric.unit === 'currency') return formatCurrency(metric.value);
    if (metric.unit === 'days') return `${metric.value ?? '—'} days`;
    return metric.value ?? '—';
  };

  const trendCopy = (metric) => {
    if (!metric) return '—';
    if (metric.id === 'visit-gap') {
      const direction = metric.trend > 0 ? 'Improving' : metric.trend < 0 ? 'Worsening' : 'No change';
      return `${direction} ${metric.comparison}`;
    }
    const value = Number(metric.trend ?? 0);
    const symbol = value >= 0 ? '+' : '−';
    return `${symbol}${Math.abs(value).toFixed(1)}% ${metric.comparison}`;
  };

  const timelineEntries = profile?.activityTimeline ?? [];
  const engagementHistory = profile?.engagementHistory ?? [];
  const notes = profile?.notes ?? [];
  const financials = profile?.financials ?? {};
  const breakdown = financials.breakdown ?? {};

  const gaugeStyle = {
    background: `conic-gradient(${healthColor} ${(profile?.member?.healthScore ?? 0) * 3.6}deg, #e2e8f0 ${(profile?.member?.healthScore ?? 0) * 3.6}deg)`,
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Back to dashboard
        </button>

        {state.loading && (
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center text-lg font-semibold text-slate-500 shadow">
            Loading member profile…
          </div>
        )}

        {state.error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-8 text-red-700 shadow">
            <p className="text-lg font-semibold">Unable to load member profile.</p>
            <p className="mt-2 text-sm">{state.error}</p>
          </div>
        )}

        {profile && !state.loading && (
          <div className="flex flex-col gap-8">
            {/* Hero */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-semibold text-white md:h-24 md:w-24 md:text-3xl">
                      {profile.member.initials || '??'}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Member Profile</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">{profile.member.name}</h1>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                          {profile.member.membershipType || 'Member'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        Member since {formatDate(profile.member.joinDate)} · Status: {profile.member.status || 'Active'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span>Archetype: <strong>{profile.member.archetype || '—'}</strong></span>
                    <span>Health trend: <strong className="capitalize">{profile.member.healthTrend}</strong></span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-end gap-4">
                  <div className="flex items-center gap-6">
                    <div className="relative h-28 w-28">
                      <div className="absolute inset-0 rounded-full" style={gaugeStyle} />
                      <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white text-center">
                        <span className="text-3xl font-semibold text-slate-900">{profile.member.healthScore ?? '—'}</span>
                        <span className="text-xs uppercase tracking-wide text-slate-500">Health</span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      <div className="text-xs uppercase tracking-wider text-slate-400">Δ vs last week</div>
                      <div className={`text-lg font-semibold ${profile.member.scoreDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {profile.member.scoreDelta >= 0 ? '▲' : '▼'} {Math.abs(profile.member.scoreDelta ?? 0).toFixed(1)} pts
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {actionButtons.map((button) => (
                      <button
                        key={button.label}
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                      >
                        <span>{button.icon}</span>
                        {button.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Health timeline */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Health Score</h2>
                  <p className="text-sm text-slate-500">Last 12 weeks</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    Trend: <span className="capitalize">{profile.member.healthTrend}</span>
                  </span>
                </div>
              </div>
              <div className="mt-4 h-80 w-full">
                {profile.healthTimeline?.length ? (
                  <ResponsiveContainer>
                    <LineChart data={profile.healthTimeline} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip content={<HealthTooltip />} />
                      <ReferenceArea y1={70} y2={100} fill="#dcfce7" fillOpacity={0.4} stroke="none" />
                      <ReferenceArea y1={50} y2={70} fill="#fef9c3" fillOpacity={0.4} stroke="none" />
                      <ReferenceArea y1={30} y2={50} fill="#fee2e2" fillOpacity={0.4} stroke="none" />
                      <Line type="monotone" dataKey="score" stroke={'#ff8b00'} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Not enough historical data.</div>
                )}
              </div>
            </section>

            {/* Key metrics */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900">Key Metrics</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {(profile.keyMetrics ?? []).map((metric) => {
                  const positive = metric.id === 'visit-gap' ? metric.trend > 0 : metric.trend >= 0;
                  return (
                    <div key={metric.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <p className="text-xs uppercase tracking-widest text-slate-400">{metric.label}</p>
                      <div className="mt-2 text-3xl font-semibold text-slate-900">{metricValue(metric)}</div>
                      <div className={`mt-1 text-sm font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>{trendCopy(metric)}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Risk signals */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Risk Signals</h2>
                <p className="text-sm text-slate-500">Signals driving the current score</p>
              </div>
              {profile.riskSignals?.length ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {profile.riskSignals.map((signal) => (
                    <div key={signal.id} className={`rounded-2xl border p-4 ${severityStyles[signal.severity] ?? severityStyles.warning}`}>
                      <p className="text-sm font-semibold">{signal.label}</p>
                      <p className="mt-1 text-sm">{signal.detail}</p>
                      <p className="mt-2 text-sm font-semibold"><span className="text-xs uppercase tracking-widest">Recommended:</span> {signal.action}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No active risks — keep monitoring weekly.</p>
              )}
            </section>

            {/* Activity timeline & engagement history */}
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
                  <span className="text-xs uppercase tracking-widest text-slate-400">Last 20 touchpoints</span>
                </div>
                <div className="mt-4 flex flex-col gap-4">
                  {timelineEntries.map((item) => (
                    <div key={item.id} className="relative pl-6">
                      <span className="absolute left-0 top-2 text-lg">{item.icon ?? '•'}</span>
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-semibold text-slate-900">{item.type?.toUpperCase?.() ?? 'Event'}</p>
                        <span className="text-xs text-slate-400">{formatDateTime(item.date)}</span>
                      </div>
                      <p className="text-sm text-slate-600">{item.description}</p>
                    </div>
                  ))}
                  {!timelineEntries.length && <p className="text-sm text-slate-500">No recent touchpoints logged.</p>}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Engagement History</h2>
                    <p className="text-sm text-slate-500">Weekly score trend</p>
                  </div>
                </div>
                <div className="mt-6 h-64 w-full">
                  {engagementHistory.length ? (
                    <ResponsiveContainer>
                      <AreaChart data={engagementHistory} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip content={<HealthTooltip />} />
                        <Area type="monotone" dataKey="score" stroke={'#ff8b00'} fill="#fde68a" strokeWidth={3} fillOpacity={0.4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">Not enough data.</div>
                  )}
                </div>
              </section>
            </div>

            {/* Contact & notes */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Email</p>
                      <p className="text-sm font-semibold text-slate-900">{profile.contact?.email ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Phone</p>
                      <p className="text-sm font-semibold text-slate-900">{profile.contact?.phone ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Preferred channel</p>
                      <p className="text-sm font-semibold text-slate-900">{profile.contact?.preferredChannel ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Last outreach</p>
                      <p className="text-sm font-semibold text-slate-900">{formatDateTime(profile.contact?.lastOutreach)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Last visit</p>
                      <p className="text-sm font-semibold text-slate-900">{formatDate(profile.contact?.lastVisitDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-400">Days since visit</p>
                      <p className="text-sm font-semibold text-slate-900">{profile.contact?.daysSinceLastVisit ?? '—'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Notes & Outreach</h2>
                  <div className="mt-4 flex flex-col gap-3">
                    {notes.map((note) => (
                      <div key={note.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                          <span>{note.owner}</span>
                          <span>{note.channel ?? '—'}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{note.note}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(note.date)}</p>
                      </div>
                    ))}
                    {!notes.length && <p className="text-sm text-slate-500">No notes logged yet.</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Financial summary */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-slate-900">Financial Summary</h2>
                <p className="text-sm text-slate-500">Real spend backing this member&apos;s health score</p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Annual dues</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(financials.annualDues)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">YTD total spend</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(financials.ytdTotal)}</p>
                  <p className={`text-sm font-semibold ${financials.deltaVsPrior >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {financials.deltaVsPrior >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(financials.deltaVsPrior || 0))} vs prior year
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Prior year spend</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(financials.priorYearTotal)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Lifetime value (est)</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(financials.lifetimeValue)}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'YTD Golf', value: breakdown.golf },
                  { label: 'YTD Dining', value: breakdown.dining },
                  { label: 'YTD Events', value: breakdown.events },
                  { label: 'YTD Pro Shop', value: breakdown.proShop },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-xs uppercase tracking-widest text-slate-400">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(item.value)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
