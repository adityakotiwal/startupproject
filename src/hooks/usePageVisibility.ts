'use client'

import { useState, useEffect } from 'react'

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    // Set initial visibility
    setIsVisible(!document.hidden)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return isVisible
}

// Hook to reset loading states when page becomes visible
export function useLoadingReset(resetCallback: () => void, dependencies: any[] = []) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          resetCallback()
        }, 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCallback, ...dependencies])
}