'use client'

import React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

// Create a minimal MUI theme that works well with Tailwind
const theme = createTheme({
  // Disable MUI's CSS baseline to prevent conflicts with Tailwind
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // Prevent MUI from overriding body styles
          margin: 0,
          padding: 0,
        },
      },
    },
  },
  // Use a color palette that complements your existing design
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Tailwind blue-600 to match your existing buttons
    },
    secondary: {
      main: '#64748b', // Tailwind slate-500
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  // Adjust typography to complement Tailwind
  typography: {
    fontFamily: 'inherit', // Use whatever font Tailwind is using
  },
})

interface MUIProviderProps {
  children: React.ReactNode
}

export default function MUIProvider({ children }: MUIProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      {/* Only include CssBaseline for DataGrid-specific resets */}
      <CssBaseline enableColorScheme={false} />
      {children}
    </ThemeProvider>
  )
}