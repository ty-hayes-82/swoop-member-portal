import type { ReactNode } from 'react'
import { useState } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import MenuIcon from '@mui/icons-material/Menu'
import { useTheme, useMediaQuery } from '@mui/material'
import LeftNav from './LeftNav'

const DRAWER_WIDTH = 220

interface Props {
  children: ReactNode
}

export default function AppShell({ children }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const drawerContent = (
    <>
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
        <Typography sx={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: '1.3rem', color: 'primary.main', letterSpacing: '0.02em' }}>
          ClubThread
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
          Club Intelligence
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', pt: 0.5 }}>
        <LeftNav onNavigate={() => setMobileOpen(false)} />
      </Box>
      <Divider />
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.7rem', fontWeight: 600 }}>
          GM
        </Avatar>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.primary' }}>General Manager</Typography>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Bowling Green CC</Typography>
        </Box>
      </Box>
    </>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile top bar */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{ bgcolor: '#fff', borderBottom: '1px solid rgba(26,31,27,0.1)', color: 'text.primary', zIndex: theme.zIndex.drawer + 1 }}
        >
          <Toolbar sx={{ minHeight: '52px !important', px: 2 }}>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1.5, color: 'text.primary' }}>
              <MenuIcon />
            </IconButton>
            <Typography sx={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: '1.1rem', color: 'primary.main' }}>
              ClubThread
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Mobile drawer (temporary) */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, display: 'flex', flexDirection: 'column' } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop drawer (permanent) */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, overflowX: 'hidden', display: 'flex', flexDirection: 'column' } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          bgcolor: 'background.default',
          p: { xs: '68px 16px 32px', md: '20px 28px 40px' },
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
