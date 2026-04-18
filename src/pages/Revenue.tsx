import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import {
  Bar, PageHeader, SectionTitle, RailCard, TabStrip,
  INK, INK_QUIET, INK_FAINT, FOREST,
  PH, PH_DARK, SERIF,
} from '../components/WireframeKit'

const CLUB_ID = 'bowling-green-cc'
const PERIOD_KEYS = ['7d', '30d', '90d']
const PERIOD_TABS = ['Last 7 days', 'This month', 'Last 90 days']

interface RevenueData {
  period: string
  billing_by_type: Array<{ charge_type: string; total: number; tx_count: number }>
  billing_total: number
  dues: { annual_total: number; member_count: number }
  at_risk: { dues_at_risk: number; member_count: number }
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export default function Revenue() {
  const [period, setPeriod] = useState(1)
  const [data, setData] = useState<RevenueData | null>(null)

  useEffect(() => {
    fetch(`/api/revenue?club_id=${CLUB_ID}&period=${PERIOD_KEYS[period]}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [period])

  const maxBilling = data ? Math.max(...data.billing_by_type.map(b => b.total), 1) : 1

  return (
    <Box>
      <PageHeader title="Revenue" />

      {/* Period tabs */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <TabStrip tabs={PERIOD_TABS} activeIndex={period} onChange={setPeriod} variant="pill" />
        <Box sx={{ height: 28, px: 1.25, bgcolor: PH, borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>Compare periods</Typography>
        </Box>
      </Box>

      {/* Stat row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 1.5, mb: 3 }}>
        {[
          { label: 'Billing total',     value: data ? fmt(data.billing_total)         : null, sub: `${data?.billing_by_type.reduce((s, b) => s + b.tx_count, 0) ?? '—'} transactions` },
          { label: 'Annual dues total', value: data ? fmt(data.dues.annual_total)      : null, sub: `${data?.dues.member_count ?? '—'} active members` },
          { label: 'Dues at risk',      value: data ? fmt(data.at_risk.dues_at_risk)   : null, sub: `${data?.at_risk.member_count ?? '—'} at-risk/inactive` },
          { label: 'Avg dues / member', value: data && data.dues.member_count > 0 ? fmt(Math.round(data.dues.annual_total / data.dues.member_count)) : null, sub: 'annualized' },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <CardContent sx={{ p: '14px 16px !important' }}>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.75 }}>{label}</Typography>
              {value !== null ? (
                <>
                  <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, color: INK, lineHeight: 1, mb: 0.5 }}>{value}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>{sub}</Typography>
                </>
              ) : (
                <><Box sx={{ height: 26, width: 72, bgcolor: PH_DARK, borderRadius: '3px', mb: 0.5 }} /><Bar w={80} h={8} /></>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Two-column layout */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        <Box>
          {/* Billing by charge type */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: '20px !important' }}>
              <SectionTitle>Billing by type</SectionTitle>
              {data?.billing_by_type.length ? (
                <>
                  <Box sx={{ height: 36, mb: 2 }}>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: INK, lineHeight: 1 }}>{fmt(data.billing_total)}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>total · {PERIOD_TABS[period].toLowerCase()}</Typography>
                  </Box>
                  {data.billing_by_type.map(b => (
                    <Box key={b.charge_type} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Typography sx={{ width: 140, fontSize: '0.75rem', color: INK_QUIET, flexShrink: 0, textTransform: 'capitalize' }}>
                        {b.charge_type.replace(/_/g, ' ')}
                      </Typography>
                      <Box sx={{ flex: 1, height: 12, bgcolor: PH, borderRadius: '3px', overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${Math.round((b.total / maxBilling) * 100)}%`, bgcolor: FOREST, borderRadius: '3px', opacity: 0.6 }} />
                      </Box>
                      <Typography sx={{ width: 72, fontSize: '0.8rem', fontWeight: 600, color: INK, textAlign: 'right', flexShrink: 0 }}>
                        {fmt(b.total)}
                      </Typography>
                      <Typography sx={{ width: 40, fontSize: '0.65rem', color: INK_FAINT, textAlign: 'right', flexShrink: 0 }}>
                        {b.tx_count}×
                      </Typography>
                    </Box>
                  ))}
                </>
              ) : data ? (
                <Typography sx={{ fontSize: '0.85rem', color: INK_FAINT, py: 1 }}>No billing data for this period</Typography>
              ) : (
                <>
                  <Box sx={{ height: 36, width: 100, bgcolor: PH_DARK, borderRadius: '3px', mb: 2 }} />
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
                      <Bar w={100} h={9} />
                      <Box sx={{ flex: 1, height: 12, bgcolor: PH, borderRadius: '3px', overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${[55, 30, 15][i]}%`, bgcolor: PH_DARK, borderRadius: '3px' }} />
                      </Box>
                      <Bar w={44} h={9} />
                    </Box>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Dues at risk */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: '20px !important' }}>
              <SectionTitle>Dues exposure</SectionTitle>
              {data ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.5 }}>Total dues base</Typography>
                    <Typography sx={{ fontFamily: SERIF, fontSize: '1.75rem', fontWeight: 500, color: INK }}>{fmt(data.dues.annual_total)}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: INK_FAINT, mt: 0.25 }}>{data.dues.member_count} active members</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.5 }}>At-risk / inactive</Typography>
                    <Typography sx={{ fontFamily: SERIF, fontSize: '1.75rem', fontWeight: 500, color: data.at_risk.dues_at_risk > 0 ? 'rgba(166,107,47,0.9)' : INK }}>
                      {fmt(data.at_risk.dues_at_risk)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: INK_FAINT, mt: 0.25 }}>{data.at_risk.member_count} members</Typography>
                  </Box>
                  {data.dues.annual_total > 0 && (
                    <Box sx={{ gridColumn: '1 / -1' }}>
                      <Box sx={{ height: 8, bgcolor: PH, borderRadius: '4px', overflow: 'hidden', mb: 0.75 }}>
                        <Box sx={{ height: '100%', width: `${Math.round((data.at_risk.dues_at_risk / data.dues.annual_total) * 100)}%`, bgcolor: 'rgba(166,107,47,0.5)', borderRadius: '4px' }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>
                        {Math.round((data.at_risk.dues_at_risk / data.dues.annual_total) * 100)}% of dues base at risk
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  {[0, 1].map(i => <Box key={i}><Bar w="60%" h={9} /><Box sx={{ height: 32, width: 96, bgcolor: PH_DARK, borderRadius: '3px', mt: 1, mb: 0.5 }} /><Bar w="50%" h={8} /></Box>)}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right rail */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <RailCard title="Revenue streams">
            {data?.billing_by_type.length ? data.billing_by_type.map(b => (
              <Box key={b.charge_type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.625 }}>
                <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET, textTransform: 'capitalize' }}>{b.charge_type.replace(/_/g, ' ')}</Typography>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: INK }}>{fmt(b.total)}</Typography>
              </Box>
            )) : Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.625 }}>
                <Bar w="55%" h={9} />
                <Bar w={44} h={9} />
              </Box>
            ))}
          </RailCard>

          <RailCard title="Agent note" dark>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
              Revenue analyst runs daily at 06:00 UTC. Surfaces F&B leakage and capture opportunities via agent_handoffs.
            </Typography>
            {data && (
              <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mt: 1 }}>
                Billing data from {data.billing_by_type.reduce((s, b) => s + b.tx_count, 0)} transactions
              </Typography>
            )}
          </RailCard>
        </Box>
      </Box>
    </Box>
  )
}
