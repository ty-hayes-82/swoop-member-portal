import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'

const FOREST = '#3d6a4b'
const BRASS  = '#c4a573'
const INK    = '#1a1f1b'
const IVORY  = '#f5f0e8'
const SERIF  = "'EB Garamond', Georgia, serif"

const ANALYSTS = [
  { name: 'Member Pulse',         desc: 'Health-scores every member daily. Flags who needs attention before they cancel.' },
  { name: 'Service Recovery',     desc: 'Watches the complaint queue in real time. Ensures nothing slips past 24 hours unresolved.' },
  { name: 'Revenue Analyst',      desc: 'Spots F&B revenue leakage — members who should be dining at the club but aren\'t.' },
  { name: 'Labor Optimizer',      desc: 'Reads upcoming reservations and weather. Flags over/under-staffing the night before.' },
  { name: 'Engagement Autopilot', desc: 'Finds members who\'ve gone quiet. Drafts a re-engagement note in the GM\'s voice.' },
]

const PROOF = [
  { stat: '70%', label: 'of GMs surveyed want a single morning cockpit for their club' },
  { stat: '60%', label: 'want a real-time member health pulse they can check on a phone' },
  { stat: '4/4', label: 'Jonas clubs surveyed want 90-day onboarding or faster' },
  { stat: '3/4', label: 'pilot respondents prefer gradual trust unlock rather than full automation day one' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <Box sx={{ fontFamily: "'Inter', sans-serif", bgcolor: IVORY, minHeight: '100vh', color: INK }}>
      {/* Nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, md: 6 }, py: 2, borderBottom: '1px solid rgba(26,31,27,0.08)', bgcolor: '#fff' }}>
        <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.25rem', color: INK }}>ClubThread</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography
            onClick={() => window.location.href = 'mailto:ty@clubthread.co?subject=Pilot inquiry'}
            sx={{ fontSize: '0.8125rem', color: INK, cursor: 'pointer', '&:hover': { color: FOREST } }}
          >Contact</Typography>
          <Box
            onClick={() => navigate('/')}
            sx={{ height: 34, px: 2, bgcolor: FOREST, borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#2d5238' } }}
          >
            <Typography sx={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 500 }}>Sign in</Typography>
          </Box>
        </Box>
      </Box>

      {/* Hero */}
      <Box sx={{ px: { xs: 2, md: 6 }, pt: { xs: 6, md: 10 }, pb: { xs: 6, md: 10 }, maxWidth: 900, mx: 'auto', textAlign: { xs: 'left', md: 'center' } }}>
        <Box sx={{ display: 'inline-flex', px: 1.5, py: '4px', bgcolor: 'rgba(196,165,115,0.15)', border: '1px solid rgba(196,165,115,0.4)', borderRadius: '20px', mb: 3 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: BRASS }}>Now in pilot · Bowling Green CC</Typography>
        </Box>
        <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: { xs: '2.25rem', md: '3rem' }, color: INK, lineHeight: 1.15, mb: 2.5 }}>
          The operating layer for<br />
          <em style={{ color: FOREST }}>private clubs.</em>
        </Typography>
        <Typography sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, color: 'rgba(26,31,27,0.6)', lineHeight: 1.7, mb: 4, maxWidth: 600, mx: { xs: 0, md: 'auto' } }}>
          AI agents watch your Jonas data around the clock and surface what matters to the GM — before the GM has to go looking for it. Your morning briefing in 20 seconds, on a phone.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'center' } }}>
          <Box
            onClick={() => window.location.href = 'mailto:ty@clubthread.co?subject=Pilot inquiry'}
            sx={{ height: 46, px: 3, bgcolor: FOREST, borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#2d5238' } }}
          >
            <Typography sx={{ fontSize: '0.9375rem', color: '#fff', fontWeight: 500 }}>Book a pilot call</Typography>
          </Box>
          <Box
            onClick={() => navigate('/demo')}
            sx={{ height: 46, px: 3, bgcolor: 'rgba(26,31,27,0.06)', borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(26,31,27,0.1)' } }}
          >
            <Typography sx={{ fontSize: '0.9375rem', color: INK, fontWeight: 500 }}>See the demo →</Typography>
          </Box>
        </Box>
      </Box>

      {/* How it works */}
      <Box sx={{ bgcolor: '#fff', px: { xs: 2, md: 6 }, py: { xs: 6, md: 8 }, borderTop: '1px solid rgba(26,31,27,0.08)', borderBottom: '1px solid rgba(26,31,27,0.08)' }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: BRASS, mb: 1.5, textAlign: 'center' }}>How it works</Typography>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: { xs: '1.5rem', md: '1.875rem' }, color: INK, textAlign: 'center', mb: 5 }}>
            Three steps. No new software to learn.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4 }}>
            {[
              { num: '01', title: 'Connect Jonas', body: 'Export a CSV from your Jonas installation. Upload it to ClubThread. Members, households, and health scores are computed automatically in under 5 minutes.' },
              { num: '02', title: 'Agents surface signals', body: 'Five analyst agents run on a schedule — watching member activity, complaints, revenue, staffing, and engagement. Every insight is sourced from your data.' },
              { num: '03', title: 'GM acts in 20 seconds', body: 'Each morning, a prioritized action list waits. Approve a recommendation, dismiss it, or hold it. Every action is logged. Nothing sends automatically without GM approval.' },
            ].map(({ num, title, body }) => (
              <Box key={num}>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '2.5rem', color: 'rgba(196,165,115,0.4)', lineHeight: 1, mb: 1 }}>{num}</Typography>
                <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.125rem', color: INK, mb: 1 }}>{title}</Typography>
                <Typography sx={{ fontSize: '0.875rem', color: 'rgba(26,31,27,0.6)', lineHeight: 1.7 }}>{body}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Agent roster */}
      <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 6, md: 8 } }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: BRASS, mb: 1.5, textAlign: 'center' }}>Agent roster</Typography>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: { xs: '1.5rem', md: '1.875rem' }, color: INK, textAlign: 'center', mb: 4 }}>
            Five analysts. Always running.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {ANALYSTS.map(({ name, desc }) => (
              <Box key={name} sx={{ p: 2.5, bgcolor: '#fff', borderRadius: '6px', border: '1px solid rgba(26,31,27,0.08)' }}>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1.0625rem', color: INK, mb: 0.75 }}>{name}</Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(26,31,27,0.6)', lineHeight: 1.6 }}>{desc}</Typography>
              </Box>
            ))}
            <Box sx={{ p: 2.5, bgcolor: 'rgba(61,106,75,0.04)', borderRadius: '6px', border: `1px solid rgba(61,106,75,0.15)`, display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.8125rem', color: FOREST, lineHeight: 1.6 }}>
                Plus role agents for GM, Membership, F&amp;B, Golf, Dining, Events, Pro Shop, Controller, and more.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Proof points */}
      <Box sx={{ bgcolor: FOREST, px: { xs: 2, md: 6 }, py: { xs: 6, md: 8 } }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: { xs: '1.5rem', md: '1.875rem' }, color: '#fff', textAlign: 'center', mb: 4 }}>
            What GMs told us
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            {PROOF.map(({ stat, label }) => (
              <Box key={stat} sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '2.5rem', color: BRASS, lineHeight: 1, mb: 1 }}>{stat}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
          <Typography sx={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', mt: 3 }}>
            Based on surveys of 10 private club GMs and 4 Jonas club pilot respondents — Tier 2 data.
          </Typography>
        </Box>
      </Box>

      {/* CTA */}
      <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: { xs: '1.5rem', md: '2rem' }, color: INK, mb: 2 }}>
          Ready to run your first morning briefing on real data?
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: 'rgba(26,31,27,0.55)', mb: 4 }}>
          We're accepting pilot clubs now. Jonas integration takes under 4 hours.
        </Typography>
        <Box
          onClick={() => window.location.href = 'mailto:ty@clubthread.co?subject=Pilot inquiry'}
          sx={{ display: 'inline-flex', height: 50, px: 4, bgcolor: FOREST, borderRadius: '4px', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#2d5238' } }}
        >
          <Typography sx={{ fontSize: '1rem', color: '#fff', fontWeight: 500 }}>Book a pilot call</Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ px: { xs: 2, md: 6 }, py: 3, borderTop: '1px solid rgba(26,31,27,0.08)', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: '1rem', color: INK }}>ClubThread</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ px: 1, py: '2px', bgcolor: 'rgba(61,106,75,0.08)', border: '1px solid rgba(61,106,75,0.2)', borderRadius: '3px' }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: FOREST }}>Pilot · Bowling Green CC</Typography>
          </Box>
        </Box>
        <Typography
          onClick={() => window.location.href = 'mailto:ty@clubthread.co'}
          sx={{ fontSize: '0.75rem', color: 'rgba(26,31,27,0.45)', cursor: 'pointer', '&:hover': { color: FOREST } }}
        >ty@clubthread.co</Typography>
      </Box>
    </Box>
  )
}
