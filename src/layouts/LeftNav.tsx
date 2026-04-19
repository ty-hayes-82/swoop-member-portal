import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import TimelapseIcon from '@mui/icons-material/Timelapse'
import PeopleIcon from '@mui/icons-material/People'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TuneIcon from '@mui/icons-material/Tune'
import HubIcon from '@mui/icons-material/Hub'
import SettingsIcon from '@mui/icons-material/Settings'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'

const NAV_ITEMS: { label: string; path: string; icon: React.ReactNode; indent: boolean; parent?: string }[] = [
  { label: 'Today',        path: '/',             icon: <AutoAwesomeIcon fontSize="small" />,      indent: false },
  { label: 'Service',      path: '/service',      icon: <TimelapseIcon fontSize="small" />,        indent: false },
  { label: 'Members',      path: '/members',      icon: <PeopleIcon fontSize="small" />,           indent: false },
  { label: 'Revenue',      path: '/revenue',      icon: <AttachMoneyIcon fontSize="small" />,      indent: false },
  { label: 'Board',        path: '/board',        icon: <DashboardIcon fontSize="small" />,        indent: false },
  { label: 'Admin',        path: '/admin',        icon: <TuneIcon fontSize="small" />,             indent: false },
  { label: 'Onboarding',   path: '/onboarding',   icon: <PlaylistAddCheckIcon fontSize="small" />, indent: true,  parent: '/admin' },
  { label: 'Integrations', path: '/integrations', icon: <HubIcon fontSize="small" />,              indent: true,  parent: '/admin' },
  { label: 'Settings',     path: '/settings',     icon: <SettingsIcon fontSize="small" />,         indent: true,  parent: '/admin' },
]

export default function LeftNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()

  return (
    <List disablePadding sx={{ mt: 1 }}>
      {NAV_ITEMS.map(({ label, path, icon, indent, parent }) => {
        if (parent) {
          const parentActive = pathname === parent || pathname.startsWith(parent + '/')
          if (!parentActive) return null
        }
        const isActive = path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/')
        return (
          <ListItemButton
            key={path}
            component={NavLink}
            to={path}
            onClick={onNavigate}
            className={isActive ? 'active-nav' : ''}
            sx={{ py: indent ? 0.625 : 1, pl: indent ? 4.5 : 2, color: 'inherit' }}
          >
            <ListItemIcon
              sx={{
                minWidth: indent ? 26 : 32,
                color: isActive ? 'primary.main' : 'text.secondary',
                '& svg': { fontSize: indent ? '1rem' : undefined },
              }}
            >
              {icon}
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{
                sx: {
                  color: isActive ? 'primary.main' : 'text.primary',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: indent ? '0.8125rem' : undefined,
                },
              }}
            />
          </ListItemButton>
        )
      })}
    </List>
  )
}
