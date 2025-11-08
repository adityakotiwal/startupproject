'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type SidebarState = 'expanded' | 'collapsed' | 'hover'

interface SidebarContextType {
  state: SidebarState
  setState: (state: SidebarState) => void
  isExpanded: boolean
  isCollapsed: boolean
  isHoverMode: boolean
  setExpanded: () => void
  setCollapsed: () => void
  setHoverMode: () => void
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SidebarState>('expanded')
  const [isHovered, setIsHovered] = useState(false)

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarState') as SidebarState
    if (savedState && ['expanded', 'collapsed', 'hover'].includes(savedState)) {
      setState(savedState)
    }
  }, [])

  // Save state to localStorage whenever it changes
  const updateState = (newState: SidebarState) => {
    setState(newState)
    localStorage.setItem('sidebarState', newState)
  }

  const value: SidebarContextType = {
    state,
    setState: updateState,
    isExpanded: state === 'expanded' || (state === 'hover' && isHovered),
    isCollapsed: state === 'collapsed' && !isHovered,
    isHoverMode: state === 'hover',
    setExpanded: () => updateState('expanded'),
    setCollapsed: () => updateState('collapsed'),
    setHoverMode: () => updateState('hover'),
    toggleSidebar: () => {
      if (state === 'expanded') {
        updateState('collapsed')
      } else {
        updateState('expanded')
      }
    },
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
