import { createTheme } from '@mui/material/styles'

const FOREST = '#1e3a2d'
const FOREST_LIGHT = '#2f5a44'
const BRASS = '#a38458'
const BRASS_PALE = '#e9dcc0'
const IVORY = '#f4f0e8'
const PAPER = '#fbf9f4'
const INK = '#1a1f1b'
const INK_QUIET = '#6b6f6a'
const RULE = 'rgba(26, 31, 27, 0.08)'

const serifStack = "'Cormorant Garamond', Georgia, serif"
const sansStack = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
const monoStack = "'JetBrains Mono', monospace"

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: IVORY,
      paper: '#ffffff',
    },
    primary: {
      main: FOREST,
      light: FOREST_LIGHT,
      contrastText: '#ffffff',
    },
    secondary: {
      main: BRASS,
      light: BRASS_PALE,
    },
    text: {
      primary: INK,
      secondary: INK_QUIET,
    },
    divider: RULE,
  },
  typography: {
    fontFamily: sansStack,
    h1: { fontFamily: serifStack, fontWeight: 500 },
    h2: { fontFamily: serifStack, fontWeight: 500 },
    h3: { fontFamily: serifStack, fontWeight: 500 },
    h4: { fontFamily: serifStack, fontWeight: 500 },
    h5: { fontFamily: serifStack, fontWeight: 500 },
    h6: { fontFamily: serifStack, fontWeight: 500 },
    overline: { fontFamily: monoStack, letterSpacing: '0.08em' },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background-color: ${IVORY};
          font-family: ${sansStack};
        }
        a {
          color: inherit;
          text-decoration: none;
        }
      `,
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: PAPER,
          borderRight: '1px solid rgba(26, 31, 27, 0.14)',
          boxShadow: '1px 0 0 rgba(26, 31, 27, 0.04)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          paddingLeft: 20,
          paddingRight: 20,
          '&.active-nav': {
            color: FOREST,
            fontWeight: 500,
            borderLeft: `3px solid ${BRASS}`,
            paddingLeft: 17,
            backgroundColor: 'rgba(30, 58, 45, 0.04)',
          },
          '&:hover': {
            backgroundColor: 'rgba(30, 58, 45, 0.04)',
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.8125rem',
          fontWeight: 400,
          letterSpacing: '0.01em',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: `1px solid ${RULE}`,
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: RULE },
      },
    },
  },
})

export default theme
