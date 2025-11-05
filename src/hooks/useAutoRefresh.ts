import { useEffect, useRef, useCallback } from 'react'

interface UseAutoRefreshOptions {
  onRefresh: () => void
  interval?: number // in milliseconds, default 30 seconds
  enabled?: boolean // whether auto-refresh is enabled
}

/**
 * Custom hook for auto-refreshing data with debouncing
 * - Auto-refreshes data at specified interval when tab is visible
 * - Provides debounced manual refresh to prevent spam
 * - Cleans up on unmount
 */
export function useAutoRefresh({ 
  onRefresh, 
  interval = 30000, // 30 seconds default
  enabled = true 
}: UseAutoRefreshOptions) {
  const lastRefreshTime = useRef<number>(Date.now())
  const DEBOUNCE_DELAY = 2000 // 2 seconds cooldown between manual refreshes

  // Debounced manual refresh
  const debouncedRefresh = useCallback(() => {
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshTime.current

    // Prevent spam - require 2 second gap between refreshes
    if (timeSinceLastRefresh < DEBOUNCE_DELAY) {
      console.log(`⏳ Please wait ${Math.ceil((DEBOUNCE_DELAY - timeSinceLastRefresh) / 1000)}s before refreshing again`)
      return
    }

    lastRefreshTime.current = now
    onRefresh()
  }, [onRefresh])

  // Auto-refresh when tab is visible
  useEffect(() => {
    if (!enabled) return

    // Auto-refresh interval
    const intervalId = setInterval(() => {
      // Only refresh if tab is visible (saves resources)
      if (document.visibilityState === 'visible') {
        console.log('🔄 Auto-refreshing data...')
        onRefresh()
      }
    }, interval)

    // Refresh when tab becomes visible after being hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastRefresh = Date.now() - lastRefreshTime.current
        // If more than interval time has passed, refresh
        if (timeSinceLastRefresh > interval) {
          console.log('👁️ Tab visible - refreshing stale data...')
          onRefresh()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [onRefresh, interval, enabled])

  return { debouncedRefresh }
}
