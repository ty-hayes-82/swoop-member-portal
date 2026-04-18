import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import {
  Bar, SectionTitle,
  INK, INK_QUIET, INK_FAINT, FOREST, BRASS, IVORY_DEEP,
  PH, PH_DARK, SERIF,
} from '../components/WireframeKit'

const CLUB_ID = 'bowling-green-cc'

interface BoardData {
  headline: { members_saved: number; dues_protected: number; service_interventions: number; fb_recovered: number }
  member_saves: Array<{ id: string; from_agent: string; recommendation_type: string; suggested_action: string; member_name: string | null; annual_dues: number; health_score: number; tier: string | null; confirmed_at: string }>
  service_interventions: Array<{ id: string; category: string; resolution_notes: string | null; member_name: string; annual_dues: number; resolved_at: string }>
  operational_saves: Array<{ id: string; recommendation_type: string; suggested_action: string; from_agent: string; confirmed_at: string }>
  meta: { total_decisions: number; billing_total_30d: number }
}

const PACKET_TABS = [
  { num: '01', label: 'Summary' },
  { num: '02', label: 'Member saves' },
  { num: '03', label: 'Service' },
  { num: '04', label: 'Operational' },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

interface ReportData {
  id: number
  month: string
  content: string
  status: string
  generated_at: string
}

export default function Board() {
  const [tab, setTab] = useState(0)
  const [data, setData] = useState<BoardData | null>(null)
  const [report, setReport] = useState<ReportData | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/board?club_id=${CLUB_ID}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
    fetch(`/api/board/report?club_id=${CLUB_ID}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setReport(d) })
      .catch(() => null)
  }, [])

  async function generateReport() {
    setReportLoading(true)
    setReportError(null)
    try {
      const r = await fetch(`/api/board/compile?club_id=${CLUB_ID}`, { method: 'POST' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setReport(d)
    } catch (e) {
      setReportError(e instanceof Error ? e.message : 'Failed to generate report')
    } finally {
      setReportLoading(false)
    }
  }

  const hl = data?.headline

  return (
    <Box>
      {/* Packet header */}
      <Card sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ height: 4, background: `linear-gradient(90deg, ${FOREST} 0%, ${BRASS} 100%)` }} />
        <CardContent sx={{ p: '20px 24px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.75 }}>
                ClubThread · Board Intelligence
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.5rem', color: INK, mb: 0.5 }}>
                Board Intelligence Packet
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>
                Bowling Green CC · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                {data && ` · ${data.meta.total_decisions} GM decisions recorded`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Box
                component="a"
                href={`/api/board/export?club_id=${CLUB_ID}&format=html`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ height: 30, px: 1.25, bgcolor: FOREST, borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer', textDecoration: 'none' }}
              >
                <Typography sx={{ fontSize: '0.75rem', color: '#fff', fontWeight: 500 }}>Export PDF</Typography>
              </Box>
              <Box
                component="a"
                href={`/api/board/export?club_id=${CLUB_ID}&format=txt`}
                download
                sx={{ height: 30, px: 1.25, bgcolor: PH, borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer', textDecoration: 'none' }}
              >
                <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>.txt</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Packet tabs */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: '0 !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {PACKET_TABS.map(({ num, label }, i) => (
              <Box key={label} onClick={() => setTab(i)} sx={{ px: 2, py: 1.5, cursor: 'pointer', bgcolor: i === tab ? FOREST : 'transparent', borderRight: i < 3 ? '1px solid rgba(26,31,27,0.08)' : 'none' }}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: i === tab ? 'rgba(255,255,255,0.55)' : INK_FAINT, mb: 0.5 }}>{num}</Typography>
                <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '0.9375rem', color: i === tab ? '#fff' : INK }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Headline stats — always visible */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', mb: 3 }}>
        {[
          { label: 'Members saved',         value: hl?.members_saved },
          { label: 'Dues protected',         value: hl ? fmt(hl.dues_protected) : null },
          { label: 'Service interventions',  value: hl?.service_interventions },
          { label: 'Billing (30d)',           value: hl ? fmt(hl.fb_recovered) : null },
        ].map(({ label, value }, i) => (
          <Box key={label} sx={{ px: 2.5, py: 2, borderLeft: i > 0 ? '1px solid rgba(26,31,27,0.1)' : 'none' }}>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.75 }}>{label}</Typography>
            {value != null ? (
              <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.75rem', color: INK, lineHeight: 1 }}>{value}</Typography>
            ) : (
              <Box sx={{ height: 32, width: 56, bgcolor: PH_DARK, borderRadius: '3px' }} />
            )}
          </Box>
        ))}
      </Box>

      {/* Summary tab */}
      {tab === 0 && (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: '20px 24px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <SectionTitle>Summary</SectionTitle>
                <Box
                  onClick={reportLoading ? undefined : generateReport}
                  sx={{ height: 30, px: 1.5, bgcolor: reportLoading ? PH : FOREST, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: 1, cursor: reportLoading ? 'default' : 'pointer', flexShrink: 0 }}
                >
                  {reportLoading && <CircularProgress size={12} sx={{ color: '#fff' }} />}
                  <Typography sx={{ fontSize: '0.75rem', color: reportLoading ? INK_FAINT : '#fff', fontWeight: 500 }}>
                    {reportLoading ? 'Generating…' : report ? 'Regenerate report' : 'Generate report'}
                  </Typography>
                </Box>
              </Box>
              {data ? (
                <Typography sx={{ fontSize: '0.9rem', color: INK_QUIET, lineHeight: 1.7 }}>
                  {hl!.members_saved > 0
                    ? `ClubThread identified and actioned ${hl!.members_saved} member retention recommendation${hl!.members_saved > 1 ? 's' : ''}, protecting an estimated ${fmt(hl!.dues_protected)} in annual dues.`
                    : 'No confirmed member save actions yet. Analysts are actively monitoring member health scores and engagement signals.'}
                  {hl!.service_interventions > 0 && ` ${hl!.service_interventions} service intervention${hl!.service_interventions > 1 ? 's' : ''} were actioned, demonstrating operational responsiveness.`}
                  {` ${data.meta.total_decisions} total GM decisions have been recorded in this session.`}
                </Typography>
              ) : (
                <><Bar w="95%" h={10} /><Bar w="88%" h={10} mt={7} /><Bar w="72%" h={10} mt={6} /></>
              )}
              {reportError && (
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(139,58,58,0.8)', mt: 1.5 }}>Error: {reportError}</Typography>
              )}
            </CardContent>
          </Card>

          {report && (
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: '20px 24px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <SectionTitle>{`Draft Board Report — ${report.month}`}</SectionTitle>
                  <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>
                    Generated {new Date(report.generated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
                <Box sx={{ fontFamily: 'inherit', fontSize: '0.875rem', color: INK, lineHeight: 1.75, whiteSpace: 'pre-wrap', borderLeft: `3px solid ${BRASS}`, pl: 2 }}>
                  {report.content}
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Member saves tab */}
      {tab === 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: '20px 24px !important' }}>
            <SectionTitle badge={data ? `${data.member_saves.length} actions` : undefined}>Member saves</SectionTitle>
            {data?.member_saves.length ? data.member_saves.map((s, i) => (
              <Box key={s.id}>
                {i > 0 && <Divider sx={{ my: 1.75 }} />}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      {s.member_name ? (
                        <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.0625rem', color: INK }}>{s.member_name}</Typography>
                      ) : (
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: INK_QUIET }}>{s.recommendation_type.replace(/_/g, ' ')}</Typography>
                      )}
                      <Box sx={{ px: 0.75, py: '2px', bgcolor: IVORY_DEEP, borderRadius: '3px' }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: INK_QUIET }}>{s.from_agent.replace(/_/g, ' ')}</Typography>
                      </Box>
                      {s.tier && (
                        <Box sx={{ px: 0.75, py: '2px', bgcolor: PH, borderRadius: '3px' }}>
                          <Typography sx={{ fontSize: '0.6rem', color: INK_FAINT }}>{s.tier}</Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', color: INK_QUIET, lineHeight: 1.5, mb: 0.75 }}>{s.suggested_action}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>
                      Approved {new Date(s.confirmed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </Box>
                  {s.annual_dues > 0 && (
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.5 }}>Dues</Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#3d6a4b' }}>{fmt(s.annual_dues)}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )) : data ? (
              <Typography sx={{ fontSize: '0.85rem', color: INK_FAINT, py: 1 }}>No confirmed member save actions yet</Typography>
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                <Box key={i}>
                  {i > 0 && <Divider sx={{ my: 1.75 }} />}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}><Bar w="38%" h={11} /><Box sx={{ height: 18, width: 72, bgcolor: PH, borderRadius: '10px' }} /></Box>
                      <Bar w="82%" h={9} /><Bar w="68%" h={9} mt={5} />
                    </Box>
                    <Box sx={{ height: 24, width: 52, bgcolor: PH_DARK, borderRadius: '3px', flexShrink: 0 }} />
                  </Box>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Service tab */}
      {tab === 2 && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: '20px 24px !important' }}>
            <SectionTitle badge={data ? `${data.service_interventions.length} resolved` : undefined}>Service interventions</SectionTitle>
            {data?.service_interventions.length ? data.service_interventions.map((s, i) => (
              <Box key={s.id}>
                {i > 0 && <Divider sx={{ my: 1.75 }} />}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.0625rem', color: INK }}>{s.member_name}</Typography>
                      <Box sx={{ px: 0.75, py: '2px', bgcolor: PH, borderRadius: '3px' }}>
                        <Typography sx={{ fontSize: '0.6rem', color: INK_FAINT }}>{s.category}</Typography>
                      </Box>
                    </Box>
                    {s.resolution_notes && (
                      <Typography sx={{ fontSize: '0.8rem', color: INK_QUIET, lineHeight: 1.5, mb: 0.75 }}>{s.resolution_notes}</Typography>
                    )}
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>
                      Resolved {new Date(s.resolved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.5 }}>Dues</Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: INK }}>{fmt(s.annual_dues)}</Typography>
                  </Box>
                </Box>
              </Box>
            )) : data ? (
              <Typography sx={{ fontSize: '0.85rem', color: INK_FAINT, py: 1 }}>No resolved service interventions yet</Typography>
            ) : (
              Array.from({ length: 3 }).map((_, i) => (
                <Box key={i}>
                  {i > 0 && <Divider sx={{ my: 1.75 }} />}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ flex: 1 }}><Bar w="38%" h={11} /><Bar w="72%" h={9} mt={6} /></Box>
                    <Box sx={{ height: 24, width: 52, bgcolor: PH_DARK, borderRadius: '3px', flexShrink: 0 }} />
                  </Box>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Operational tab */}
      {tab === 3 && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: '20px 24px !important' }}>
            <SectionTitle badge={data ? `${data.operational_saves.length} actions` : undefined}>Operational saves</SectionTitle>
            {data?.operational_saves.length ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                {data.operational_saves.map(s => (
                  <Box key={s.id} sx={{ border: '1px solid rgba(26,31,27,0.08)', borderRadius: '4px', p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                      <Box sx={{ px: 0.75, py: '2px', bgcolor: IVORY_DEEP, borderRadius: '3px' }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: INK_QUIET }}>{s.from_agent.replace(/_/g, ' ')}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>{s.recommendation_type.replace(/_/g, ' ')}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', color: INK, lineHeight: 1.5 }}>{s.suggested_action?.substring(0, 120)}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT, mt: 0.75 }}>
                      {new Date(s.confirmed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : data ? (
              <Typography sx={{ fontSize: '0.85rem', color: INK_FAINT, py: 1 }}>No confirmed operational actions yet</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                {['Staffing', 'Pace', 'Recovery', 'Revenue'].map(label => (
                  <Box key={label} sx={{ border: '1px solid rgba(26,31,27,0.08)', borderRadius: '4px', p: 2 }}>
                    <Bar w="60%" h={8} /><Box sx={{ height: 26, width: 64, bgcolor: PH_DARK, borderRadius: '3px', my: 1 }} /><Bar w="80%" h={9} /><Bar w="60%" h={9} mt={5} />
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Provenance footer */}
      <Card sx={{ bgcolor: FOREST, border: 'none' }}>
        <CardContent sx={{ p: '20px 24px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 2 }}>
            {[
              { label: 'GM decisions',    value: data?.meta.total_decisions },
              { label: 'Member saves',    value: data?.headline.members_saved },
              { label: 'Service actions', value: data?.headline.service_interventions },
              { label: 'Data tier',       value: 'Tier 4' },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', mb: 0.75 }}>{label}</Typography>
                {value != null ? (
                  <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>{value}</Typography>
                ) : (
                  <Box sx={{ height: 24, width: 48, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '3px' }} />
                )}
              </Box>
            ))}
          </Box>
          <Box sx={{ height: 1, bgcolor: 'rgba(255,255,255,0.1)', mb: 1.5 }} />
          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>
            Pre-pilot · Fixture data · Bowling Green CC · ClubThread v1.2
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
