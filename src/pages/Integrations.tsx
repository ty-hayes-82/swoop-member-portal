import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import {
  Bar,
  INK, INK_QUIET, INK_FAINT, FOREST, BRASS, IVORY_DEEP,
  PH_DARK, SERIF, MONO,
} from '../components/WireframeKit'

const CLUB_ID = 'bowling-green-cc'

interface IntegrationStatus {
  readiness_score: number
  member_count: number
  last_sync: string | null
  days_since_sync: number | null
  integrations: {
    id: string
    name: string
    status: string
    status_label: string
    count: number
  }[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const INTEGRATIONS = [
  { letter: 'J', name: 'Jonas Club Management', mcp: 'mcp_jonas',        modules: ['JCM', 'TTM', 'POS', 'JAM', 'CHO'],        status: 'connected', expanded: true  },
  { letter: 'F', name: 'ForeTees',               mcp: 'mcp_foretees',     modules: ['Tee sheet', 'Pace', 'Waitlist'],            status: 'connected', expanded: false },
  { letter: 'T', name: 'Toast POS',              mcp: 'mcp_toast',        modules: ['Checks', 'Covers', 'Tips', 'Menu'],         status: 'connected', expanded: false },
  { letter: 'C', name: 'Clubessential',          mcp: 'mcp_clubessential',modules: ['Email', 'Campaigns', 'Opens'],              status: 'connected', expanded: false },
  { letter: 'W', name: 'Weather API',            mcp: 'mcp_weather',      modules: ['NOAA', 'Tomorrow.io'],                      status: 'connected', expanded: false },
  { letter: 'H', name: 'HR roster & scheduling', mcp: 'mcp_hr',           modules: ['Staff', 'Availability', 'Shifts'],          status: 'csv-only',  expanded: false },
  { letter: 'A', name: 'Club Automation',        mcp: 'mcp_clubauto',     modules: ['SWPMEM', 'SWPTEE', 'SWPPOS', 'SWPACT'],     status: 'partial',   expanded: false },
  { letter: 'S', name: 'Twilio SMS',             mcp: 'mcp_sms',          modules: ['10DLC registered', 'Outbound'],             status: 'connected', expanded: false },
  { letter: 'Q', name: 'QuickBooks / GL',        mcp: 'mcp_accounting',   modules: ['Dues receivables', 'GL export'],            status: 'pending',   expanded: false },
]

const STATUS_COLORS: Record<string, string> = {
  connected: 'rgba(61,106,75,0.85)',
  'csv-only': '#a38458',
  partial:    'rgba(138,107,47,0.82)',
  error:      'rgba(139,58,58,0.82)',
  pending:    '#95988f',
}

const STATUS_LABELS: Record<string, string> = {
  connected: 'Connected · API',
  'csv-only': 'CSV-only · last upload 9d ago',
  partial:    'Partial · events only',
  error:      'Error · reconnect',
  pending:    'Not connected · optional',
}

const NEEDS_LIST = [
  { check: '✓', ok: true  as true  | false | null, name: 'Member roster',         sub: '2,147 records synced'       },
  { check: '✓', ok: true  as true  | false | null, name: 'Tee sheet + pace',       sub: 'live feed'                  },
  { check: '✓', ok: true  as true  | false | null, name: 'F&B transactions',       sub: 'live feed'                  },
  { check: '✓', ok: true  as true  | false | null, name: 'Email engagement',       sub: 'live feed'                  },
  { check: '◐', ok: null  as true  | false | null, name: 'Staff roster & shifts',  sub: 'CSV · 9 days stale'         },
  { check: '◐', ok: null  as true  | false | null, name: 'Event attendance',       sub: 'partial · CA events only'   },
  { check: '✗', ok: false as true  | false | null, name: 'GL / dues receivables',  sub: 'optional · enables accounting agent' },
]

const GATED_AGENTS = [
  { name: 'Member Pulse',         req: 'roster + engagement',    status: 'ready'   },
  { name: 'Revenue Analyst',      req: 'POS + tee sheet',        status: 'ready'   },
  { name: 'Labor Optimizer',      req: 'roster + shifts + history', status: 'partial' },
  { name: 'Service Recovery',     req: 'complaints + covers',    status: 'ready'   },
  { name: 'Engagement Autopilot', req: 'email + campaigns',      status: 'ready'   },
  { name: 'Controller agent',     req: 'GL / receivables',       status: 'blocked' },
]

const AGENT_STATUS_COLOR: Record<string, string> = {
  ready:   'rgba(61,106,75,0.85)',
  partial: 'rgba(138,107,47,0.82)',
  blocked: 'rgba(139,58,58,0.82)',
}

const MAP_ROWS = [
  { source: 'MEMBER.MemberID',          type: 'primary key · numeric',            target: 'Member · external_id',         conf: 100, quality: 'Clean',       qColor: 'rgba(61,106,75,0.85)'    },
  { source: 'MEMBER.Email_Primary',     type: 'string · 94% populated',           target: 'Member · primary email',       conf: 98,  quality: '6% empty',    qColor: '#a66b2f'                  },
  { source: 'MEMBER.Phone_Home',        type: 'string · inconsistent format',     target: 'Member · phone',               conf: 76,  quality: '23 malformed',qColor: 'rgba(139,58,58,0.82)'    },
  { source: 'MEMBER.Mbrshp_Type',       type: 'enum · 14 values',                 target: 'Member · tier',                conf: 94,  quality: '3 legacy',    qColor: '#a66b2f'                  },
  { source: 'MEMBER.DOB',              type: 'date · 63% populated',             target: 'Member · birthdate',           conf: 100, quality: '37% empty',   qColor: '#a66b2f'                  },
  { source: 'TEETIME.BookingID',        type: 'primary key · numeric',            target: 'Tee Time · external_id',       conf: 100, quality: 'Clean',       qColor: 'rgba(61,106,75,0.85)'    },
  { source: 'POS.CheckTotal_Net',       type: 'decimal · 2,847 rows',             target: 'Check · net_amount',           conf: 100, quality: 'Clean',       qColor: 'rgba(61,106,75,0.85)'    },
  { source: 'POS.ServerID',            type: 'legacy + current mixed',            target: 'Check · server (review)',      conf: 42,  quality: 'Manual',      qColor: 'rgba(139,58,58,0.82)'    },
]

const MAP_FILTERS = ['All 447', 'Needs review 18', 'Unmapped 8', 'JCM', 'TTM', 'POS', 'JAM', 'CHO']

// ─── Readiness Gauge ──────────────────────────────────────────────────────────
function ReadinessGauge({ status }: { status: IntegrationStatus | null }) {
  const score = status?.readiness_score ?? null
  const connectedCount = status?.integrations.filter(i => i.status === 'connected').length ?? 0
  const pendingCount = status?.integrations.filter(i => i.status === 'pending').length ?? 0
  const totalCount = status?.integrations.length ?? 0

  return (
    <Box sx={{ bgcolor: FOREST, borderRadius: '3px', p: '22px 24px', minWidth: 300, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5, pb: 1.5, borderBottom: '1px solid rgba(244,240,232,0.12)' }}>
        <Typography sx={{ fontSize: '0.625rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,165,115,0.85)', fontWeight: 500 }}>Data readiness</Typography>
        <Box sx={{ bgcolor: 'rgba(164,132,88,0.2)', borderRadius: '2px', px: 1, py: '2px' }}>
          <Typography sx={{ fontFamily: MONO, fontSize: '0.625rem', color: 'rgba(196,165,115,0.85)', letterSpacing: '0.04em' }}>Pilot-ready at 70+</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2.5, alignItems: 'center', mb: 1.5 }}>
        <Box>
          {score !== null ? (
            <>
              <Typography component="span" sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '4rem', color: 'rgba(196,165,115,0.9)', lineHeight: 1, letterSpacing: '-0.03em' }}>{score}</Typography>
              <Typography component="span" sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.25rem', color: 'rgba(244,240,232,0.4)' }}>/100</Typography>
            </>
          ) : (
            <Box sx={{ width: 72, height: 64, bgcolor: 'rgba(244,240,232,0.1)', borderRadius: '3px' }} />
          )}
        </Box>
        <Box>
          {status ? (
            <>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                {status.member_count} members loaded
              </Typography>
              {status.days_since_sync != null && (
                <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  Last sync: {status.days_since_sync}d ago
                </Typography>
              )}
            </>
          ) : (
            <>
              <Bar w="90%" h={9} />
              <Bar w="75%" h={9} mt={5} />
            </>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', pt: 1.5, borderTop: '1px dashed rgba(244,240,232,0.12)' }}>
        {[
          [String(connectedCount), 'Connected'],
          [String(totalCount - connectedCount - pendingCount), 'Partial'],
          [String(pendingCount), 'Pending'],
        ].map(([num, label], i) => (
          <Box key={label} sx={{ px: 1.5, borderRight: i < 2 ? '1px solid rgba(244,240,232,0.08)' : 'none', '&:first-of-type': { pl: 0 }, '&:last-of-type': { pr: 0 } }}>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.125rem', color: 'rgba(196,165,115,0.9)', lineHeight: 1, letterSpacing: '-0.01em', mb: '3px' }}>{num}</Typography>
            <Typography sx={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(244,240,232,0.48)', fontWeight: 500 }}>{label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// ─── Integration card ─────────────────────────────────────────────────────────
function IntegrationCard({ letter, name, mcp, modules, status, expanded }: typeof INTEGRATIONS[0]) {
  const borderColor = STATUS_COLORS[status] || PH_DARK
  return (
    <Card sx={{ mb: 1.25, overflow: 'hidden', borderLeft: `3px solid ${borderColor}` }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 2, px: 2.25, py: '14px', alignItems: 'center', cursor: 'pointer' }}>
        <Box sx={{ width: 40, height: 40, bgcolor: IVORY_DEEP, border: '1px solid rgba(26,31,27,0.12)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.0625rem', color: status === 'pending' ? INK_FAINT : FOREST }}>{letter}</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.0625rem', color: status === 'pending' ? INK_QUIET : INK, letterSpacing: '-0.01em', lineHeight: 1.2, mb: '4px' }}>{name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography sx={{ fontFamily: MONO, fontSize: '0.625rem', color: BRASS, letterSpacing: '0.02em' }}>{mcp}</Typography>
            <Typography sx={{ color: INK_FAINT, fontSize: '0.7rem' }}>·</Typography>
            {modules.map(m => (
              <Box key={m} sx={{ bgcolor: IVORY_DEEP, borderRadius: '2px', px: 0.75, py: '2px' }}>
                <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, color: INK_QUIET }}>{m}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: borderColor }} />
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: borderColor, whiteSpace: 'nowrap' }}>{STATUS_LABELS[status]}</Typography>
        </Box>
        <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.125rem', color: expanded ? BRASS : INK_FAINT, transform: expanded ? 'rotate(90deg)' : 'none', lineHeight: 1 }}>›</Typography>
      </Box>

      {expanded && (
        <Box sx={{ borderTop: '1px solid rgba(26,31,27,0.07)' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* API side */}
            <Box sx={{ p: '20px 22px', bgcolor: 'rgba(26,31,27,0.02)', borderRight: '1px solid rgba(26,31,27,0.07)' }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5, pb: 1.25, borderBottom: '1px dashed rgba(26,31,27,0.08)' }}>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '0.9375rem', color: FOREST }}>API connection</Typography>
                <Box sx={{ bgcolor: 'rgba(61,106,75,0.08)', borderRadius: '2px', px: 1, py: '2px' }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.625rem', color: 'rgba(61,106,75,0.85)', letterSpacing: '0.04em', fontWeight: 500 }}>Live</Typography>
                </Box>
              </Box>
              {['Auth type', 'Client ID', 'Secret', 'Token valid', 'Last sync', 'Scope'].map((label, i) => (
                <Box key={label} sx={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 1.25, py: 0.75, alignItems: 'baseline' }}>
                  <Typography sx={{ fontSize: '0.5625rem', color: INK_QUIET, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>{label}</Typography>
                  <Bar w={`${[52, 84, 44, 58, 48, 90][i]}%`} h={9} />
                </Box>
              ))}
              <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
                {[['Test connection', FOREST, '#fff'], ['Edit scope', 'transparent', INK_QUIET], ['Rotate secret', 'transparent', INK_QUIET], ['Disconnect', 'rgba(139,58,58,0.04)', 'rgba(139,58,58,0.8)']].map(([btn, bg, color]) => (
                  <Box key={btn} sx={{ height: 26, px: 1.25, bgcolor: bg, border: `1px solid ${bg === FOREST ? FOREST : btn === 'Disconnect' ? 'rgba(139,58,58,0.25)' : 'rgba(26,31,27,0.12)'}`, borderRadius: '2px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color }}>{btn}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* CSV side */}
            <Box sx={{ p: '20px 22px' }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5, pb: 1.25, borderBottom: '1px dashed rgba(26,31,27,0.08)' }}>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '0.9375rem', color: FOREST }}>CSV fallback</Typography>
                <Box sx={{ bgcolor: 'rgba(233,220,192,0.65)', borderRadius: '2px', px: 1, py: '2px' }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.625rem', color: BRASS, letterSpacing: '0.04em', fontWeight: 500 }}>Monthly catch-up</Typography>
                </Box>
              </Box>
              <Bar w="92%" h={8} />
              <Bar w="78%" h={8} mt={5} />
              <Box sx={{ border: '2px dashed rgba(26,31,27,0.12)', borderRadius: '3px', p: '18px 16px', textAlign: 'center', mt: 1.5, bgcolor: 'rgba(244,240,232,0.5)', cursor: 'pointer' }}>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.5rem', color: BRASS, mb: 0.75, lineHeight: 1 }}>§</Typography>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '0.875rem', color: INK, mb: 0.5 }}>Drop Jonas exports</Typography>
                <Bar w="60%" h={7} />
              </Box>
              <Box sx={{ mt: 1.25, p: '8px 12px', bgcolor: 'rgba(26,31,27,0.02)', border: '1px solid rgba(26,31,27,0.08)', borderRadius: '2px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 1.25, alignItems: 'center' }}>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1rem', color: BRASS, lineHeight: 1 }}>§</Typography>
                <Box><Bar w="75%" h={9} /><Bar w="55%" h={7} mt={4} /></Box>
                <Box sx={{ bgcolor: 'rgba(61,106,75,0.08)', borderRadius: '2px', px: 0.75, py: '2px' }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', letterSpacing: '0.04em', fontWeight: 500, color: 'rgba(61,106,75,0.85)', textTransform: 'uppercase' }}>447/447 mapped</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  )
}

// ─── Field Mapping Panel ──────────────────────────────────────────────────────
function FieldMappingPanel() {
  return (
    <Card sx={{ mt: 2.5, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 2.75, py: 2.25, bgcolor: 'rgba(26,31,27,0.02)', borderBottom: '1px solid rgba(26,31,27,0.1)', flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.0625rem', color: INK, lineHeight: 1.2, mb: '4px' }}>Jonas → ClubThread · field mapping</Typography>
          <Bar w={300} h={8} />
        </Box>
        <Box sx={{ display: 'flex', gap: 2.25, alignItems: 'baseline' }}>
          {[['421', 'auto-mapped', 'rgba(61,106,75,0.85)'], ['18', 'needs review', '#a66b2f'], ['8', 'unmapped', INK_QUIET]].map(([num, label, color], i) => (
            <Box key={label} sx={{ textAlign: 'right', pr: 2.25, borderRight: i < 2 ? '1px solid rgba(26,31,27,0.1)' : 'none', '&:last-of-type': { pr: 0 } }}>
              <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.25rem', color, lineHeight: 1, letterSpacing: '-0.01em', mb: '4px' }}>{num}</Typography>
              <Typography sx={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_FAINT, fontWeight: 500 }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Filter chips */}
      <Box sx={{ display: 'flex', gap: 0.5, px: 2.75, py: 1.25, bgcolor: 'rgba(26,31,27,0.02)', borderBottom: '1px solid rgba(26,31,27,0.06)', flexWrap: 'wrap' }}>
        {MAP_FILTERS.map((f, i) => (
          <Box key={f} sx={{ px: 1.5, py: 0.625, bgcolor: i === 0 ? FOREST : 'transparent', borderRadius: '2px', border: `1px solid ${i === 0 ? FOREST : 'transparent'}`, cursor: 'pointer' }}>
            <Typography sx={{ fontSize: '0.6875rem', color: i === 0 ? '#fff' : INK_QUIET, fontWeight: i === 0 ? 500 : 400 }}>{f}</Typography>
          </Box>
        ))}
      </Box>

      {/* Quality repair banner */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, px: 2.75, py: 1.5, bgcolor: 'rgba(166,107,47,0.05)', borderBottom: '1px solid rgba(26,31,27,0.06)', alignItems: 'center' }}>
        <Box><Bar w="90%" h={9} /><Bar w="70%" h={8} mt={4} /></Box>
        <Box sx={{ height: 26, width: 128, bgcolor: BRASS, borderRadius: '2px', flexShrink: 0 }} />
      </Box>

      {/* Household detection */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 2, px: 2.75, py: 1.5, bgcolor: 'rgba(233,220,192,0.28)', borderBottom: '1px solid rgba(26,31,27,0.06)', alignItems: 'center' }}>
        <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.625rem', color: BRASS, lineHeight: 1 }}>§</Typography>
        <Box><Bar w="72%" h={9} /><Bar w="88%" h={8} mt={4} /></Box>
        <Box sx={{ height: 26, width: 100, border: '1px solid rgba(26,31,27,0.12)', borderRadius: '2px', flexShrink: 0 }} />
      </Box>

      {/* Table header */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 28px 1fr 80px 90px 56px', gap: 1.75, px: 2.75, py: 1.25, bgcolor: 'rgba(26,31,27,0.02)', borderBottom: '1px solid rgba(26,31,27,0.08)' }}>
        {['Source field (Jonas)', '', 'ClubThread model', 'Confidence', 'Quality', ''].map((h, i) => (
          <Typography key={i} sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_FAINT }}>{h}</Typography>
        ))}
      </Box>

      {/* Rows */}
      {MAP_ROWS.map(({ source, type, target, conf, quality, qColor }) => (
        <Box key={source} sx={{ display: 'grid', gridTemplateColumns: '1fr 28px 1fr 80px 90px 56px', gap: 1.75, px: 2.75, py: 1.25, borderBottom: '1px solid rgba(26,31,27,0.05)', alignItems: 'center' }}>
          <Box>
            <Typography sx={{ fontFamily: MONO, fontSize: '0.6875rem', color: INK, fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1.3 }}>{source}</Typography>
            <Typography sx={{ fontSize: '0.5625rem', color: INK_FAINT, mt: '2px' }}>{type}</Typography>
          </Box>
          <Typography sx={{ textAlign: 'center', color: conf > 60 ? BRASS : INK_FAINT, fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.875rem' }}>{conf > 60 ? '→' : '—'}</Typography>
          <Box>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '0.8125rem', color: FOREST, letterSpacing: '-0.01em' }}>{target}</Typography>
            <Bar w="55%" h={7} mt={3} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ flex: 1, height: 3, bgcolor: 'rgba(26,31,27,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${conf}%`, bgcolor: conf >= 90 ? 'rgba(61,106,75,0.65)' : conf >= 70 ? 'rgba(138,107,47,0.65)' : 'rgba(139,58,58,0.65)', borderRadius: '2px' }} />
            </Box>
            <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', color: INK_FAINT, letterSpacing: '0.02em', minWidth: 26 }}>{(conf / 100).toFixed(2)}</Typography>
          </Box>
          <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', letterSpacing: '0.04em', fontWeight: 500, textTransform: 'uppercase', color: qColor }}>{quality}</Typography>
          <Typography sx={{ fontSize: '0.625rem', color: BRASS, cursor: 'pointer', fontWeight: 500 }}>Edit</Typography>
        </Box>
      ))}

      {/* Footer */}
      <Box sx={{ px: 2.75, py: 1.75, textAlign: 'center', bgcolor: 'rgba(26,31,27,0.02)', borderTop: '1px solid rgba(26,31,27,0.06)' }}>
        <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.75rem', color: INK_QUIET }}>
          Showing 8 of 447 rows ·{' '}
          <span style={{ color: BRASS, fontWeight: 500, cursor: 'pointer' }}>expand all</span>
          {' · '}
          <span style={{ color: BRASS, fontWeight: 500, cursor: 'pointer' }}>export mapping</span>
        </Typography>
      </Box>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Integrations() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null)

  useEffect(() => {
    fetch(`/api/integrations?club_id=${CLUB_ID}`)
      .then(r => r.json())
      .then(setStatus)
      .catch(console.error)
  }, [])

  return (
    <Box>
      {/* Page header + readiness gauge */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 4, alignItems: 'start', mb: 3 }}>
        <Box>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.75rem', color: INK, lineHeight: 1.2, mb: 0.75 }}>
            Connect the <em style={{ fontStyle: 'italic', color: FOREST }}>source systems</em>.
          </Typography>
          {status ? (
            <>
              <Typography sx={{ fontSize: '0.875rem', color: INK_QUIET, lineHeight: 1.5, mb: 0.5 }}>
                {status.member_count} members loaded · {status.integrations.filter(i => i.status === 'connected').length} of {status.integrations.length} integrations active
              </Typography>
              {status.days_since_sync != null && (
                <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>
                  Last Jonas sync: {status.days_since_sync === 0 ? 'today' : `${status.days_since_sync} days ago`}
                </Typography>
              )}
            </>
          ) : (
            <>
              <Bar w="90%" h={9} />
              <Bar w="75%" h={9} mt={5} />
              <Bar w="62%" h={9} mt={5} />
            </>
          )}
        </Box>
        <ReadinessGauge status={status} />
      </Box>

      {/* Path explainer */}
      <Card sx={{ mb: 3, borderLeft: `3px solid ${BRASS}`, overflow: 'hidden' }}>
        <CardContent sx={{ p: '14px 18px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
            {[{ label: 'Path A · API', title: 'Live connection' }, { label: 'Path B · CSV', title: 'Upload what you have' }].map(({ label, title }, i) => (
              <Box key={label} sx={{ pl: i === 0 ? 0 : 2, pr: i === 0 ? 2 : 0, borderRight: i === 0 ? '1px dashed rgba(26,31,27,0.1)' : 'none' }}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: BRASS, mb: 0.75 }}>§ {label}</Typography>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '0.9375rem', color: INK, mb: 0.5 }}>{title}</Typography>
                <Bar w="90%" h={8} />
                <Bar w="75%" h={8} mt={4} />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Main 2-col grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.25, pb: 1, borderBottom: '1px solid rgba(26,31,27,0.07)' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25 }}>
              <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.8125rem', color: BRASS }}>i.</Typography>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.1875rem', color: INK, letterSpacing: '-0.01em' }}>Source systems</Typography>
            </Box>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.75rem', color: INK_QUIET }}>9 integrations · click to configure</Typography>
          </Box>

          {INTEGRATIONS.map(int => <IntegrationCard key={int.name} {...int} />)}
          <FieldMappingPanel />
        </Box>

        {/* Right rail */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

          {/* What ClubThread needs */}
          <Card>
            <CardContent sx={{ p: '14px 16px !important' }}>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: BRASS, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>§ What ClubThread needs</Typography>
              <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.75rem', color: INK_QUIET, mb: 1.5, lineHeight: 1.5 }}>Minimum data categories. Agents light up as each lands.</Typography>
              {NEEDS_LIST.map(({ check, ok, name, sub }) => {
                const color = ok === true ? 'rgba(61,106,75,0.85)' : ok === false ? 'rgba(139,58,58,0.8)' : 'rgba(138,107,47,0.8)'
                return (
                  <Box key={name} sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1.25, py: 0.875, borderBottom: '1px solid rgba(26,31,27,0.05)', '&:last-of-type': { borderBottom: 'none', pb: 0 }, alignItems: 'start' }}>
                    <Typography sx={{ fontFamily: MONO, fontSize: '0.6875rem', fontWeight: 500, color, mt: '1px' }}>{check}</Typography>
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: INK, lineHeight: 1.3 }}>{name}</Typography>
                      <Typography sx={{ fontSize: '0.625rem', color: INK_FAINT, mt: '2px', lineHeight: 1.4 }}>{sub}</Typography>
                    </Box>
                  </Box>
                )
              })}
            </CardContent>
          </Card>

          {/* Agents ready state */}
          <Card>
            <CardContent sx={{ p: '14px 16px !important' }}>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: BRASS, mb: 1 }}>§ Agents · ready state</Typography>
              <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.75rem', color: INK_QUIET, mb: 1.5, lineHeight: 1.5 }}>Each agent lights up when its required data arrives.</Typography>
              {GATED_AGENTS.map(({ name, req, status }) => (
                <Box key={name} sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 1.25, py: 0.875, borderBottom: '1px solid rgba(26,31,27,0.05)', alignItems: 'center', '&:last-of-type': { borderBottom: 'none', pb: 0 } }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: AGENT_STATUS_COLOR[status], flexShrink: 0 }} />
                  <Box>
                    <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '0.8125rem', color: FOREST, lineHeight: 1.2 }}>{name}</Typography>
                    <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', color: INK_FAINT, letterSpacing: '0.02em', mt: '2px' }}>needs: {req}</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.6875rem', fontWeight: 500, color: AGENT_STATUS_COLOR[status], letterSpacing: '0.02em', textTransform: 'capitalize' }}>{status}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Sync activity */}
          <Card sx={{ bgcolor: FOREST, border: 'none' }}>
            <CardContent sx={{ p: '14px 16px !important' }}>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,165,115,0.85)', mb: 1.5 }}>§ Sync activity · last 24h</Typography>
              {Array.from({ length: 6 }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, py: 0.625, borderBottom: i < 5 ? '1px solid rgba(244,240,232,0.07)' : 'none', alignItems: 'baseline' }}>
                  <Box sx={{ height: 8, width: 28, bgcolor: 'rgba(244,240,232,0.2)', borderRadius: '2px', flexShrink: 0, mt: '2px' }} />
                  <Bar w={i % 2 === 0 ? '80%' : '65%'} h={8} />
                </Box>
              ))}
            </CardContent>
          </Card>

        </Box>
      </Box>
    </Box>
  )
}
