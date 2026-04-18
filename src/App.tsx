import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import AppShell from './layouts/AppShell'
import Today from './pages/Today'
import Service from './pages/Service'
import Members from './pages/Members'
import MemberCard from './pages/MemberCard'
import Revenue from './pages/Revenue'
import Board from './pages/Board'
import Admin from './pages/Admin'
import Integrations from './pages/Integrations'
import Settings from './pages/Settings'
import MembersEmail from './pages/MembersEmail'
import Demo from './pages/Demo'
import Onboarding from './pages/Onboarding'
import Landing from './pages/Landing'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Standalone routes (no AppShell) */}
          <Route path="/demo" element={<Demo />} />
          <Route path="/welcome" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={
            <AppShell>
              <Routes>
                <Route path="/" element={<Today />} />
                <Route path="/service" element={<Service />} />
                <Route path="/members" element={<Members />} />
                <Route path="/members/:id" element={<MemberCard />} />
                <Route path="/revenue" element={<Revenue />} />
                <Route path="/board" element={<Board />} />
                <Route path="/members/email" element={<MembersEmail />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AppShell>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
