import { useState, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Switch from '@mui/material/Switch'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useNavigate } from 'react-router-dom'
import { INK, INK_QUIET, INK_FAINT, FOREST, BRASS, SERIF, MONO } from '../components/WireframeKit'

const TIMEZONES = ['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix','Pacific/Honolulu']

const ANALYST_AGENTS = [
  { id: 'member_pulse_analyst',    name: 'Member Pulse',          desc: 'Health scoring · runs hourly' },
  { id: 'service_recovery_analyst',name: 'Service Recovery',      desc: 'Complaint queue · runs every 30 min' },
  { id: 'revenue_analyst',         name: 'Revenue Analyst',       desc: 'F&B leakage · runs daily at 6 AM' },
  { id: 'labor_optimizer',         name: 'Labor Optimizer',       desc: 'Staffing · runs daily at 5 AM' },
  { id: 'engagement_autopilot',    name: 'Engagement Autopilot',  desc: 'Re-engagement · runs daily at 7 AM' },
]

interface TierSummary { tier: string; count: number }
interface IngestResult {
  club_id: string
  total_rows: number
  inserted: number
  errors: string[]
  tier_summary: TierSummary[]
  message: string
}

const TIER_COLOR: Record<string, string> = {
  Thriving: 'rgba(61,106,75,0.75)',
  Engaged:  'rgba(61,106,75,0.4)',
  Watch:    'rgba(163,132,88,0.6)',
  'At-Risk':'rgba(166,107,47,0.75)',
  Inactive: 'rgba(139,58,58,0.65)',
}

const STEPS = ['Club info', 'Upload Jonas CSV', 'Activate agents', 'Done']

function StepIndicator({ current }: { current: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mb: 4 }}>
      {STEPS.map((label, i) => {
        const done    = i < current
        const active  = i === current
        return (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: done ? FOREST : active ? FOREST : 'rgba(26,31,27,0.08)',
                border: active ? `2px solid ${BRASS}` : 'none',
              }}>
                {done ? (
                  <Typography sx={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>✓</Typography>
                ) : (
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.625rem', fontWeight: 600, color: active ? '#fff' : INK_FAINT }}>{i + 1}</Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: active ? 600 : 400, color: active ? INK : INK_FAINT, textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</Typography>
            </Box>
            {i < STEPS.length - 1 && (
              <Box sx={{ flex: 1, height: 1, bgcolor: i < current ? FOREST : 'rgba(26,31,27,0.12)', mx: 1, mb: 2 }} />
            )}
          </Box>
        )
      })}
    </Box>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  // Step 0: Club info
  const [clubId, setClubId]     = useState('')
  const [clubName, setClubName] = useState('')
  const [timezone, setTimezone] = useState('America/Chicago')
  const [gmName, setGmName]     = useState('')
  const [gmEmail, setGmEmail]   = useState('')
  const [gmPhone, setGmPhone]   = useState('')
  const [savingClub, setSavingClub] = useState(false)

  // Step 1: CSV upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvFile, setCsvFile]       = useState<File | null>(null)
  const [ingesting, setIngesting]   = useState(false)
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null)
  const [ingestError, setIngestError]   = useState<string | null>(null)

  // Step 2: Activate
  const [selectedAgents, setSelectedAgents] = useState<Record<string, boolean>>(
    Object.fromEntries(ANALYST_AGENTS.map(a => [a.id, true]))
  )
  const [activating, setActivating]   = useState(false)
  const [activateResult, setActivateResult] = useState<{ activated: string[]; missing: string[] } | null>(null)

  async function saveClubInfo() {
    if (!clubId || !clubName || !gmName) return
    setSavingClub(true)
    try {
      await fetch(`/api/settings?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_name: clubName, timezone, gm_name: gmName, gm_email: gmEmail, gm_phone: gmPhone }),
      })
      setStep(1)
    } catch (e) { console.error(e) }
    finally { setSavingClub(false) }
  }

  async function uploadCSV() {
    if (!csvFile) return
    setIngesting(true)
    setIngestError(null)
    try {
      const text = await csvFile.text()
      const r = await fetch(`/api/onboard/ingest?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setIngestResult(d)
    } catch (e) {
      setIngestError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setIngesting(false)
    }
  }

  async function activateAgents() {
    setActivating(true)
    const agents = Object.entries(selectedAgents).filter(([, on]) => on).map(([id]) => id)
    try {
      const r = await fetch(`/api/onboard/activate?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents }),
      })
      const d = await r.json()
      setActivateResult(d)
      setStep(3)
    } catch (e) { console.error(e) }
    finally { setActivating(false) }
  }

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', py: 4, px: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '2rem', color: INK, mb: 0.75 }}>
          Welcome to ClubThread
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: INK_QUIET }}>
          Set up your club in four steps. Takes about 10 minutes.
        </Typography>
      </Box>

      <StepIndicator current={step} />

      {/* Step 0: Club info */}
      {step === 0 && (
        <Card>
          <CardContent sx={{ p: '28px !important' }}>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.25rem', color: INK, mb: 0.5 }}>Club information</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT, mb: 3 }}>This creates your club's settings record. The club ID is permanent.</Typography>

            {[
              { label: 'Club ID', sub: 'Lowercase, hyphens only (e.g., bowling-green-cc)', value: clubId, set: setClubId, placeholder: 'my-country-club' },
              { label: 'Club name', sub: '', value: clubName, set: setClubName, placeholder: 'Bowling Green Country Club' },
              { label: 'GM name', sub: 'Used in agent-drafted communications', value: gmName, set: setGmName, placeholder: 'Daniel Soehren' },
              { label: 'GM email', sub: '', value: gmEmail, set: setGmEmail, placeholder: 'gm@yourclub.com' },
              { label: 'GM phone', sub: 'For SMS escalations', value: gmPhone, set: setGmPhone, placeholder: '270-555-0100' },
            ].map(({ label, sub, value, set, placeholder }) => (
              <Box key={label} sx={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 2, py: 1.5, borderBottom: '1px solid rgba(26,31,27,0.06)', alignItems: 'start' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: INK }}>{label}</Typography>
                  {sub && <Typography sx={{ fontSize: '0.6875rem', color: INK_FAINT, mt: '2px' }}>{sub}</Typography>}
                </Box>
                <TextField value={value} onChange={e => set(e.target.value)} size="small" fullWidth placeholder={placeholder}
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }} />
              </Box>
            ))}

            <Box sx={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 2, py: 1.5, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: INK }}>Timezone</Typography>
              <FormControl size="small" fullWidth>
                <Select value={timezone} onChange={e => setTimezone(e.target.value)} sx={{ fontSize: '0.875rem' }}>
                  {TIMEZONES.map(tz => <MenuItem key={tz} value={tz} sx={{ fontSize: '0.875rem' }}>{tz}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={saveClubInfo}
                disabled={!clubId || !clubName || !gmName || savingClub}
                sx={{ height: 38, px: 3, bgcolor: FOREST, color: '#fff', fontSize: '0.875rem', textTransform: 'none', '&:hover': { bgcolor: '#152e22' }, '&:disabled': { bgcolor: 'rgba(26,31,27,0.1)' } }}
              >
                {savingClub ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Save and continue →'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 1: CSV upload */}
      {step === 1 && (
        <Card>
          <CardContent sx={{ p: '28px !important' }}>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.25rem', color: INK, mb: 0.5 }}>Upload Jonas CSV</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT, mb: 3 }}>
              Export your member list from Jonas: Reports → Membership → Member List → Export CSV. Required columns: member_id, first_name, last_name. Optional: email, phone, annual_dues, last_visit, join_date, membership_type.
            </Typography>

            <Box
              onClick={() => fileRef.current?.click()}
              sx={{
                border: `2px dashed ${csvFile ? FOREST : 'rgba(26,31,27,0.2)'}`,
                borderRadius: '6px', p: 4, textAlign: 'center', cursor: 'pointer', mb: 3,
                bgcolor: csvFile ? 'rgba(61,106,75,0.04)' : 'rgba(26,31,27,0.01)',
                '&:hover': { bgcolor: 'rgba(61,106,75,0.04)' },
              }}
            >
              <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
                onChange={e => { setCsvFile(e.target.files?.[0] ?? null); setIngestResult(null) }} />
              {csvFile ? (
                <>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: FOREST, mb: 0.5 }}>{csvFile.name}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>{(csvFile.size / 1024).toFixed(1)} KB · Click to change</Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ fontSize: '0.9rem', color: INK_QUIET, mb: 0.5 }}>Click to select your Jonas CSV</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>or drag and drop · max 10 MB</Typography>
                </>
              )}
            </Box>

            {ingestError && (
              <Box sx={{ p: 2, bgcolor: 'rgba(139,58,58,0.06)', border: '1px solid rgba(139,58,58,0.2)', borderRadius: '4px', mb: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(139,58,58,0.8)' }}>{ingestError}</Typography>
              </Box>
            )}

            {ingestResult && (
              <Box sx={{ p: 2.5, bgcolor: 'rgba(61,106,75,0.05)', border: '1px solid rgba(61,106,75,0.15)', borderRadius: '4px', mb: 3 }}>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.0625rem', color: FOREST, mb: 1 }}>
                  {ingestResult.inserted} members loaded
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
                  {ingestResult.tier_summary.map(({ tier, count }) => (
                    <Box key={tier} sx={{ px: 1.25, py: '3px', borderRadius: '3px', bgcolor: `${TIER_COLOR[tier] ?? 'rgba(26,31,27,0.1)'}22`, border: `1px solid ${TIER_COLOR[tier] ?? 'rgba(26,31,27,0.1)'}` }}>
                      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: TIER_COLOR[tier] ?? INK_FAINT }}>{count} {tier}</Typography>
                    </Box>
                  ))}
                </Box>
                {ingestResult.errors.length > 0 && (
                  <Typography sx={{ fontSize: '0.6875rem', color: INK_FAINT }}>{ingestResult.errors.length} rows skipped</Typography>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button onClick={() => setStep(0)} sx={{ height: 36, px: 2, color: INK_QUIET, fontSize: '0.8125rem', textTransform: 'none' }}>← Back</Button>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {!ingestResult && (
                  <Button onClick={uploadCSV} disabled={!csvFile || ingesting}
                    sx={{ height: 38, px: 2.5, bgcolor: 'rgba(26,31,27,0.07)', color: INK, fontSize: '0.8125rem', textTransform: 'none', '&:hover': { bgcolor: 'rgba(26,31,27,0.12)' } }}>
                    {ingesting ? <><CircularProgress size={14} sx={{ mr: 1 }} />Uploading…</> : 'Upload CSV'}
                  </Button>
                )}
                <Button onClick={() => setStep(2)} disabled={!ingestResult && !csvFile}
                  sx={{ height: 38, px: 3, bgcolor: FOREST, color: '#fff', fontSize: '0.875rem', textTransform: 'none', '&:hover': { bgcolor: '#152e22' } }}>
                  {ingestResult ? 'Continue →' : 'Skip for now →'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Activate agents */}
      {step === 2 && (
        <Card>
          <CardContent sx={{ p: '28px !important' }}>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.25rem', color: INK, mb: 0.5 }}>Activate agents</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT, mb: 3 }}>Select which analyst agents to activate. Each runs on a schedule and surfaces recommendations to the Today view. All are recommended for a full pilot.</Typography>

            {ANALYST_AGENTS.map(({ id, name, desc }) => (
              <Box key={id} sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, py: 1.5, borderBottom: '1px solid rgba(26,31,27,0.06)', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: INK }}>{name}</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: INK_FAINT }}>{desc}</Typography>
                </Box>
                <Switch
                  checked={selectedAgents[id] ?? false}
                  onChange={e => setSelectedAgents(p => ({ ...p, [id]: e.target.checked }))}
                  size="small"
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: FOREST }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: FOREST } }}
                />
              </Box>
            ))}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Button onClick={() => setStep(1)} sx={{ height: 36, px: 2, color: INK_QUIET, fontSize: '0.8125rem', textTransform: 'none' }}>← Back</Button>
              <Button onClick={activateAgents} disabled={activating}
                sx={{ height: 38, px: 3, bgcolor: FOREST, color: '#fff', fontSize: '0.875rem', textTransform: 'none', '&:hover': { bgcolor: '#152e22' } }}>
                {activating ? <><CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />Activating…</> : 'Activate and finish →'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <Card sx={{ borderLeft: `3px solid ${FOREST}` }}>
          <CardContent sx={{ p: '40px !important', textAlign: 'center' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'rgba(61,106,75,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
              <Typography sx={{ fontSize: '1.5rem' }}>✓</Typography>
            </Box>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.75rem', color: FOREST, mb: 1 }}>
              Your club is live.
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: INK_QUIET, mb: 0.5 }}>
              {clubName || clubId} is set up and agents are activating.
            </Typography>
            {ingestResult && (
              <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT, mb: 3 }}>
                {ingestResult.inserted} members loaded · analysts will run on their next scheduled tick.
              </Typography>
            )}
            {activateResult && activateResult.activated.length > 0 && (
              <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT, mb: 3 }}>
                Activated: {activateResult.activated.map(a => a.replace(/_/g, ' ')).join(', ')}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 3 }}>
              <Button onClick={() => navigate('/')}
                sx={{ height: 42, px: 3, bgcolor: FOREST, color: '#fff', fontSize: '0.875rem', textTransform: 'none', '&:hover': { bgcolor: '#152e22' } }}>
                Go to Today view →
              </Button>
              <Button onClick={() => navigate('/members')}
                sx={{ height: 42, px: 3, bgcolor: 'rgba(26,31,27,0.06)', color: INK, fontSize: '0.875rem', textTransform: 'none', '&:hover': { bgcolor: 'rgba(26,31,27,0.1)' } }}>
                View members
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
