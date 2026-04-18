import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import type { ReactNode } from 'react'

// ─── Color tokens ────────────────────────────────────────────────────────────
export const PH      = 'rgba(26,31,27,0.07)'
export const PH_DARK = 'rgba(26,31,27,0.12)'
export const INK        = '#1a1f1b'
export const INK_SOFT   = '#3a403b'
export const INK_QUIET  = '#6b6f6a'
export const INK_FAINT  = '#95988f'
export const FOREST     = '#1e3a2d'
export const BRASS      = '#a38458'
export const IVORY_DEEP = '#ebe5d8'
export const SERIF = "'Cormorant Garamond', Georgia, serif"
export const MONO  = "'JetBrains Mono', monospace"

// ─── Bar — placeholder content block ────────────────────────────────────────
export function Bar({ w = '100%', h = 10, mt = 0 }: { w?: string | number; h?: number; mt?: number }) {
  return (
    <Box sx={{ height: h, bgcolor: PH, borderRadius: '3px', width: w, mt: mt ? `${mt}px` : 0 }} />
  )
}

// ─── PageHeader — title + byline bar ────────────────────────────────────────
export function PageHeader({ title }: { title: string }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.75rem', color: INK, lineHeight: 1.2, mb: 0.5 }}>
        {title}
      </Typography>
      <Bar w={240} h={9} />
    </Box>
  )
}

// ─── SectionTitle — card-level heading with optional badge + link ────────────
export function SectionTitle({ children, badge, link }: { children: string; badge?: string; link?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '1.0625rem', color: INK }}>
          {children}
        </Typography>
        {badge && (
          <Box sx={{ bgcolor: IVORY_DEEP, borderRadius: '8px', px: 1, py: '2px', fontSize: '0.625rem', fontWeight: 600, color: INK_QUIET, letterSpacing: '0.02em' }}>
            {badge}
          </Box>
        )}
      </Box>
      {link && (
        <Typography sx={{ fontSize: '0.75rem', color: BRASS, cursor: 'pointer' }}>{link}</Typography>
      )}
    </Box>
  )
}

// ─── StatCard — KPI placeholder card ────────────────────────────────────────
export function StatCard({ label, accent = false, tint }: { label: string; accent?: boolean; tint?: string }) {
  return (
    <Card>
      <CardContent sx={{ p: '14px 16px !important' }}>
        <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: INK_FAINT, mb: 0.75 }}>
          {label}
        </Typography>
        <Box sx={{ height: 26, width: 56, bgcolor: tint ?? (accent ? 'rgba(30,58,45,0.12)' : PH), borderRadius: '3px' }} />
      </CardContent>
    </Card>
  )
}

// ─── RailCard — right-rail card with optional dark variant ───────────────────
export function RailCard({ title, dark = false, children }: { title: string; dark?: boolean; children: ReactNode }) {
  return (
    <Card sx={{ bgcolor: dark ? FOREST : '#ffffff', border: dark ? 'none' : undefined }}>
      <CardContent sx={{ p: '14px 16px !important' }}>
        <Typography sx={{ fontFamily: SERIF, fontWeight: 500, fontSize: '0.875rem', letterSpacing: '0.02em', color: dark ? 'rgba(255,255,255,0.5)' : INK_QUIET, mb: 1.25 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  )
}

// ─── TabStrip — horizontal tabs, pill or underline style ────────────────────
export function TabStrip({
  tabs,
  activeIndex = 0,
  onChange,
  variant = 'pill',
}: {
  tabs: string[]
  activeIndex?: number
  onChange?: (index: number) => void
  variant?: 'pill' | 'underline'
}) {
  return (
    <Box sx={{ display: 'flex' }}>
      {tabs.map((tab, i) => (
        <Box
          key={tab}
          onClick={() => onChange?.(i)}
          sx={{
            px: 1.75, py: 0.75, cursor: 'pointer',
            borderRadius: variant === 'pill' ? '4px' : 0,
            bgcolor: variant === 'pill' && i === activeIndex ? FOREST : 'transparent',
            borderBottom: variant === 'underline'
              ? `2px solid ${i === activeIndex ? BRASS : 'transparent'}`
              : 'none',
          }}
        >
          <Typography sx={{
            fontSize: '0.8125rem',
            fontWeight: i === activeIndex ? 500 : 400,
            color: variant === 'pill'
              ? (i === activeIndex ? '#fff' : INK_QUIET)
              : (i === activeIndex ? INK : INK_QUIET),
          }}>
            {tab}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

// ─── Toggle — on/off switch for agent cards ──────────────────────────────────
export function Toggle({ on = false }: { on?: boolean }) {
  return (
    <Box sx={{
      width: 32, height: 18, borderRadius: '9px', flexShrink: 0,
      bgcolor: on ? FOREST : PH_DARK,
      border: `1px solid ${on ? FOREST : 'rgba(26,31,27,0.18)'}`,
      position: 'relative', cursor: 'pointer',
      transition: 'background 0.2s',
      '&::after': {
        content: '""', position: 'absolute', top: '2px',
        left: on ? '14px' : '2px', width: 12, height: 12,
        borderRadius: '50%', bgcolor: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }
    }} />
  )
}

// ─── RailRows — generic stacked placeholder rows for rail cards ───────────────
export function RailRows({ count, twoLine = false }: { count: number; twoLine?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.625 }}>
          <Box sx={{ flex: 1 }}>
            <Bar w={`${55 + (i % 3) * 10}%`} h={9} />
            {twoLine && <Bar w={`${35 + (i % 4) * 8}%`} h={8} mt={4} />}
          </Box>
          <Bar w={32} h={9} />
        </Box>
      ))}
    </>
  )
}

// ─── AccentRows — color-coded left-border rows (queues, actions) ─────────────
export function AccentRows({ count, colors }: { count: number; colors: string[] }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const color = colors[i % colors.length]
        return (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, py: 1.25, borderBottom: i < count - 1 ? '1px solid rgba(26,31,27,0.06)' : 'none' }}>
            <Box sx={{ width: 3, bgcolor: color, borderRadius: '2px', alignSelf: 'stretch', opacity: 0.55, flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Bar w="42%" h={10} />
                <Box sx={{ height: 22, width: 56, bgcolor: PH, borderRadius: '3px' }} />
              </Box>
              <Bar w="70%" h={9} />
              <Bar w="40%" h={8} mt={5} />
            </Box>
          </Box>
        )
      })}
    </>
  )
}
