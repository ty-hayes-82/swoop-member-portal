import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import InputBase from '@mui/material/InputBase'
import SearchIcon from '@mui/icons-material/Search'
import {
  Bar, TabStrip,
  INK, INK_QUIET, INK_FAINT, IVORY_DEEP,
  PH, PH_DARK, SERIF,
} from '../components/WireframeKit'
import MembersEmail from './MembersEmail'

const CLUB_ID = 'bowling-green-cc'

interface Member {
  id: string
  name: string
  health_score: number
  annual_dues: number
  tier: string
  archetype: string | null
  phone: string | null
  last_activity_date: string | null
}

interface MembersData {
  members: Member[]
  tier_counts: Record<string, number>
  total: number
}

const TIER_COLORS: Record<string, string> = {
  Thriving:  'rgba(61,106,75,0.15)',
  Engaged:   'rgba(61,106,75,0.08)',
  Watch:     'rgba(163,132,88,0.15)',
  'At-Risk': 'rgba(166,107,47,0.15)',
  Inactive:  'rgba(139,58,58,0.12)',
}
const TIER_ACCENT: Record<string, string> = {
  Thriving:  'rgba(61,106,75,0.5)',
  Engaged:   'rgba(61,106,75,0.3)',
  Watch:     'rgba(163,132,88,0.5)',
  'At-Risk': 'rgba(166,107,47,0.55)',
  Inactive:  'rgba(139,58,58,0.5)',
}

const FILTERS = ['All', 'Inactive', 'At-Risk', 'Watch']
const TABLE_COLS = ['Member', 'Score', 'Tier', 'Archetype', 'Dues / yr', 'Last active', '']
const COL_WIDTHS = ['1fr', '72px', '100px', '140px', '80px', '110px', '44px']

function MembersList() {
  const [data, setData] = useState<MembersData | null>(null)
  const [activeTier, setActiveTier] = useState('All')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams({ club_id: CLUB_ID })
    if (activeTier !== 'All') params.set('tier', activeTier)
    if (search) params.set('search', search)
    fetch(`/api/members?${params}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [activeTier, search])

  const members = data?.members ?? []

  return (
    <>
      {/* Tier stat row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 3 }}>
        {['Watch', 'At-Risk', 'Inactive', 'Thriving'].map(t => {
          const count = data?.tier_counts[t] ?? null
          return (
            <Card key={t} onClick={() => setActiveTier(t === activeTier ? 'All' : t)} sx={{ cursor: 'pointer', border: activeTier === t ? `1px solid ${TIER_ACCENT[t] ?? 'rgba(26,31,27,0.3)'}` : undefined }}>
              <CardContent sx={{ p: '14px 16px !important' }}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.75 }}>{t}</Typography>
                {count !== null ? (
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: INK, lineHeight: 1 }}>{count}</Typography>
                ) : (
                  <Box sx={{ height: 26, width: 40, bgcolor: TIER_COLORS[t] ?? PH, borderRadius: '3px' }} />
                )}
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* Filter + search */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT, mr: 0.5 }}>Filter</Typography>
          {FILTERS.map(f => (
            <Box key={f} onClick={() => setActiveTier(f)} sx={{ height: 26, px: 1.25, bgcolor: activeTier === f ? IVORY_DEEP : PH, borderRadius: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Typography sx={{ fontSize: '0.75rem', color: activeTier === f ? INK : INK_QUIET, fontWeight: activeTier === f ? 500 : 400 }}>{f}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, border: '1px solid rgba(26,31,27,0.12)', borderRadius: '4px' }}>
          <SearchIcon sx={{ fontSize: '0.9rem', color: INK_FAINT }} />
          <InputBase
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            sx={{ fontSize: '0.8rem', color: INK, '& input': { p: 0 }, width: 160 }}
          />
        </Box>
      </Box>

      {/* Table */}
      <Card>
        <CardContent sx={{ p: '0 !important' }}>
          {/* Header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: `24px ${COL_WIDTHS.join(' ')}`, gap: 1.5, px: 2, py: 1.25, borderBottom: '1px solid rgba(26,31,27,0.1)', bgcolor: 'rgba(26,31,27,0.02)' }}>
            <Box />
            {TABLE_COLS.map(col => (
              <Typography key={col} sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: INK_FAINT }}>{col}</Typography>
            ))}
          </Box>

          {/* Rows */}
          {members.length > 0 ? members.map((m) => {
            const accent = TIER_ACCENT[m.tier] ?? 'rgba(26,31,27,0.15)'
            const lastActive = m.last_activity_date ? new Date(m.last_activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
            return (
              <Box
                key={m.id}
                onClick={() => navigate(`/members/${m.id}`)}
                sx={{ display: 'grid', gridTemplateColumns: `24px ${COL_WIDTHS.join(' ')}`, gap: 1.5, px: 2, py: 1.25, borderBottom: '1px solid rgba(26,31,27,0.06)', borderLeft: `3px solid ${accent}`, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(26,31,27,0.02)' } }}
              >
                <Box sx={{ width: 14, height: 14, border: '1px solid rgba(26,31,27,0.15)', borderRadius: '3px', mt: '1px' }} />
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, color: INK, lineHeight: 1.3 }}>{m.name}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>${m.annual_dues.toLocaleString()}</Typography>
                </Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: m.health_score < 30 ? 'rgba(139,58,58,0.8)' : m.health_score < 60 ? 'rgba(163,100,30,0.8)' : '#3d6a4b', alignSelf: 'center' }}>
                  {m.health_score}
                </Typography>
                <Box sx={{ alignSelf: 'center' }}>
                  <Box sx={{ display: 'inline-flex', px: 0.75, py: '2px', bgcolor: TIER_COLORS[m.tier] ?? PH, borderRadius: '3px' }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: INK }}>{m.tier}</Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET, alignSelf: 'center' }}>{m.archetype ?? '—'}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET, alignSelf: 'center' }}>${m.annual_dues.toLocaleString()}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT, alignSelf: 'center' }}>{lastActive}</Typography>
                <Box sx={{ alignSelf: 'center' }}>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(163,132,88,0.9)', fontWeight: 500 }}>→</Typography>
                </Box>
              </Box>
            )
          }) : Array.from({ length: data ? 0 : 9 }).map((_, i) => {
            const accent = i < 3 ? 'rgba(139,58,58,0.5)' : i < 6 ? 'rgba(166,107,47,0.5)' : 'rgba(163,132,88,0.4)'
            return (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: `24px ${COL_WIDTHS.join(' ')}`, gap: 1.5, px: 2, py: 1.25, borderBottom: '1px solid rgba(26,31,27,0.06)', borderLeft: `3px solid ${accent}` }}>
                <Box sx={{ width: 14, height: 14, border: '1px solid rgba(26,31,27,0.15)', borderRadius: '3px', mt: '1px' }} />
                <Box><Bar w="75%" h={10} /><Bar w="55%" h={8} mt={5} /></Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><Box sx={{ height: 20, width: 28, bgcolor: PH_DARK, borderRadius: '3px' }} /></Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><Box sx={{ height: 18, width: 64, bgcolor: PH, borderRadius: '10px' }} /></Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><Bar w="80%" h={8} /></Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><Bar w={44} h={10} /></Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><Bar w={64} h={9} /></Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><Box sx={{ height: 22, width: 28, bgcolor: PH_DARK, borderRadius: '3px' }} /></Box>
              </Box>
            )
          })}

          {data && members.length === 0 && (
            <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', color: INK_FAINT }}>No members match this filter</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {data && (
        <Typography sx={{ fontSize: '0.7rem', color: INK_FAINT, mt: 1.5, px: 0.5 }}>
          {members.length} member{members.length !== 1 ? 's' : ''} shown
          {activeTier !== 'All' ? ` · filtered: ${activeTier}` : ''}
        </Typography>
      )}
    </>
  )
}

export default function Members() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
        <Box>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.75rem', color: INK, lineHeight: 1.2, mb: 0.5 }}>Members</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <TabStrip tabs={['Members', 'Email Engagement']} activeIndex={tab} onChange={setTab} variant="underline" />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['Re-score', 'First 90 Days'].map(btn => (
            <Box key={btn} sx={{ height: 30, px: 1.5, bgcolor: PH, borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>{btn}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {tab === 0 ? <MembersList /> : <MembersEmail />}
    </Box>
  )
}
