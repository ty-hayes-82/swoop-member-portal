import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import CircularProgress from '@mui/material/CircularProgress'
import {
  PageHeader, SectionTitle,
  INK, INK_QUIET, INK_FAINT, FOREST, SERIF,
} from '../components/WireframeKit'

const CLUB_ID = 'bowling-green-cc'

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Pacific/Honolulu',
]

interface ClubSettings {
  club_id: string
  club_name: string
  timezone: string
  gm_name: string
  gm_email: string
  gm_phone: string
  notify_email: boolean
  notify_sms: boolean
  escalation_hours: number
  demo_mode: boolean
  updated_at: string
}

function FieldRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 3, py: 2, borderBottom: '1px solid rgba(26,31,27,0.06)', alignItems: 'start' }}>
      <Box>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: INK, lineHeight: 1.3 }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: '0.6875rem', color: INK_FAINT, mt: '3px', lineHeight: 1.4 }}>{sub}</Typography>}
      </Box>
      {children}
    </Box>
  )
}

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: 3, py: 1.75, borderBottom: '1px solid rgba(26,31,27,0.06)', alignItems: 'center' }}>
      <Box>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: INK }}>{label}</Typography>
        {sub && <Typography sx={{ fontSize: '0.6875rem', color: INK_FAINT, mt: '2px' }}>{sub}</Typography>}
      </Box>
      <Typography sx={{ fontSize: '0.75rem', color: checked ? FOREST : INK_FAINT }}>{checked ? 'Enabled' : 'Disabled'}</Typography>
      <Switch
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        size="small"
        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: FOREST }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: FOREST } }}
      />
    </Box>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [draft, setDraft] = useState<ClubSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/settings?club_id=${CLUB_ID}`)
      .then(r => r.json())
      .then(d => { setSettings(d); setDraft(d) })
      .catch(console.error)
  }, [])

  function set<K extends keyof ClubSettings>(key: K, value: ClubSettings[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev)
  }

  const dirty = JSON.stringify(settings) !== JSON.stringify(draft)

  async function save() {
    if (!draft) return
    setSaving(true)
    try {
      const updated = await fetch(`/api/settings?club_id=${CLUB_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      }).then(r => r.json())
      setSettings(updated)
      setDraft(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!draft) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
        <CircularProgress size={28} sx={{ color: FOREST }} />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <PageHeader title="Settings" />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 0.5 }}>
          {saved && <Typography sx={{ fontSize: '0.75rem', color: FOREST }}>Saved</Typography>}
          {dirty && !saving && (
            <Button
              onClick={save}
              sx={{ height: 34, px: 2, bgcolor: FOREST, color: '#fff', fontSize: '0.8125rem', textTransform: 'none', '&:hover': { bgcolor: '#152e22' } }}
            >Save changes</Button>
          )}
          {saving && <CircularProgress size={18} sx={{ color: FOREST }} />}
        </Box>
      </Box>

      {/* Club */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: '20px !important' }}>
          <SectionTitle>Club</SectionTitle>
          <FieldRow label="Club name">
            <TextField
              value={draft.club_name}
              onChange={e => set('club_name', e.target.value)}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }}
            />
          </FieldRow>
          <FieldRow label="Timezone" sub="Used for scheduled agent runs and report timestamps">
            <FormControl size="small" fullWidth>
              <Select
                value={draft.timezone}
                onChange={e => set('timezone', e.target.value)}
                sx={{ fontSize: '0.875rem' }}
              >
                {TIMEZONES.map(tz => (
                  <MenuItem key={tz} value={tz} sx={{ fontSize: '0.875rem' }}>{tz}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </FieldRow>
        </CardContent>
      </Card>

      {/* GM profile */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: '20px !important' }}>
          <SectionTitle>GM profile</SectionTitle>
          <FieldRow label="Name" sub="Used in agent-drafted communications">
            <TextField
              value={draft.gm_name}
              onChange={e => set('gm_name', e.target.value)}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }}
            />
          </FieldRow>
          <FieldRow label="Email">
            <TextField
              value={draft.gm_email}
              onChange={e => set('gm_email', e.target.value)}
              size="small"
              type="email"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }}
            />
          </FieldRow>
          <FieldRow label="Phone" sub="Used for SMS escalations">
            <TextField
              value={draft.gm_phone}
              onChange={e => set('gm_phone', e.target.value)}
              size="small"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }}
            />
          </FieldRow>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: '20px !important' }}>
          <SectionTitle>Notifications</SectionTitle>
          <ToggleRow
            label="Email summaries"
            sub="Daily briefing email at 7 AM with pending handoffs"
            checked={draft.notify_email}
            onChange={v => set('notify_email', v)}
          />
          <ToggleRow
            label="SMS escalations"
            sub="Text when a critical issue or SLA breach is unresolved"
            checked={draft.notify_sms}
            onChange={v => set('notify_sms', v)}
          />
          <FieldRow label="Escalation threshold" sub="Hours before an unresolved critical issue triggers an escalation">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TextField
                value={draft.escalation_hours}
                onChange={e => set('escalation_hours', parseInt(e.target.value) || 4)}
                size="small"
                type="number"
                inputProps={{ min: 1, max: 48 }}
                sx={{ width: 80, '& .MuiOutlinedInput-root': { fontSize: '0.875rem' } }}
              />
              <Typography sx={{ fontSize: '0.8125rem', color: INK_QUIET }}>hours</Typography>
            </Box>
          </FieldRow>
        </CardContent>
      </Card>

      {/* Demo mode */}
      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ p: '20px !important' }}>
          <SectionTitle>Demo mode</SectionTitle>
          <ToggleRow
            label="Demo banner"
            sub="Show the pre-pilot fixture data banner across all views"
            checked={draft.demo_mode}
            onChange={v => set('demo_mode', v)}
          />
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card sx={{ border: '1px solid rgba(139,58,58,0.18)', borderLeft: '3px solid rgba(139,58,58,0.65)' }}>
        <CardContent sx={{ p: '20px !important' }}>
          <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1rem', color: 'rgba(139,58,58,0.82)', mb: 0.5 }}>Danger zone</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT, mb: 2 }}>These actions are irreversible. Confirm before proceeding.</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {['Reset all agent sessions', 'Clear event log', 'Delete all handoffs'].map(action => (
              <Box
                key={action}
                sx={{ height: 30, px: 1.5, bgcolor: 'rgba(139,58,58,0.04)', border: '1px solid rgba(139,58,58,0.2)', borderRadius: '2px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(139,58,58,0.8)', fontWeight: 500 }}>{action}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Footer */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(26,31,27,0.07)' }}>
        <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>
          Last updated: {new Date(settings?.updated_at ?? '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    </Box>
  )
}
