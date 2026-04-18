import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import {
  SectionTitle, TabStrip, Toggle,
  INK, INK_QUIET, INK_FAINT, FOREST, BRASS, IVORY_DEEP,
  PH, SERIF, MONO,
} from '../components/WireframeKit'

const ADMIN_TABS = ['Roles & people', 'Agents', 'Tools & integrations', 'Automation trust', 'Session log', 'Costs']

const TRUST_STEPS = [
  { num: '01', name: 'Fully Manual',        desc: 'Everything surfaces for your approval. No drafts composed.',        },
  { num: '02', name: 'Draft Mode',          desc: 'Agents compose drafts. You send. No auto-execution.',               },
  { num: '03', name: 'Approved Categories', desc: 'Low-risk categories auto-execute. Rest require approval.',           },
  { num: '04', name: 'Autonomous Windows',  desc: 'Agents act within defined windows (e.g., during service).',          },
  { num: '05', name: 'Full Autonomy',       desc: 'Agents act. You audit. Recommended only after 12+ months.',          },
]

const ROLE_AGENT_LABELS: Record<string, string> = {
  gm_concierge:              'GM Concierge',
  membership_director_agent: 'Membership Director',
  fb_director_agent:         'F&B Director',
  head_pro_agent:            'Head Pro',
  dining_room_agent:         'Dining Room Mgr',
  pro_shop_agent:            'Pro Shop',
  controller_agent:          'Controller',
  events_role_agent:         'Events',
  tee_time_agent:            'Tee Time',
  server_agent:              'Server',
}

const ROLE_AGENT_MODEL: Record<string, string> = {
  gm_concierge:              'opus',
  membership_director_agent: 'sonnet',
  fb_director_agent:         'sonnet',
  head_pro_agent:            'sonnet',
  dining_room_agent:         'sonnet',
  pro_shop_agent:            'haiku',
  controller_agent:          'sonnet',
  events_role_agent:         'sonnet',
  tee_time_agent:            'haiku',
  server_agent:              'haiku',
}

const CLUB_ID = 'bowling-green-cc'

const AGENT_GROUPS = [
  {
    label: 'Orchestrators',
    sub: 'the two agents that route everything · one-level delegation',
    agents: [
      { name: 'GM Concierge',     type: 'Orchestrator · GM-facing',     model: 'Opus',   on: true },
      { name: 'Member Concierge', type: 'Orchestrator · Member-facing',  model: 'Haiku',  on: true },
    ],
  },
  {
    label: 'Analyst agents',
    sub: 'run on cron schedules · iterate via MCP queries',
    agents: [
      { name: 'Member Pulse',           type: 'Analyst · health scoring',       model: 'Opus',   on: true  },
      { name: 'Service Recovery',       type: 'Analyst · complaint queue',      model: 'Sonnet', on: true  },
      { name: 'Revenue Analyst',        type: 'Analyst · F&B leakage',          model: 'Sonnet', on: true  },
      { name: 'Labor Optimizer',        type: 'Analyst · staffing forward',     model: 'Sonnet', on: true  },
      { name: 'Engagement Autopilot',   type: 'Analyst · reactivation drafts',  model: 'Sonnet', on: true  },
      { name: 'Board Report Compiler',  type: 'Analyst · quarterly packet',     model: 'Opus',   on: true  },
    ],
  },
  {
    label: 'Role agents',
    sub: 'one per human role · routed to assigned staff',
    agents: [
      { name: 'Member Save Agent',   type: 'Role · membership',    model: 'Sonnet', on: true  },
      { name: 'Service Alert Agent', type: 'Role · dining + golf', model: 'Sonnet', on: true  },
      { name: 'Draft Communicator',  type: 'Role · voice-matched', model: 'Sonnet', on: true  },
      { name: 'Tee Time Agent',      type: 'Role · bookings',      model: 'Haiku',  on: false },
    ],
  },
]

interface RegistryAgent {
  agent_name: string
  agent_id: string
  model: string | null
  description: string | null
  registered_at: string
  session_status: string | null
  last_run_at: string | null
}

interface RoleAssignment {
  agent_name: string
  assigned_to_name: string
  assigned_to_email: string
  assigned_to_phone: string
  on_call: boolean
  backup_name: string
  updated_at: string
}

interface CostData {
  sessions_30d: number
  total_turns: number
  agent_count: number
  by_model: { model: string; agents: number; estimated_turns: number; cost_usd: number }[]
  api_cost_usd: number
  infra_cost_usd: number
  total_monthly_usd: number
  breakeven_arr_usd: number
  note: string
}

interface LogEvent {
  session_key: string
  event_type: string
  preview: string
  created_at: string
}

const CAT_GROUPS = [
  { title: 'Member saves',           sub: '3 action types',  active: 'Draft only'  },
  { title: 'Service recovery',       sub: '4 action types',  active: 'Draft only'  },
  { title: 'F&B recommendations',    sub: '2 action types',  active: 'Auto-send'   },
  { title: 'Tee time confirmations', sub: '3 action types',  active: 'Auto-send'   },
  { title: 'Staff communications',   sub: '5 action types',  active: 'Draft only'  },
  { title: 'Board reporting',        sub: '1 action type',   active: 'Manual only' },
]

const MODES = ['Manual only', 'Draft only', 'Auto-send']

// ─── Trust Banner ─────────────────────────────────────────────────────────────
function TrustBanner({ trustLevel, onTrustChange }: { trustLevel: number; onTrustChange: (n: number) => void }) {
  return (
    <Card sx={{ mb: 3, borderLeft: `3px solid ${BRASS}`, overflow: 'visible' }}>
      <CardContent sx={{ p: '20px 24px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3, mb: 2 }}>
          <Box>
            <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.1875rem', color: INK, mb: 0.5 }}>
              Automation trust level
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>
              Controls how much autonomy agents have across all categories. Click a step to change.
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT }}>Current level</Typography>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.25rem', color: FOREST }}>
              {TRUST_STEPS[trustLevel - 1]?.name ?? '—'}
            </Typography>
          </Box>
        </Box>

        {/* 5-step ladder */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', mb: 2, borderRadius: '3px', overflow: 'visible' }}>
          {TRUST_STEPS.map(({ num, name, desc }, i) => {
            const stepNum = i + 1
            const state = stepNum === trustLevel ? 'current' : stepNum < trustLevel ? 'earlier' : 'future'
            const bg         = state === 'current' ? FOREST : state === 'earlier' ? 'rgba(233,220,192,0.75)' : IVORY_DEEP
            const nameColor  = state === 'current' ? '#fff' : state === 'earlier' ? FOREST : INK
            const numColor   = state === 'current' ? 'rgba(196,165,115,0.85)' : INK_FAINT
            const descColor  = state === 'current' ? 'rgba(255,255,255,0.68)' : INK_FAINT
            return (
              <Box
                key={num}
                onClick={() => onTrustChange(stepNum)}
                sx={{ bgcolor: bg, px: 1.5, py: '14px', position: 'relative', cursor: 'pointer', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }}
              >
                {state === 'current' && (
                  <Box sx={{ position: 'absolute', top: -10, right: 8, bgcolor: BRASS, borderRadius: '2px', px: 0.875, py: '2px' }}>
                    <Typography sx={{ fontFamily: MONO, fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.1em', color: '#fff', textTransform: 'uppercase' }}>Current</Typography>
                  </Box>
                )}
                <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: numColor, mb: 0.5, fontWeight: 500 }}>{num}.</Typography>
                <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '0.875rem', color: nameColor, fontStyle: state === 'current' ? 'italic' : 'normal', mb: 0.5, lineHeight: 1.2 }}>{name}</Typography>
                <Typography sx={{ fontSize: '0.5625rem', color: descColor, lineHeight: 1.4 }}>{desc}</Typography>
              </Box>
            )
          })}
        </Box>
      </CardContent>
    </Card>
  )
}

// ─── Tab 0: Roles & People ────────────────────────────────────────────────────
function RolesTab() {
  const [roles, setRoles] = useState<RoleAssignment[] | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Partial<RoleAssignment>>>({})

  useEffect(() => {
    fetch(`/api/admin/roles?club_id=${CLUB_ID}`)
      .then(r => r.json())
      .then(d => setRoles(d.roles))
      .catch(console.error)
  }, [])

  function draft(agentName: string, field: keyof RoleAssignment, value: string | boolean) {
    setDrafts(prev => ({
      ...prev,
      [agentName]: { ...(prev[agentName] ?? {}), [field]: value },
    }))
  }

  async function save(r: RoleAssignment) {
    const merged = { ...r, ...(drafts[r.agent_name] ?? {}) }
    setSaving(r.agent_name)
    try {
      await fetch(`/api/admin/roles?club_id=${CLUB_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      })
      setRoles(prev => prev ? prev.map(x => x.agent_name === r.agent_name ? { ...x, ...merged } : x) : prev)
      setDrafts(prev => { const n = { ...prev }; delete n[r.agent_name]; return n })
    } catch (e) { console.error(e) }
    finally { setSaving(null) }
  }

  const COL = '160px 1fr 140px 80px 130px 56px'
  const HEADS = ['Role agent', 'Assigned to', 'Contact', 'On-call', 'Backup', '']

  const displayRows = (roles ?? []).map(r => {
    const d = drafts[r.agent_name] ?? {}
    return { ...r, ...d }
  })

  return (
    <Box>
      <SectionTitle>Staff assignments</SectionTitle>
      <Card>
        <CardContent sx={{ p: '0 !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: COL, gap: 2, px: 2, py: 1.25, bgcolor: 'rgba(26,31,27,0.02)', borderBottom: '1px solid rgba(26,31,27,0.1)', alignItems: 'center' }}>
            {HEADS.map(h => (
              <Typography key={h} sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_FAINT }}>{h}</Typography>
            ))}
          </Box>
          {roles === null ? (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={20} sx={{ color: FOREST }} />
            </Box>
          ) : displayRows.map((r, i) => {
            const label = ROLE_AGENT_LABELS[r.agent_name] ?? r.agent_name
            const model = ROLE_AGENT_MODEL[r.agent_name] ?? 'sonnet'
            const isDirty = !!drafts[r.agent_name]
            const isSaving = saving === r.agent_name
            const initials = r.assigned_to_name
              ? r.assigned_to_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              : '—'
            return (
              <Box key={r.agent_name} sx={{ display: 'grid', gridTemplateColumns: COL, gap: 2, px: 2, py: 1.25, borderBottom: i < displayRows.length - 1 ? '1px solid rgba(26,31,27,0.05)' : 'none', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '0.875rem', color: INK, lineHeight: 1.2, mb: '2px' }}>{label}</Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', color: INK_FAINT, letterSpacing: '0.02em' }}>role agent · {model}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    bgcolor: initials === '—' ? PH : 'rgba(233,220,192,0.8)',
                    color: BRASS, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: SERIF, fontWeight: 500, fontSize: '0.6875rem',
                  }}>{initials}</Box>
                  <TextField
                    value={r.assigned_to_name}
                    onChange={e => draft(r.agent_name, 'assigned_to_name', e.target.value)}
                    size="small"
                    placeholder="Name"
                    sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.75rem' } }}
                  />
                </Box>
                <TextField
                  value={r.assigned_to_email}
                  onChange={e => draft(r.agent_name, 'assigned_to_email', e.target.value)}
                  size="small"
                  placeholder="Email"
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.6875rem' } }}
                />
                <Switch
                  checked={r.on_call}
                  onChange={e => draft(r.agent_name, 'on_call', e.target.checked)}
                  size="small"
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: FOREST }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: FOREST } }}
                />
                <TextField
                  value={r.backup_name}
                  onChange={e => draft(r.agent_name, 'backup_name', e.target.value)}
                  size="small"
                  placeholder="Backup"
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.6875rem' } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {isDirty && !isSaving && (
                    <Button
                      onClick={() => save(roles.find(x => x.agent_name === r.agent_name)!)}
                      size="small"
                      sx={{ minWidth: 0, height: 26, px: 1, bgcolor: FOREST, color: '#fff', fontSize: '0.625rem', textTransform: 'none', '&:hover': { bgcolor: '#152e22' } }}
                    >Save</Button>
                  )}
                  {isSaving && <CircularProgress size={14} sx={{ color: FOREST }} />}
                </Box>
              </Box>
            )
          })}
        </CardContent>
      </Card>
    </Box>
  )
}

// ─── Agent card ───────────────────────────────────────────────────────────────
function AgentCard({ name, type, model, on, lastRunAt, agentId, sessionStatus }: {
  name: string; type: string; model: string; on: boolean
  lastRunAt: string | null; agentId: string | null; sessionStatus: string | null
}) {
  const modelBg    = model === 'Opus' ? 'rgba(30,58,45,0.88)' : model === 'Haiku' ? 'rgba(61,106,75,0.1)' : 'rgba(233,220,192,0.65)'
  const modelColor = model === 'Opus' ? 'rgba(196,165,115,0.9)' : model === 'Haiku' ? 'rgba(61,106,75,0.85)' : BRASS
  const lastRunLabel = lastRunAt
    ? new Date(lastRunAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : agentId ? 'no session' : '—'
  const registered = !!agentId
  return (
    <Card sx={{ opacity: registered ? 1 : 0.65 }}>
      <CardContent sx={{ p: '14px 16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
          <Box>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '0.9375rem', color: INK, lineHeight: 1.2, mb: '3px' }}>{name}</Typography>
            <Typography sx={{ fontSize: '0.5625rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_FAINT }}>{type}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {registered && (
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: sessionStatus === 'active' ? 'rgba(61,106,75,0.7)' : 'rgba(26,31,27,0.2)' }} />
            )}
            <Toggle on={on} />
          </Box>
        </Box>
        <Divider sx={{ borderStyle: 'dashed', mb: 1.25 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
          <Box>
            <Typography sx={{ fontSize: '0.5625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: INK_FAINT, mb: '3px' }}>Model</Typography>
            <Box sx={{ display: 'inline-block', bgcolor: modelBg, borderRadius: '2px', px: 0.75, py: '2px' }}>
              <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, color: modelColor }}>{model}</Typography>
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.5625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: INK_FAINT, mb: '3px' }}>Last run</Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: lastRunAt ? INK_QUIET : INK_FAINT }}>{lastRunLabel}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.5625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: INK_FAINT, mb: '3px' }}>Status</Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: INK_QUIET }}>{registered ? (sessionStatus ?? 'registered') : 'not registered'}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ─── Tab 1: Agents ────────────────────────────────────────────────────────────
function AgentsTab() {
  const [registry, setRegistry] = useState<RegistryAgent[] | null>(null)

  useEffect(() => {
    fetch(`/api/admin/agents?club_id=${CLUB_ID}`)
      .then(r => r.json())
      .then(d => setRegistry(d.agents))
      .catch(console.error)
  }, [])

  const byName: Record<string, RegistryAgent> = {}
  for (const a of registry ?? []) byName[a.agent_name] = a

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, px: 0.5 }}>
        <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: INK_FAINT }}>Registry</Typography>
        {registry ? (
          <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>{registry.length} agents registered</Typography>
        ) : <CircularProgress size={14} sx={{ color: FOREST }} />}
      </Box>

      {AGENT_GROUPS.map(({ label, sub, agents }) => (
        <Box key={label} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1.25 }}>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: BRASS }}>§ {label}</Typography>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.75rem', color: INK_QUIET }}>{sub}</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(276px, 1fr))', gap: 1.25 }}>
            {agents.map(a => {
              const live = byName[a.name.toLowerCase().replace(/ /g, '_')] ?? null
              return (
                <AgentCard
                  key={a.name}
                  {...a}
                  lastRunAt={live?.last_run_at ?? null}
                  agentId={live?.agent_id ?? null}
                  sessionStatus={live?.session_status ?? null}
                />
              )
            })}
          </Box>
        </Box>
      ))}

      {registry && registry.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1.25 }}>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: BRASS }}>§ Registry</Typography>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.75rem', color: INK_QUIET }}>all registered agents · live from agent_registry</Typography>
          </Box>
          <Card>
            <CardContent sx={{ p: '0 !important' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 120px', gap: 1.5, px: 2, py: 1, bgcolor: 'rgba(26,31,27,0.02)', borderBottom: '1px solid rgba(26,31,27,0.1)' }}>
                {['Agent', 'ID', 'Model', 'Last session activity'].map(h => (
                  <Typography key={h} sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT }}>{h}</Typography>
                ))}
              </Box>
              {registry.map((a, i) => (
                <Box key={a.agent_name} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 120px', gap: 1.5, px: 2, py: 1.125, borderBottom: i < registry.length - 1 ? '1px solid rgba(26,31,27,0.05)' : 'none', alignItems: 'center' }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.6875rem', color: INK }}>{a.agent_name}</Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', color: INK_FAINT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.agent_id}</Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.625rem', color: INK_QUIET }}>{a.model ?? '—'}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: a.last_run_at ? INK_QUIET : INK_FAINT }}>
                    {a.last_run_at ? new Date(a.last_run_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'no session'}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  )
}

// ─── Tab 2: Tools ─────────────────────────────────────────────────────────────
function ToolsTab() {
  return (
    <Card>
      <CardContent sx={{ p: '32px 24px !important', textAlign: 'center' }}>
        <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1rem', color: INK_QUIET, mb: 2 }}>
          Source systems, field mapping, and data readiness are managed on the Integrations page.
        </Typography>
        <Box sx={{ display: 'inline-flex', height: 36, px: 3, bgcolor: FOREST, borderRadius: '2px', alignItems: 'center', cursor: 'pointer' }}
             onClick={() => window.location.href = '/integrations'}>
          <Typography sx={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 500 }}>Go to Integrations →</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

// ─── Tab 3: Automation trust ──────────────────────────────────────────────────
function AutomationTab({ categoryModes, onModeChange }: {
  categoryModes: Record<string, string>
  onModeChange: (title: string, mode: string) => void
}) {
  return (
    <Box>
      {CAT_GROUPS.map(({ title, sub, active }) => {
        const current = categoryModes[title] ?? active
        return (
          <Card key={title} sx={{ mb: 1.25, overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 2, px: 2.25, py: 1.75, bgcolor: 'rgba(26,31,27,0.02)', borderBottom: '1px solid rgba(26,31,27,0.08)', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1rem', color: INK, lineHeight: 1.2 }}>{title}</Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: INK_FAINT, mt: '2px' }}>{sub}</Typography>
              </Box>
              <Box sx={{ display: 'flex', border: '1px solid rgba(26,31,27,0.12)', borderRadius: '2px', overflow: 'hidden' }}>
                {MODES.map((m, mi) => (
                  <Box
                    key={m}
                    onClick={() => onModeChange(title, m)}
                    sx={{
                      px: 1.25, py: 0.625, cursor: 'pointer',
                      bgcolor: m === current ? FOREST : 'transparent',
                      borderRight: mi < 2 ? '1px solid rgba(26,31,27,0.12)' : 'none',
                      '&:hover': { bgcolor: m === current ? FOREST : 'rgba(26,31,27,0.04)' },
                    }}>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: m === current ? 500 : 400, color: m === current ? '#fff' : INK_QUIET, whiteSpace: 'nowrap' }}>{m}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        )
      })}
    </Box>
  )
}

// ─── Tab 4: Session log ───────────────────────────────────────────────────────
function SessionLogTab() {
  const [events, setEvents] = useState<LogEvent[] | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch(`/api/admin/agent-log?club_id=${CLUB_ID}&limit=100`)
      .then(r => r.json())
      .then(d => setEvents(d.events))
      .catch(console.error)
  }, [])

  const EVENT_COLOR: Record<string, string> = {
    tool_call:      BRASS,
    tool_result:    'rgba(61,106,75,0.7)',
    message:        INK_QUIET,
    handoff:        'rgba(163,132,88,0.8)',
    error:          'rgba(139,58,58,0.7)',
  }

  const filtered = (events ?? []).filter(e =>
    !filter || e.session_key.includes(filter) || e.event_type.includes(filter)
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          value={filter}
          onChange={e => setFilter(e.target.value)}
          size="small"
          placeholder="Filter by agent or event type…"
          sx={{ width: 320, '& .MuiOutlinedInput-root': { fontSize: '0.8125rem' } }}
        />
        {events && (
          <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>{filtered.length} events</Typography>
        )}
      </Box>

      <Card>
        <CardContent sx={{ p: '0 !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '180px 100px 1fr 140px', gap: 2, px: 2, py: 1, bgcolor: 'rgba(26,31,27,0.02)', borderBottom: '1px solid rgba(26,31,27,0.1)' }}>
            {['Session', 'Event type', 'Payload preview', 'Timestamp'].map(h => (
              <Typography key={h} sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT }}>{h}</Typography>
            ))}
          </Box>
          {events === null ? (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={20} sx={{ color: FOREST }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>No events found</Typography>
            </Box>
          ) : filtered.map((e, i) => (
            <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '180px 100px 1fr 140px', gap: 2, px: 2, py: 1, borderBottom: i < filtered.length - 1 ? '1px solid rgba(26,31,27,0.04)' : 'none', alignItems: 'start' }}>
              <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', color: INK_FAINT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.session_key}
              </Typography>
              <Box sx={{ display: 'inline-block', px: 0.75, py: '2px', bgcolor: `${(EVENT_COLOR[e.event_type] ?? INK_FAINT).replace(')', ', 0.12)').replace('rgba', 'rgba').replace(/,\s*[\d.]+\)$/, ', 0.12)')}`, borderRadius: '3px' }}>
                <Typography sx={{ fontFamily: MONO, fontSize: '0.5625rem', color: EVENT_COLOR[e.event_type] ?? INK_FAINT }}>{e.event_type}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.6875rem', color: INK_QUIET, lineHeight: 1.4, wordBreak: 'break-all' }}>{e.preview}</Typography>
              <Typography sx={{ fontSize: '0.625rem', color: INK_FAINT }}>
                {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  )
}

// ─── Tab 5: Costs ─────────────────────────────────────────────────────────────
function CostsTab() {
  const [data, setData] = useState<CostData | null>(null)

  useEffect(() => {
    fetch(`/api/admin/costs?club_id=${CLUB_ID}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [])

  return (
    <Box>
      <SectionTitle>{`Cost baseline · ${CLUB_ID}`}</SectionTitle>
      {!data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
          <CircularProgress size={24} sx={{ color: FOREST }} />
        </Box>
      ) : (
        <>
          {/* Summary cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 3 }}>
            {[
              { label: 'Sessions (30d)', value: data.sessions_30d.toString() },
              { label: 'Total turns', value: data.total_turns.toLocaleString() },
              { label: 'API cost / mo', value: `$${data.api_cost_usd.toFixed(2)}` },
              { label: 'Total / mo', value: `$${data.total_monthly_usd.toFixed(2)}` },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ p: '14px 16px', bgcolor: 'rgba(26,31,27,0.02)', border: '1px solid rgba(26,31,27,0.07)', borderRadius: '3px' }}>
                <Typography sx={{ fontSize: '1.375rem', fontWeight: 600, color: INK, lineHeight: 1 }}>{value}</Typography>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK_FAINT, mt: 0.5 }}>{label}</Typography>
              </Box>
            ))}
          </Box>

          {/* By-model breakdown */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: '20px !important' }}>
              <SectionTitle>By model</SectionTitle>
              <Box sx={{ display: 'grid', gridTemplateColumns: '100px 60px 100px 80px', gap: 2, px: 1, py: 0.75, bgcolor: 'rgba(26,31,27,0.02)', borderBottom: '1px solid rgba(26,31,27,0.1)' }}>
                {['Model', 'Agents', 'Est. turns', 'Cost/mo'].map(h => (
                  <Typography key={h} sx={{ fontSize: '0.5625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT }}>{h}</Typography>
                ))}
              </Box>
              {data.by_model.map((r, i) => (
                <Box key={r.model} sx={{ display: 'grid', gridTemplateColumns: '100px 60px 100px 80px', gap: 2, px: 1, py: 1, borderBottom: i < data.by_model.length - 1 ? '1px solid rgba(26,31,27,0.05)' : 'none' }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.75rem', color: INK }}>{r.model}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>{r.agents}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>{r.estimated_turns.toLocaleString()}</Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.75rem', color: INK }}>${r.cost_usd.toFixed(2)}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Infra + breakeven */}
          <Card>
            <CardContent sx={{ p: '20px !important' }}>
              <SectionTitle>Infrastructure + breakeven</SectionTitle>
              {[
                { label: 'Neon (Postgres)', value: `$${(data.infra_cost_usd / 2).toFixed(2)}/mo`, sub: 'Estimated at pilot scale' },
                { label: 'Vercel', value: `$${(data.infra_cost_usd / 2).toFixed(2)}/mo`, sub: 'Pro plan prorated' },
                { label: 'Breakeven ARR', value: `$${data.breakeven_arr_usd.toFixed(0)}/yr`, sub: 'At 50% gross margin' },
              ].map(({ label, value, sub }, i) => (
                <Box key={label} sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 2, py: 1.5, borderBottom: i < 2 ? '1px solid rgba(26,31,27,0.06)' : 'none', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: INK }}>{label}</Typography>
                    <Typography sx={{ fontSize: '0.6875rem', color: INK_FAINT }}>{sub}</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.875rem', color: FOREST, fontWeight: 600 }}>{value}</Typography>
                </Box>
              ))}
              <Typography sx={{ fontSize: '0.625rem', color: INK_FAINT, mt: 2, pt: 1.5, borderTop: '1px dashed rgba(26,31,27,0.08)' }}>
                {data.note}
              </Typography>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState(0)
  const [trustLevel, setTrustLevel] = useState(2)
  const [categoryModes, setCategoryModes] = useState<Record<string, string>>({})
  const [savingTrust, setSavingTrust] = useState(false)

  useEffect(() => {
    fetch(`/api/settings?club_id=${CLUB_ID}`)
      .then(r => r.json())
      .then(d => {
        if (d.trust_level) setTrustLevel(d.trust_level)
        if (d.category_modes) setCategoryModes(d.category_modes)
      })
      .catch(console.error)
  }, [])

  async function saveTrust(level: number, modes: Record<string, string>) {
    setSavingTrust(true)
    try {
      await fetch(`/api/settings?club_id=${CLUB_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trust_level: level, category_modes: modes }),
      })
    } catch (e) { console.error(e) }
    finally { setSavingTrust(false) }
  }

  function handleTrustChange(level: number) {
    setTrustLevel(level)
    saveTrust(level, categoryModes)
  }

  function handleModeChange(title: string, mode: string) {
    const updated = { ...categoryModes, [title]: mode }
    setCategoryModes(updated)
    saveTrust(trustLevel, updated)
  }

  const tabContent = [
    <RolesTab />,
    <AgentsTab />,
    <ToolsTab />,
    <AutomationTab categoryModes={categoryModes} onModeChange={handleModeChange} />,
    <SessionLogTab />,
    <CostsTab />,
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3, mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.75rem', color: INK, lineHeight: 1.2, mb: 0.5 }}>
            The <em style={{ fontStyle: 'italic', color: FOREST }}>operating layer</em>, configured.
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>
            Agent assignments, trust settings, session activity, and cost baseline for {CLUB_ID}.
          </Typography>
        </Box>
        {savingTrust && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 0.5 }}>
            <CircularProgress size={14} sx={{ color: FOREST }} />
            <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>Saving…</Typography>
          </Box>
        )}
      </Box>

      <TrustBanner trustLevel={trustLevel} onTrustChange={handleTrustChange} />

      <TabStrip tabs={ADMIN_TABS} activeIndex={tab} onChange={setTab} variant="underline" />
      <Box sx={{ mt: 2 }}>{tabContent[tab]}</Box>
    </Box>
  )
}
