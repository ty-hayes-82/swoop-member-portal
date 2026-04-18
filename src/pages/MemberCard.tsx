import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PhoneIcon from '@mui/icons-material/Phone'
import SmsIcon from '@mui/icons-material/Sms'
import {
  Bar,
  INK, INK_QUIET, INK_FAINT, FOREST, IVORY_DEEP,
  PH, SERIF,
} from '../components/WireframeKit'

const CLUB_ID = 'bowling-green-cc'

interface MemberDetail {
  id: string
  name: string
  email: string | null
  phone: string | null
  health_score: number
  annual_dues: number
  tier: string
  archetype: string | null
  join_date: string | null
  age: number | null
  handicap_index: number | null
  last_activity_date: string | null
  visit_count_12m: number
  activity_streak_days: number
  membership_type: string | null
  signals: {
    last_complaint: { complaint_id: string; category: string; description: string; status: string; priority: string; reported_at: string } | null
    recent_complaints_count: number
    last_booking: { booking_id: string; booking_date: string; tee_time: string; status: string } | null
    billing_summary: Array<{ charge_type: string; total: number; count: number }>
  }
}

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  Thriving:  { bg: 'rgba(61,106,75,0.12)',   text: '#2d6b45' },
  Engaged:   { bg: 'rgba(61,106,75,0.08)',   text: '#3d6a4b' },
  Watch:     { bg: 'rgba(163,132,88,0.15)',  text: '#8b6f3a' },
  'At-Risk': { bg: 'rgba(166,107,47,0.15)', text: '#7a4f24' },
  Inactive:  { bg: 'rgba(139,58,58,0.12)',   text: '#8b3a3a' },
}

function scoreColor(score: number) {
  if (score >= 70) return '#3d6a4b'
  if (score >= 40) return 'rgba(163,100,30,0.9)'
  return 'rgba(139,58,58,0.85)'
}

export default function MemberCard() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const clubId = searchParams.get('club_id') ?? CLUB_ID
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/members/${id}?club_id=${clubId}`)
      .then(r => r.json())
      .then(d => { setMember(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id, clubId])

  const tierStyle = member ? (TIER_COLORS[member.tier] ?? { bg: PH, text: INK_QUIET }) : null

  return (
    <Box>
      {/* Back */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, cursor: 'pointer' }} onClick={() => navigate('/members')}>
        <ArrowBackIcon sx={{ fontSize: '0.9rem', color: INK_FAINT }} />
        <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT }}>Members</Typography>
      </Box>

      {loading && !member && (
        <Box>
          <Bar w={200} h={28} /><Bar w={120} h={12} mt={8} />
        </Box>
      )}

      {!loading && !member && (
        <Typography sx={{ color: INK_FAINT }}>Member not found</Typography>
      )}

      {member && (
        <>
          {/* Hero card */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: '20px 24px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.75rem', color: INK, lineHeight: 1.2, mb: 0.5 }}>
                    {member.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    {tierStyle && (
                      <Box sx={{ display: 'inline-flex', px: 1, py: '3px', bgcolor: tierStyle.bg, borderRadius: '4px' }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tierStyle.text }}>{member.tier}</Typography>
                      </Box>
                    )}
                    {member.archetype && (
                      <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>{member.archetype}</Typography>
                    )}
                    {member.membership_type && (
                      <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT }}>{member.membership_type}</Typography>
                    )}
                  </Box>
                </Box>
                {/* Health score */}
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '3rem', fontWeight: 700, color: scoreColor(member.health_score), lineHeight: 1 }}>
                    {member.health_score}
                  </Typography>
                  <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: INK_FAINT }}>
                    Health score
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1.75 }} />

              {/* Quick stats */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                {[
                  { label: 'Annual dues',   value: `$${member.annual_dues.toLocaleString()}` },
                  { label: 'Rounds / 12m',  value: member.visit_count_12m > 0 ? String(member.visit_count_12m) : '—' },
                  { label: 'Handicap',      value: member.handicap_index != null ? String(member.handicap_index) : '—' },
                  { label: 'Member since',  value: member.join_date ? new Date(member.join_date).getFullYear().toString() : '—' },
                ].map(({ label, value }) => (
                  <Box key={label}>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.5 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: INK }}>{value}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Call / text */}
              {member.phone && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    component="a"
                    href={`tel:${member.phone}`}
                    size="small"
                    startIcon={<PhoneIcon />}
                    sx={{ bgcolor: FOREST, color: '#fff', textTransform: 'none', fontSize: '0.8rem', '&:hover': { bgcolor: '#152e22' } }}
                  >
                    Call
                  </Button>
                  <Button
                    component="a"
                    href={`sms:${member.phone}`}
                    size="small"
                    startIcon={<SmsIcon />}
                    sx={{ bgcolor: IVORY_DEEP, color: INK, textTransform: 'none', fontSize: '0.8rem' }}
                  >
                    Text
                  </Button>
                  <Typography sx={{ fontSize: '0.75rem', color: INK_FAINT, alignSelf: 'center', ml: 0.5 }}>
                    {member.phone}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* 3 signals */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
            {/* Signal 1: Last complaint */}
            <Card>
              <CardContent sx={{ p: '16px !important' }}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK_FAINT, mb: 1 }}>
                  Service signal
                </Typography>
                {member.signals.last_complaint ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: member.signals.last_complaint.priority === 'critical' ? 'rgba(139,58,58,0.7)' : member.signals.last_complaint.priority === 'high' ? 'rgba(166,107,47,0.7)' : 'rgba(163,132,88,0.5)', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: INK }}>
                        {member.signals.last_complaint.category ?? 'Complaint'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>{member.signals.last_complaint.priority}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: INK, lineHeight: 1.4, mb: 0.75 }}>
                      {member.signals.last_complaint.description?.substring(0, 80)}{(member.signals.last_complaint.description?.length ?? 0) > 80 ? '…' : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>
                      {new Date(member.signals.last_complaint.reported_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {member.signals.recent_complaints_count > 1 ? ` · ${member.signals.recent_complaints_count} total` : ''}
                    </Typography>
                  </>
                ) : (
                  <Typography sx={{ fontSize: '0.8rem', color: '#3d6a4b', fontWeight: 500 }}>No open complaints</Typography>
                )}
              </CardContent>
            </Card>

            {/* Signal 2: Last booking */}
            <Card>
              <CardContent sx={{ p: '16px !important' }}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK_FAINT, mb: 1 }}>
                  Activity signal
                </Typography>
                {member.signals.last_booking ? (
                  <>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: INK, mb: 0.5 }}>
                      {new Date(member.signals.last_booking.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>
                      Tee time {member.signals.last_booking.tee_time}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT, mt: 0.5 }}>
                      {member.visit_count_12m} round{member.visit_count_12m !== 1 ? 's' : ''} in 12 months
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: '0.8rem', color: INK_FAINT, mb: 0.5 }}>No recent bookings</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: INK_FAINT }}>
                      Last active: {member.last_activity_date ? new Date(member.last_activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'unknown'}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Signal 3: Billing / dues */}
            <Card>
              <CardContent sx={{ p: '16px !important' }}>
                <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK_FAINT, mb: 1 }}>
                  Financial signal
                </Typography>
                {member.signals.billing_summary.length > 0 ? (
                  <>
                    {member.signals.billing_summary.slice(0, 3).map(b => (
                      <Box key={b.charge_type} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>{b.charge_type.replace(/_/g, ' ')}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: INK }}>${b.total.toLocaleString()}</Typography>
                      </Box>
                    ))}
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: INK, mb: 0.5 }}>
                      ${member.annual_dues.toLocaleString()}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: INK_QUIET }}>Annual dues</Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </Box>
  )
}
