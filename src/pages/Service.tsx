import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import InputBase from '@mui/material/InputBase'
import Button from '@mui/material/Button'
import {
  Bar, PageHeader, SectionTitle, RailCard,
  INK, INK_QUIET, INK_FAINT, FOREST,
  PH, SERIF,
} from '../components/WireframeKit'

const CLUB_ID = 'bowling-green-cc'

interface Complaint {
  id: string
  member_name: string
  annual_dues: number
  tier: string
  health_score: number
  category: string
  description: string
  status: string
  priority: string
  age_hours: number
  reported_at: string
  resolution_notes: string | null
  sla_hours: number
  sla_breached: boolean
  source: string
}

interface ServiceData {
  complaints: Complaint[]
  summary: { open: number; critical: number; resolved_30d: number; sla_breached: number }
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'rgba(139,58,58,0.6)',
  high:     'rgba(166,107,47,0.55)',
  medium:   'rgba(163,132,88,0.45)',
  low:      'rgba(26,31,27,0.2)',
  normal:   'rgba(26,31,27,0.2)',
}

const PRIORITY_BG: Record<string, string> = {
  critical: 'rgba(139,58,58,0.1)',
  high:     'rgba(166,107,47,0.1)',
  medium:   'rgba(163,132,88,0.08)',
  low:      'rgba(26,31,27,0.05)',
  normal:   'rgba(26,31,27,0.05)',
}

function formatAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m ago`
  if (hours < 24) return `${Math.round(hours)}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export default function Service() {
  const [data, setData] = useState<ServiceData | null>(null)
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({})
  const [resolveOpen, setResolveOpen] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/service?club_id=${CLUB_ID}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [])

  async function resolveComplaint(id: string) {
    setResolved(prev => new Set([...prev, id]))
    setResolveOpen(null)
    await fetch(`/api/service/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_notes: resolveNotes[id] ?? '' }),
    }).catch(console.error)
  }

  const summary = data?.summary
  const complaints = data?.complaints ?? []

  return (
    <Box>
      <PageHeader title="Service" />

      {/* Hero callout */}
      {summary && (summary.critical > 0 || summary.sla_breached > 0) ? (
        <Card sx={{ bgcolor: FOREST, border: 'none', mb: 2.5 }}>
          <CardContent sx={{ p: '16px 20px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 500, color: '#fff', mb: 0.5 }}>
                {summary.critical > 0 ? `${summary.critical} critical issue${summary.critical > 1 ? 's' : ''} open` : `${summary.sla_breached} SLA breach${summary.sla_breached > 1 ? 'es' : ''}`}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                {summary.open} open · {summary.resolved_30d} resolved last 30 days
              </Typography>
            </Box>
            <Box sx={{ height: 32, px: 1.5, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Review all</Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ bgcolor: FOREST, border: 'none', mb: 2.5 }}>
          <CardContent sx={{ p: '16px 20px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: SERIF, fontSize: '1rem', fontWeight: 500, color: '#fff', mb: 0.5 }}>
                {data ? 'Service looks clean today' : '…'}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                {summary ? `${summary.open} open · ${summary.resolved_30d} resolved last 30 days` : 'Loading…'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Stat row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 1.5, mb: 3 }}>
        {[
          { label: 'Open',          value: summary?.open ?? null,         accent: false },
          { label: 'Critical',      value: summary?.critical ?? null,     accent: true  },
          { label: 'SLA breached',  value: summary?.sla_breached ?? null, accent: true  },
          { label: 'Resolved / 30d',value: summary?.resolved_30d ?? null, accent: false },
        ].map(({ label, value, accent }) => (
          <Card key={label}>
            <CardContent sx={{ p: '14px 16px !important' }}>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.75 }}>{label}</Typography>
              {value !== null ? (
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: accent && value > 0 ? 'rgba(139,58,58,0.85)' : INK, lineHeight: 1 }}>{value}</Typography>
              ) : (
                <Box sx={{ height: 26, width: 44, bgcolor: PH, borderRadius: '3px' }} />
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Two-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
        <Box>
          {/* Service recovery queue */}
          <Card>
            <CardContent sx={{ p: '20px !important' }}>
              <SectionTitle badge={summary ? `${summary.open} open` : undefined}>Service recovery queue</SectionTitle>
              {complaints.filter(c => !resolved.has(c.id)).length > 0 ? complaints.filter(c => !resolved.has(c.id)).map((c, i, arr) => (
                <Box key={c.id} sx={{ py: 1.25, borderBottom: i < arr.length - 1 ? '1px solid rgba(26,31,27,0.06)' : 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ width: 3, borderRadius: '2px', alignSelf: 'stretch', bgcolor: PRIORITY_COLOR[c.priority] ?? PRIORITY_COLOR.normal, flexShrink: 0, minHeight: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: INK }}>{c.member_name}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>·</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: INK_QUIET }}>{c.category ?? 'General'}</Typography>
                        {c.sla_breached && (
                          <Box sx={{ px: 0.75, py: '1px', bgcolor: 'rgba(139,58,58,0.1)', borderRadius: '3px' }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(139,58,58,0.9)' }}>SLA breach</Typography>
                          </Box>
                        )}
                        {c.source === 'member_message' && (
                          <Box sx={{ px: 0.75, py: '1px', bgcolor: 'rgba(163,132,88,0.1)', borderRadius: '3px' }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#7a5c2e' }}>Member-submitted</Typography>
                          </Box>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: '0.8rem', color: INK, lineHeight: 1.4, mb: 0.5 }}>
                        {c.description?.substring(0, 100)}{(c.description?.length ?? 0) > 100 ? '…' : ''}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>{formatAge(c.age_hours)}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>·</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>SLA {c.sla_hours}h</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>·</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>{c.tier} · ${c.annual_dues.toLocaleString()}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75, flexShrink: 0 }}>
                      <Chip
                        label={c.priority}
                        size="small"
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: PRIORITY_BG[c.priority] ?? PRIORITY_BG.normal, color: c.priority === 'critical' ? 'rgba(139,58,58,0.9)' : INK_FAINT, border: 'none' }}
                      />
                      {c.status === 'open' && (
                        <Box
                          onClick={() => setResolveOpen(resolveOpen === c.id ? null : c.id)}
                          sx={{ height: 20, px: 0.75, bgcolor: 'rgba(61,106,75,0.08)', borderRadius: '3px', display: 'flex', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(61,106,75,0.2)' }}
                        >
                          <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: '#3d6a4b' }}>Resolve</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Inline resolve panel */}
                  {resolveOpen === c.id && (
                    <Box sx={{ mt: 1, ml: 3, display: 'flex', gap: 1, alignItems: 'center' }}>
                      <InputBase
                        value={resolveNotes[c.id] ?? ''}
                        onChange={e => setResolveNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="Resolution notes (optional)"
                        sx={{ flex: 1, fontSize: '0.75rem', color: INK, px: 1, py: 0.5, bgcolor: 'rgba(26,31,27,0.04)', borderRadius: '3px', border: '1px solid rgba(26,31,27,0.12)' }}
                      />
                      <Button
                        size="small"
                        onClick={() => resolveComplaint(c.id)}
                        sx={{ height: 28, px: 1.5, bgcolor: FOREST, color: '#fff', fontSize: '0.7rem', textTransform: 'none', '&:hover': { bgcolor: '#152e22' } }}
                      >Mark resolved</Button>
                      <Box onClick={() => setResolveOpen(null)} sx={{ cursor: 'pointer', px: 0.75, color: INK_FAINT, fontSize: '0.8rem' }}>×</Box>
                    </Box>
                  )}
                </Box>
              )) : data ? (
                <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT, py: 1 }}>No open complaints</Typography>
              ) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, py: 1.25, borderBottom: i < 4 ? '1px solid rgba(26,31,27,0.06)' : 'none' }}>
                    <Box sx={{ width: 3, bgcolor: PRIORITY_COLOR[['critical','high','medium','normal','normal'][i]], borderRadius: '2px', alignSelf: 'stretch', flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Bar w="42%" h={10} />
                        <Box sx={{ height: 22, width: 56, bgcolor: PH, borderRadius: '3px' }} />
                      </Box>
                      <Bar w="70%" h={9} />
                      <Bar w="40%" h={8} mt={5} />
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right rail */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <RailCard title="By priority">
            {[
              { label: 'Critical', value: summary?.critical,         color: 'rgba(139,58,58,0.7)' },
              { label: 'High',     value: complaints.filter(c => c.priority === 'high').length,    color: 'rgba(166,107,47,0.6)' },
              { label: 'Medium',   value: complaints.filter(c => c.priority === 'medium').length,  color: 'rgba(163,132,88,0.5)' },
              { label: 'Low/Normal', value: complaints.filter(c => ['low','normal'].includes(c.priority)).length, color: 'rgba(26,31,27,0.2)' },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.625 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
                  <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>{label}</Typography>
                </Box>
                {value != null ? (
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: INK }}>{value}</Typography>
                ) : <Bar w={24} h={9} />}
              </Box>
            ))}
          </RailCard>

          <RailCard title="Recent resolutions">
            {data ? (
              summary?.resolved_30d === 0 ? (
                <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>None resolved in 30 days</Typography>
              ) : (
                <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>{summary?.resolved_30d} resolved this month</Typography>
              )
            ) : <><Bar w="80%" h={9} /><Bar w="60%" h={8} mt={6} /></>}
          </RailCard>

          <RailCard title="Agent activity" dark>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Service recovery analyst runs every 30 min. Escalates critical issues automatically via agent_handoffs.
            </Typography>
          </RailCard>
        </Box>
      </Box>
    </Box>
  )
}
