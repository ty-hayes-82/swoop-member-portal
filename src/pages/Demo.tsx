import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import {
  INK, INK_QUIET, INK_FAINT, FOREST, BRASS, IVORY_DEEP,
  PH, PH_DARK, SERIF, MONO,
  Bar,
} from '../components/WireframeKit'

const DEMO_CLUB = 'demo-club-cc'
const DEMO_CLUB_NAME = 'Pinehurst Demo CC'

interface TodayData {
  weather: { condition: string; temp_f: number } | null
  tee_sheet: { rounds_today: number; peak_hour: string } | null
  pending_handoffs: Array<{
    id: string; from_agent: string; recommendation_type: string; suggested_action: string
    signal_bundle?: { member_id?: string; health_score?: number; annual_dues?: number }
  }>
  at_risk_members: Array<{ member_id: string; name: string; health_score: number; tier: string; annual_dues: number }>
  inbox_counts: { urgent: number; pending: number; resolved_today: number }
}

interface MembersData {
  members: Array<{ id: string; name: string; health_score: number; tier: string; annual_dues: number; archetype: string | null }>
  tier_counts: Record<string, number>
  total: number
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

const TIER_DOT: Record<string, string> = {
  Thriving: 'rgba(61,106,75,0.7)',
  Engaged:  'rgba(61,106,75,0.4)',
  Watch:    'rgba(163,132,88,0.7)',
  'At-Risk':'rgba(166,107,47,0.8)',
  Inactive: 'rgba(139,58,58,0.7)',
}

export default function Demo() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const [today, setToday] = useState<TodayData | null>(null)
  const [members, setMembers] = useState<MembersData | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      fetch(`/api/today?club_id=${DEMO_CLUB}`).then(r => r.json()).catch(() => null),
      fetch(`/api/members?club_id=${DEMO_CLUB}`).then(r => r.json()).catch(() => null),
    ]).then(([t, m]) => {
      setToday(t)
      setMembers(m)
    })
  }, [])

  async function decide(id: string, decision: 'approved' | 'dismissed') {
    setDismissed(prev => new Set([...prev, id]))
    await fetch(`/api/handoffs/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    }).catch(console.error)
  }

  const handoffs = (today?.pending_handoffs ?? []).filter(h => !dismissed.has(h.id))
  const atRisk = today?.at_risk_members ?? []
  const memberList = members?.members ?? []

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f6f0' }}>
      {/* Demo banner — persistent top bar */}
      <Box sx={{ bgcolor: BRASS, px: { xs: 2, md: 4 }, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#fff', opacity: 0.8 }} />
          <Typography sx={{ fontFamily: MONO, fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fff' }}>
            Demo · Fixture data · Tier 4 · {DEMO_CLUB_NAME}
          </Typography>
        </Box>
        <Box
          onClick={() => navigate('/')}
          sx={{ height: 22, px: 1.25, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '2px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.08em', color: '#fff' }}>Exit demo</Typography>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 4 }, pb: { xs: 8, md: 4 }, maxWidth: 960, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: { xs: '1.5rem', md: '2rem' }, color: INK, lineHeight: 1.2, mb: 0.5 }}>
            {DEMO_CLUB_NAME}
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: INK_FAINT }}>
            ClubThread intelligence demo · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>

        {/* Mobile: pocket briefing */}
        {isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* At a glance */}
            <Card>
              <CardContent sx={{ p: '16px !important' }}>
                <Typography sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_FAINT, mb: 1.5 }}>At a glance</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                  {[
                    { label: 'Members',     value: members?.total ?? null },
                    { label: 'At-risk',     value: members ? (members.tier_counts['At-Risk'] ?? 0) + (members.tier_counts['Inactive'] ?? 0) : null },
                    { label: 'Pending',     value: today ? handoffs.length : null },
                    { label: 'Open issues', value: today ? today.inbox_counts.urgent : null },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ p: '12px 14px', bgcolor: IVORY_DEEP, borderRadius: '4px' }}>
                      <Typography sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.5 }}>{label}</Typography>
                      {value != null
                        ? <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, color: INK, lineHeight: 1 }}>{value}</Typography>
                        : <Box sx={{ height: 26, width: 40, bgcolor: PH_DARK, borderRadius: '3px' }} />
                      }
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Pending handoffs */}
            <Card>
              <CardContent sx={{ p: '16px !important' }}>
                <Typography sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_FAINT, mb: 1.25 }}>
                  Needs your decision
                </Typography>
                {handoffs.length ? handoffs.map((h) => (
                  <Box key={h.id} data-testid="handoff-card" sx={{ py: 1.25, borderBottom: '1px solid rgba(26,31,27,0.06)', '&:last-child': { borderBottom: 'none' } }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: INK, mb: 0.25 }}>{h.from_agent.replace(/_/g, ' ')}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: INK_QUIET, lineHeight: 1.4, mb: 1 }}>{h.suggested_action?.substring(0, 100)}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                      <Button
                        size="small" variant="contained" startIcon={<CheckIcon />}
                        onClick={() => decide(h.id, 'approved')}
                        sx={{ flex: 1, bgcolor: FOREST, '&:hover': { bgcolor: '#152e22' }, fontSize: '0.7rem', textTransform: 'none', py: 0.5 }}
                      >Approve</Button>
                      <Button
                        size="small" variant="outlined" startIcon={<CloseIcon />}
                        onClick={() => decide(h.id, 'dismissed')}
                        sx={{ flex: 1, borderColor: 'rgba(26,31,27,0.2)', color: INK_FAINT, fontSize: '0.7rem', textTransform: 'none', py: 0.5 }}
                      >Dismiss</Button>
                    </Box>
                  </Box>
                )) : today ? (
                  <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT }}>Nothing pending</Typography>
                ) : <><Bar w="70%" h={9} /><Bar w="90%" h={9} mt={8} /></>}
              </CardContent>
            </Card>

            {/* At-risk members */}
            <Card>
              <CardContent sx={{ p: '16px !important' }}>
                <Typography sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_FAINT, mb: 1.25 }}>
                  Members to watch
                </Typography>
                {atRisk.length ? atRisk.map((m) => (
                  <Box key={m.member_id} onClick={() => navigate(`/members/${m.member_id}?club_id=${DEMO_CLUB}`)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: '1px solid rgba(26,31,27,0.06)', '&:last-child': { borderBottom: 'none' }, cursor: 'pointer' }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: TIER_DOT[m.tier] ?? PH, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: INK }}>{m.name}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>{m.tier} · {fmt(m.annual_dues)}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: m.health_score < 30 ? 'rgba(139,58,58,0.8)' : 'rgba(163,100,30,0.8)' }}>
                      {m.health_score}
                    </Typography>
                  </Box>
                )) : today ? (
                  <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT }}>No at-risk members</Typography>
                ) : <><Bar w="60%" h={9} /><Bar w="80%" h={9} mt={8} /></>}
              </CardContent>
            </Card>
          </Box>
        ) : (
          /* Desktop: two-column cockpit */
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 3, alignItems: 'start' }}>
            <Box>
              {/* Stats row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 3 }}>
                {[
                  { label: 'Total members',  value: members?.total },
                  { label: 'At-risk / inactive', value: members ? (members.tier_counts['At-Risk'] ?? 0) + (members.tier_counts['Inactive'] ?? 0) : null },
                  { label: 'Pending decisions', value: today ? handoffs.length : null },
                  { label: 'Dues at risk', value: atRisk.length ? fmt(atRisk.reduce((s, m) => s + m.annual_dues, 0)) : null },
                ].map(({ label, value }) => (
                  <Card key={label}>
                    <CardContent sx={{ p: '14px 16px !important' }}>
                      <Typography sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.75 }}>{label}</Typography>
                      {value != null
                        ? <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: INK, lineHeight: 1 }}>{value}</Typography>
                        : <Box sx={{ height: 26, width: 44, bgcolor: PH_DARK, borderRadius: '3px' }} />
                      }
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Member list */}
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: '20px !important' }}>
                  <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, mb: 1.5 }}>Member health overview</Typography>
                  {memberList.length ? memberList.map((m, i) => (
                    <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.125, borderBottom: i < memberList.length - 1 ? '1px solid rgba(26,31,27,0.06)' : 'none' }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: TIER_DOT[m.tier] ?? PH, flexShrink: 0 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: INK }}>{m.name}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>{m.tier}{m.archetype ? ` · ${m.archetype}` : ''}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>{fmt(m.annual_dues)}</Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: m.health_score < 30 ? 'rgba(139,58,58,0.8)' : m.health_score < 60 ? 'rgba(163,100,30,0.8)' : '#3d6a4b', minWidth: 30, textAlign: 'right' }}>
                        {m.health_score}
                      </Typography>
                    </Box>
                  )) : Array.from({ length: 4 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.125, borderBottom: i < 3 ? '1px solid rgba(26,31,27,0.06)' : 'none' }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: PH, flexShrink: 0 }} />
                      <Box sx={{ flex: 1 }}><Bar w="50%" h={9} /><Bar w="35%" h={7} mt={4} /></Box>
                      <Bar w={36} h={8} />
                      <Bar w={24} h={12} />
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Pending handoffs */}
              <Card>
                <CardContent sx={{ p: '20px !important' }}>
                  <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, mb: 1.5 }}>Agent recommendations pending GM decision</Typography>
                  {handoffs.length ? handoffs.map((h, i) => (
                    <Box key={h.id} sx={{ py: 1.25, borderBottom: i < handoffs.length - 1 ? '1px solid rgba(26,31,27,0.06)' : 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Box sx={{ px: 0.75, py: '2px', bgcolor: IVORY_DEEP, borderRadius: '3px' }}>
                          <Typography sx={{ fontSize: '0.5625rem', fontWeight: 600, color: INK_FAINT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h.from_agent.replace(/_/g, ' ')}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>{h.recommendation_type.replace(/_/g, ' ')}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.875rem', color: INK, lineHeight: 1.5 }}>{h.suggested_action?.substring(0, 150)}</Typography>
                    </Box>
                  )) : today ? (
                    <Typography sx={{ fontSize: '0.875rem', color: INK_FAINT }}>No pending recommendations</Typography>
                  ) : (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Box key={i} sx={{ py: 1.25, borderBottom: i < 1 ? '1px solid rgba(26,31,27,0.06)' : 'none' }}>
                        <Bar w="40%" h={8} /><Bar w="90%" h={10} mt={6} /><Bar w="75%" h={9} mt={5} />
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Right rail */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Tier distribution */}
              <Card>
                <CardContent sx={{ p: '16px 18px !important' }}>
                  <Typography sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: INK_FAINT, mb: 1.25 }}>Membership distribution</Typography>
                  {(['Thriving', 'Engaged', 'Watch', 'At-Risk', 'Inactive'] as const).map(tier => {
                    const count = members?.tier_counts[tier] ?? null
                    return (
                      <Box key={tier} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.625 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: TIER_DOT[tier] ?? PH }} />
                          <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>{tier}</Typography>
                        </Box>
                        {count != null
                          ? <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: INK }}>{count}</Typography>
                          : <Bar w={24} h={9} />
                        }
                      </Box>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Agent activity */}
              <Card sx={{ bgcolor: FOREST, border: 'none' }}>
                <CardContent sx={{ p: '16px 18px !important' }}>
                  <Typography sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', mb: 1.25 }}>Agent layer</Typography>
                  {[
                    { label: 'Member Pulse',      note: 'Runs daily · health scoring' },
                    { label: 'Service Recovery',  note: 'Runs every 30 min · escalations' },
                    { label: 'Engagement Autopilot', note: 'Runs daily · re-engagement drafts' },
                    { label: 'Revenue Analyst',   note: 'Runs daily · F&B leakage' },
                  ].map(({ label, note }) => (
                    <Box key={label} sx={{ py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.06)', '&:last-child': { borderBottom: 'none' } }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)', mb: '2px' }}>{label}</Typography>
                      <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>{note}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Demo note */}
              <Card sx={{ bgcolor: BRASS, border: 'none' }}>
                <CardContent sx={{ p: '14px 16px !important' }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', mb: 0.75 }}>About this demo</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                    All data is curated fixture data (Tier 4). Agents are live. Member and financial data is synthetic.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* Footer — desktop only */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, mt: 4, pt: 2.5, borderTop: '1px solid rgba(26,31,27,0.1)', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', color: INK_FAINT, letterSpacing: '0.08em' }}>
            ClubThread · {DEMO_CLUB_NAME} · Tier 4 fixture data
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.8125rem', color: BRASS }}>ClubThread v1.2</Typography>
        </Box>
      </Box>

      {/* Mobile bottom nav — demo scene navigation */}
      {isMobile && (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, bgcolor: '#fff', borderTop: '1px solid rgba(26,31,27,0.1)', display: 'flex', zIndex: 100 }}>
          {[
            { label: 'Today',   path: '/demo'    },
            { label: 'Service', path: '/service' },
            { label: 'Members', path: '/members' },
          ].map(({ label, path }) => (
            <Box
              key={path}
              onClick={() => navigate(path)}
              sx={{ flex: 1, py: 1.25, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
            >
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', color: INK_FAINT, textTransform: 'uppercase' }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
