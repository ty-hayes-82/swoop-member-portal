import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import { useNavigate } from 'react-router-dom'
import {
  SectionTitle, RailCard, PageHeader,
  INK, INK_QUIET, INK_FAINT, BRASS, SERIF,
  PH,
} from '../components/WireframeKit'

const CLUB_ID = 'bowling-green-cc'

const TIER_ORDER = ['Thriving', 'Engaged', 'Watch', 'At-Risk', 'Inactive']

const TIER_COLOR: Record<string, string> = {
  Thriving: 'rgba(61,106,75,0.75)',
  Engaged:  'rgba(61,106,75,0.4)',
  Watch:    'rgba(163,132,88,0.6)',
  'At-Risk':'rgba(166,107,47,0.75)',
  Inactive: 'rgba(139,58,58,0.65)',
}

const CELL_OPACITY = (avgHealth: number) => {
  if (avgHealth >= 75) return 0.85
  if (avgHealth >= 55) return 0.55
  if (avgHealth >= 35) return 0.3
  return 0.15
}

interface HeatmapData {
  heatmap: Record<string, Record<string, { count: number; avg_health: number }>>
  archetypes: string[]
  tiers: string[]
  decay_watch: {
    member_id: string
    first_name: string
    last_name: string
    health_score: number
    engagement_tier: string
    archetype: string
    annual_dues: number
    last_activity_date: string | null
  }[]
  tier_summary: { engagement_tier: string; count: number }[]
}

function HeatCell({ count, avg_health }: { count: number; avg_health: number }) {
  const opacity = CELL_OPACITY(avg_health)
  return (
    <Box sx={{
      height: 34, borderRadius: '2px',
      bgcolor: `rgba(61,106,75,${opacity})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.75rem', fontWeight: 500, color: avg_health > 50 ? '#fff' : INK_QUIET }}>
        {count}
      </Typography>
    </Box>
  )
}

function EmptyCell() {
  return <Box sx={{ height: 34, borderRadius: '2px', bgcolor: 'rgba(26,31,27,0.04)' }} />
}

export default function MembersEmail() {
  const [data, setData] = useState<HeatmapData | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`/api/members/email?club_id=${CLUB_ID}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [])

  const archetypes = data?.archetypes ?? []
  const activeTiers = TIER_ORDER.filter(t => data?.tiers.includes(t))

  return (
    <Box>
      <PageHeader title="Engagement" />

      {/* Insight callout */}
      {data && (
        <Card sx={{ mb: 2.5, borderLeft: `3px solid ${BRASS}` }}>
          <CardContent sx={{ p: '16px 20px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography sx={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 500, color: INK, mb: 0.5 }}>
                  {(() => {
                    const atRisk = data.tier_summary.find(t => t.engagement_tier === 'At-Risk')?.count ?? 0
                    const inactive = data.tier_summary.find(t => t.engagement_tier === 'Inactive')?.count ?? 0
                    const total = atRisk + inactive
                    return total > 0
                      ? `${total} member${total > 1 ? 's' : ''} need re-engagement attention`
                      : 'Engagement health looks solid'
                  })()}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>
                  {data.tier_summary.map(t => `${t.count} ${t.engagement_tier}`).join(' · ')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        <Box>
          {/* Heatmap */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: '20px !important' }}>
              <SectionTitle>Health by archetype and engagement tier</SectionTitle>
              <Typography sx={{ fontSize: '0.6875rem', color: INK_FAINT, mb: 2 }}>
                Cell size = member count. Intensity = average health score.
              </Typography>

              {data ? (
                <>
                  {/* Header row */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: `160px repeat(${activeTiers.length}, 1fr)`, gap: '4px', mb: '4px' }}>
                    <Box />
                    {activeTiers.map(tier => (
                      <Box key={tier} sx={{ textAlign: 'center', pb: '6px' }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: TIER_COLOR[tier] ?? INK_FAINT, mx: 'auto', mb: '3px' }} />
                        <Typography sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT }}>{tier}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Archetype rows */}
                  {archetypes.map(archetype => (
                    <Box key={archetype} sx={{ display: 'grid', gridTemplateColumns: `160px repeat(${activeTiers.length}, 1fr)`, gap: '4px', mb: '4px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET, lineHeight: 1.2 }}>{archetype}</Typography>
                      </Box>
                      {activeTiers.map(tier => {
                        const cell = data.heatmap[archetype]?.[tier]
                        return cell
                          ? <HeatCell key={tier} count={cell.count} avg_health={cell.avg_health} />
                          : <EmptyCell key={tier} />
                      })}
                    </Box>
                  ))}

                  {/* Legend */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2, pt: 1.5, borderTop: '1px solid rgba(26,31,27,0.07)' }}>
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>Low health</Typography>
                    {[0.15, 0.3, 0.55, 0.85].map((op, i) => (
                      <Box key={i} sx={{ width: 20, height: 12, borderRadius: '2px', bgcolor: `rgba(61,106,75,${op})` }} />
                    ))}
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>High health</Typography>
                    <Box sx={{ flex: 1 }} />
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>Number = member count in segment</Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ height: 180, bgcolor: 'rgba(26,31,27,0.03)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>Loading…</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Tier breakdown */}
          {data && (
            <Card>
              <CardContent sx={{ p: '20px !important' }}>
                <SectionTitle>Engagement tier breakdown</SectionTitle>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
                  {TIER_ORDER.map(tier => {
                    const t = data.tier_summary.find(s => s.engagement_tier === tier)
                    return (
                      <Box key={tier} sx={{ p: '12px 14px', bgcolor: 'rgba(26,31,27,0.02)', borderRadius: '3px', borderLeft: `3px solid ${TIER_COLOR[tier] ?? INK_FAINT}` }}>
                        <Typography sx={{ fontSize: '1.375rem', fontWeight: 600, color: INK, lineHeight: 1 }}>{t?.count ?? 0}</Typography>
                        <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_FAINT, mt: 0.5 }}>{tier}</Typography>
                      </Box>
                    )
                  })}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Right rail */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Decay watch list */}
          <Card>
            <CardContent sx={{ p: '14px 16px !important' }}>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_FAINT, mb: 1.25 }}>Decay watch list</Typography>
              {data ? data.decay_watch.map((m, i) => (
                <Box
                  key={m.member_id}
                  onClick={() => navigate(`/members/${m.member_id}`)}
                  sx={{ py: 1, borderBottom: i < data.decay_watch.length - 1 ? '1px solid rgba(26,31,27,0.06)' : 'none', cursor: 'pointer', '&:hover': { opacity: 0.75 } }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '3px' }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: INK }}>{m.first_name} {m.last_name}</Typography>
                    <Box sx={{ px: 0.75, py: '1px', bgcolor: TIER_COLOR[m.engagement_tier] ? `${TIER_COLOR[m.engagement_tier].replace('0.', '0.0').replace(/,\s*[\d.]+\)/, ', 0.12)')}` : 'rgba(26,31,27,0.05)', borderRadius: '3px' }}>
                      <Typography sx={{ fontSize: '0.5625rem', fontWeight: 600, color: TIER_COLOR[m.engagement_tier] ?? INK_FAINT }}>{m.engagement_tier}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Health bar */}
                    <Box sx={{ flex: 1, height: 3, bgcolor: 'rgba(26,31,27,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${m.health_score}%`, bgcolor: m.health_score < 40 ? 'rgba(139,58,58,0.55)' : m.health_score < 60 ? 'rgba(163,132,88,0.6)' : 'rgba(61,106,75,0.55)', borderRadius: '2px' }} />
                    </Box>
                    <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.75rem', fontWeight: 500, color: INK_QUIET, minWidth: 22, textAlign: 'right' }}>{m.health_score}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.625rem', color: INK_FAINT, mt: '2px' }}>{m.archetype} · ${m.annual_dues?.toLocaleString() ?? '—'}/yr</Typography>
                </Box>
              )) : Array.from({ length: 4 }).map((_, i) => (
                <Box key={i} sx={{ py: 1, borderBottom: i < 3 ? '1px solid rgba(26,31,27,0.06)' : 'none' }}>
                  <Box sx={{ height: 10, width: '60%', bgcolor: PH, borderRadius: '2px', mb: 0.75 }} />
                  <Box sx={{ height: 3, bgcolor: PH, borderRadius: '2px' }} />
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Agent note */}
          <RailCard title="Agent note" dark>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Engagement Autopilot scans daily at 07:00 UTC. Members in Watch or At-Risk tiers for 14+ days surface automatically for re-engagement action.
            </Typography>
          </RailCard>
        </Box>
      </Box>
    </Box>
  )
}
