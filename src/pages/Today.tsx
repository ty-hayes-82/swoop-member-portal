import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import {
  Bar, SectionTitle, RailCard,
  INK, INK_FAINT, BRASS, FOREST,
  PH, PH_DARK, SERIF,
} from '../components/WireframeKit'

const CLUB_ID = 'bowling-green-cc'

interface TodayData {
  date: string
  weather: { condition: string; temp_high: number; wind_mph: number; golf_demand_modifier: number; fb_demand_modifier: number } | null
  tee_sheet: { projected_rounds: number; fill_rate_pct: string; morning_rounds: number; afternoon_rounds: number }
  at_risk_members: Array<{ id: string; name: string; health_score: number; annual_dues: number; tier: string }>
  pending_handoffs: Array<{ id: string; from_agent: string; to_agent: string; recommendation_type: string; urgency: string; suggested_action: string; created_at: string }>
  inbox_counts: Record<string, number>
  demo_mode?: boolean
}

const URGENCY_COLOR: Record<string, string> = {
  critical: 'rgba(139,58,58,0.65)',
  high:     'rgba(163,100,30,0.65)',
  medium:   'rgba(61,106,75,0.5)',
  low:      'rgba(26,31,27,0.2)',
}

const AGENT_LABELS: Record<string, string> = {
  labor_optimizer:          'Labor',
  member_pulse_analyst:     'Pulse',
  revenue_analyst:          'Revenue',
  service_recovery_analyst: 'Service',
  engagement_autopilot:     'Engage',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function dayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

export default function Today() {
  const [data, setData] = useState<TodayData | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`/api/today?club_id=${CLUB_ID}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [])

  async function decide(id: string, decision: 'approved' | 'dismissed', snooze_days?: number) {
    setDismissed(prev => new Set([...prev, id]))
    await fetch(`/api/handoffs/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, snooze_days }),
    }).catch(console.error)
  }

  const visibleHandoffs = (data?.pending_handoffs ?? []).filter(h => !dismissed.has(h.id))
  const atRiskCount = data ? data.at_risk_members.length : null
  const liveInboxCounts: Record<string, number> = visibleHandoffs.reduce((acc, h) => {
    acc[h.from_agent] = (acc[h.from_agent] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const agentRecCount = data ? visibleHandoffs.length : null

  const allAgents = ['labor_optimizer', 'member_pulse_analyst', 'revenue_analyst', 'service_recovery_analyst', 'engagement_autopilot']
  const AGENT_ROUTE: Record<string, string> = {
    service_recovery_analyst: '/service',
    revenue_analyst: '/revenue',
  }

  return (
    <Box>
      {data?.demo_mode && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Box sx={{ px: 1, py: 0.25, bgcolor: 'rgba(163,132,88,0.08)', border: '1px solid rgba(163,132,88,0.2)', borderRadius: '4px', display: 'inline-flex', gap: 0.75, alignItems: 'center' }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: BRASS, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pre-pilot</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: INK_FAINT }}>Tier 4 · Bowling Green CC</Typography>
          </Box>
        </Box>
      )}

      {/* Opener */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: { xs: '1.4rem', md: '1.75rem' }, color: INK, lineHeight: 1.2 }}>
            {greeting()}, <em>{dayName()}</em>
          </Typography>
          <Chip
            icon={<FiberManualRecordIcon sx={{ fontSize: '8px !important', color: '#3d6a4b !important', animation: 'ctPulse 2s ease-in-out infinite', '@keyframes ctPulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.35 } } }} />}
            label="Live"
            size="small"
            sx={{ height: 20, fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.04em', bgcolor: 'rgba(61,106,75,0.08)', color: '#3d6a4b', border: '1px solid rgba(61,106,75,0.2)', '& .MuiChip-icon': { ml: 0.75 } }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {data?.weather ? (
            <>
              <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT }}>{data.weather.condition.charAt(0).toUpperCase() + data.weather.condition.slice(1)}, {data.weather.temp_high}°F</Typography>
              <Typography sx={{ color: INK_FAINT, fontSize: '0.8rem' }}>·</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT }}>{data.weather.wind_mph} mph wind</Typography>
              <Typography sx={{ color: INK_FAINT, fontSize: '0.8rem' }}>·</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT }}>Golf demand {Math.round(data.weather.golf_demand_modifier * 100)}%</Typography>
            </>
          ) : !data ? (
            <><Bar w={120} h={9} /><Typography sx={{ color: INK_FAINT, fontSize: '0.8rem', lineHeight: 1 }}>·</Typography><Bar w={140} h={9} /><Typography sx={{ color: INK_FAINT, fontSize: '0.8rem', lineHeight: 1 }}>·</Typography><Bar w={160} h={9} /></>
          ) : (
            <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT }}>Weather unavailable</Typography>
          )}
        </Box>
      </Box>

      {/* KPI strip */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: '0 !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
            {[
              { label: 'Rounds today',     value: data?.tee_sheet.projected_rounds ?? null, accent: false, route: null },
              { label: 'Agent recs',       value: agentRecCount,                            accent: false, route: null },
              { label: 'Needs your voice', value: agentRecCount,                            accent: true,  route: '/members?filter=at-risk' },
              { label: 'At risk',          value: atRiskCount,                              accent: true,  route: '/members?filter=at-risk' },
            ].map(({ label, value, accent, route }, i) => (
              <Box key={label} onClick={route ? () => navigate(route) : undefined} sx={{ px: 2.5, py: 1.75, cursor: route ? 'pointer' : 'default', borderLeft: { xs: i % 2 === 0 ? 'none' : '1px solid rgba(26,31,27,0.08)', md: i > 0 ? '1px solid rgba(26,31,27,0.08)' : 'none' }, borderTop: { xs: i >= 2 ? '1px solid rgba(26,31,27,0.08)' : 'none', md: 'none' }, '&:hover': route ? { bgcolor: 'rgba(26,31,27,0.02)' } : {} }}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.75 }}>{label}</Typography>
                {value !== null ? (
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: accent ? '#3d6a4b' : INK, lineHeight: 1 }}>{value}</Typography>
                ) : (
                  <Box sx={{ height: accent ? 32 : 26, width: 52, bgcolor: accent ? 'rgba(30,58,45,0.12)' : PH, borderRadius: '3px' }} />
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Mobile: pocket briefing (single-column condensed) */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: '16px !important' }}>
            <SectionTitle badge={data ? `${visibleHandoffs.length} pending` : undefined}>Needs your voice</SectionTitle>
            {visibleHandoffs.slice(0, 1).map(h => (
              <Box key={h.id}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ width: 3, height: 48, borderRadius: '2px', bgcolor: URGENCY_COLOR[h.urgency] ?? URGENCY_COLOR.low, flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: INK, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
                      {AGENT_LABELS[h.from_agent] ?? h.from_agent} · {h.recommendation_type.replace(/_/g, ' ')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: INK, lineHeight: 1.4 }}>{h.suggested_action}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                  <Button
                    size="small" variant="contained" startIcon={<CheckIcon />}
                    onClick={() => decide(h.id, 'approved')}
                    sx={{ flex: 1, bgcolor: FOREST, '&:hover': { bgcolor: '#152e22' }, fontSize: '0.75rem', textTransform: 'none' }}
                  >Approve</Button>
                  <Button
                    size="small" variant="outlined" startIcon={<CloseIcon />}
                    onClick={() => decide(h.id, 'dismissed')}
                    sx={{ flex: 1, borderColor: 'rgba(26,31,27,0.2)', color: INK_FAINT, fontSize: '0.75rem', textTransform: 'none' }}
                  >Dismiss</Button>
                  <Button
                    size="small" variant="outlined"
                    onClick={() => decide(h.id, 'dismissed', 7)}
                    sx={{ px: 1, borderColor: 'rgba(26,31,27,0.15)', color: INK_FAINT, fontSize: '0.65rem', textTransform: 'none', whiteSpace: 'nowrap' }}
                  >Snooze 7d</Button>
                </Box>
              </Box>
            ))}
            {visibleHandoffs.length === 0 && <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT }}>No pending actions</Typography>}
          </CardContent>
        </Card>

        <RailCard title="At-risk members">
          {(data?.at_risk_members ?? []).slice(0, 3).map((m, i) => (
            <Box key={m.id} onClick={() => navigate(`/members/${m.id}`)} sx={{ cursor: 'pointer' }}>
              {i > 0 && <Divider sx={{ my: 0.625 }} />}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: m.health_score < 30 ? 'rgba(139,58,58,0.6)' : 'rgba(163,100,30,0.5)' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: INK, lineHeight: 1.3 }}>{m.name}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>{m.tier} · score {m.health_score}</Typography>
                </Box>
              </Box>
            </Box>
          ))}
          {!data && Array.from({ length: 3 }).map((_, idx) => (
            <Box key={idx}>
              {idx > 0 && <Divider sx={{ my: 0.625 }} />}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: PH_DARK }} />
                <Box sx={{ flex: 1 }}><Bar w="65%" h={9} /><Bar w="45%" h={8} mt={5} /></Box>
              </Box>
            </Box>
          ))}
        </RailCard>
      </Box>

      {/* Desktop: two-column layout */}
      <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
        <Box>
          {/* Priority actions */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: '20px !important' }}>
              <SectionTitle badge={data ? `${visibleHandoffs.length} pending` : undefined} link="View all" onLinkClick={() => navigate('/members?filter=at-risk')}>Needs your voice</SectionTitle>
              {(visibleHandoffs.length > 0 ? visibleHandoffs : Array.from({ length: 4 })).slice(0, 4).map((h, i) => {
                const handoff = h as TodayData['pending_handoffs'][0] | undefined
                return (
                  <Box key={handoff?.id ?? i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.25, borderBottom: i < 3 ? '1px solid rgba(26,31,27,0.06)' : 'none' }}>
                    <Box sx={{ width: 3, height: 56, borderRadius: '2px', bgcolor: handoff ? (URGENCY_COLOR[handoff.urgency] ?? URGENCY_COLOR.low) : (i < 3 ? 'rgba(139,58,58,0.5)' : 'rgba(61,106,75,0.5)'), flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      {handoff ? (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: INK, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {AGENT_LABELS[handoff.from_agent] ?? handoff.from_agent}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: INK_FAINT }}>{handoff.recommendation_type.replace(/_/g, ' ')}</Typography>
                          </Box>
                          <Typography sx={{ fontSize: '0.8rem', color: INK, lineHeight: 1.4 }}>
                            {handoff.suggested_action?.substring(0, 80)}{(handoff.suggested_action?.length ?? 0) > 80 ? '…' : ''}
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: INK_FAINT, mt: 0.5 }}>
                            {new Date(handoff.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {handoff.urgency}
                          </Typography>
                        </>
                      ) : (
                        <><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}><Box sx={{ height: 16, width: 64, bgcolor: PH_DARK, borderRadius: '2px' }} /><Bar w="38%" h={12} /></Box><Bar w="72%" h={10} /><Bar w="44%" h={9} mt={5} /></>
                      )}
                    </Box>
                    {handoff && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
                        <Chip label={handoff.urgency} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: handoff.urgency === 'critical' ? 'rgba(139,58,58,0.1)' : 'rgba(26,31,27,0.06)', color: handoff.urgency === 'critical' ? 'rgb(139,58,58)' : INK_FAINT, border: 'none' }} />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button size="small" onClick={() => decide(handoff.id, 'approved')} sx={{ minWidth: 0, px: 0.75, py: 0.25, bgcolor: 'rgba(30,58,45,0.08)', color: FOREST, fontSize: '0.6rem', textTransform: 'none', '&:hover': { bgcolor: 'rgba(30,58,45,0.15)' } }}>
                            <CheckIcon sx={{ fontSize: '0.75rem', mr: 0.25 }} />Approve
                          </Button>
                          <Button size="small" onClick={() => decide(handoff.id, 'dismissed')} sx={{ minWidth: 0, px: 0.75, py: 0.25, bgcolor: 'rgba(26,31,27,0.05)', color: INK_FAINT, fontSize: '0.6rem', textTransform: 'none' }}>
                            <CloseIcon sx={{ fontSize: '0.75rem', mr: 0.25 }} />Pass
                          </Button>
                          <Button size="small" onClick={() => decide(handoff.id, 'dismissed', 7)} sx={{ minWidth: 0, px: 0.75, py: 0.25, bgcolor: 'rgba(26,31,27,0.04)', color: INK_FAINT, fontSize: '0.6rem', textTransform: 'none' }}>
                            7d
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )
              })}
              {data && visibleHandoffs.length === 0 && (
                <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT, py: 1 }}>All caught up — no pending actions</Typography>
              )}
            </CardContent>
          </Card>

          {/* Inbox by agent */}
          <Card>
            <CardContent sx={{ p: '20px !important' }}>
              <SectionTitle badge={data ? `${agentRecCount} pending` : undefined} link="View all" onLinkClick={() => navigate('/members')}>Inbox by agent</SectionTitle>
              {data && agentRecCount === 0 ? (
                <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT, py: 1 }}>All agents are clear — no pending recommendations.</Typography>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
                  {allAgents.map((agent) => {
                    const count = data ? (liveInboxCounts[agent] ?? 0) : null
                    return (
                      <Box key={agent} onClick={() => navigate(AGENT_ROUTE[agent] ?? '/members')} sx={{ border: '1px solid rgba(26,31,27,0.08)', borderRadius: '4px', p: '10px 12px', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(26,31,27,0.03)', borderColor: 'rgba(26,31,27,0.16)' } }}>
                        {count !== null ? (
                          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: count > 0 ? BRASS : INK_FAINT, lineHeight: 1, mb: 1 }}>{count}</Typography>
                        ) : (
                          <Box sx={{ height: 24, width: 20, bgcolor: PH_DARK, borderRadius: '3px', mb: 1 }} />
                        )}
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: INK, letterSpacing: '0.03em' }}>{AGENT_LABELS[agent] ?? agent}</Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: INK_FAINT, mt: '3px' }}>{count !== null ? (count === 1 ? '1 rec' : `${count} recs`) : ''}</Typography>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right rail */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <RailCard title="At-risk members">
            {(data?.at_risk_members ?? []).slice(0, 3).map((m, i) => (
              <Box key={m.id} onClick={() => navigate(`/members/${m.id}`)} sx={{ cursor: 'pointer' }}>
                {i > 0 && <Divider sx={{ my: 0.625 }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: m.health_score < 30 ? 'rgba(139,58,58,0.6)' : 'rgba(163,100,30,0.5)' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: INK, lineHeight: 1.3 }}>{m.name}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>{m.tier} · score {m.health_score}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
            {!data && Array.from({ length: 3 }).map((_, idx) => (
              <Box key={idx}>
                {idx > 0 && <Divider sx={{ my: 0.625 }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: PH_DARK }} />
                  <Box sx={{ flex: 1 }}><Bar w="65%" h={9} /><Bar w="45%" h={8} mt={5} /></Box>
                </Box>
              </Box>
            ))}
          </RailCard>

          <RailCard title="Course & tee sheet" onClick={() => navigate('/service')}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', mb: 1.25 }}>
              {data ? (
                [
                  { label: 'Rounds',      value: String(data.tee_sheet.projected_rounds) },
                  { label: 'Utilization', value: data.tee_sheet.fill_rate_pct },
                  { label: 'AM rounds',   value: String(data.tee_sheet.morning_rounds) },
                  { label: 'PM rounds',   value: String(data.tee_sheet.afternoon_rounds) },
                ].map(({ label, value }) => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: '0.625rem', color: INK_FAINT, letterSpacing: '0.05em', textTransform: 'uppercase', mb: '4px' }}>{label}</Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: INK, lineHeight: 1 }}>{value}</Typography>
                  </Box>
                ))
              ) : (
                ['Rounds', 'Utilization', 'AM rounds', 'PM rounds'].map(label => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: '0.625rem', color: INK_FAINT, letterSpacing: '0.05em', textTransform: 'uppercase', mb: '4px' }}>{label}</Typography>
                    <Box sx={{ height: 22, width: 44, bgcolor: PH, borderRadius: '3px' }} />
                  </Box>
                ))
              )}
            </Box>
            <Divider sx={{ mb: 1 }} />
            {data?.weather ? (
              <Typography sx={{ fontSize: '0.7rem', color: INK_FAINT }}>
                {data.weather.condition.charAt(0).toUpperCase() + data.weather.condition.slice(1)}, {data.weather.temp_high}°F · {data.weather.wind_mph}mph
              </Typography>
            ) : <Bar w="85%" h={8} />}
          </RailCard>

          <RailCard title={`Overnight · ${(data?.pending_handoffs.length ?? 0)} events`}>
            {data ? (
              Object.entries(
                data.pending_handoffs.reduce((acc, h) => {
                  acc[h.from_agent] = (acc[h.from_agent] ?? 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([agent, count]) => (
                <Box key={agent} onClick={() => navigate(AGENT_ROUTE[agent] ?? '/members')} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, cursor: 'pointer', '&:hover': { opacity: 0.7 } }}>
                  <Typography sx={{ fontSize: '0.7rem', color: INK_FAINT }}>{AGENT_LABELS[agent] ?? agent}</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: INK }}>{count}</Typography>
                </Box>
              ))
            ) : Array.from({ length: 3 }).map((_, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Bar w="50%" h={8} />
                <Bar w={16} h={8} />
              </Box>
            ))}
            {data && data.pending_handoffs.length === 0 && (
              <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT }}>Nothing overnight</Typography>
            )}
          </RailCard>
        </Box>
      </Box>
    </Box>
  )
}
