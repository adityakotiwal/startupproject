'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook to prevent infinite loading states during navigation
 * Only forces loading completion for data loading, not authentication
 */
export function useNavigationTimeout(loading: boolean, setLoading: (loading: boolean) => void, timeout = 4000, hasData = false) {
  const router = useRouter()

  useEffect(() => {
    if (!loading) return

    console.log(`🔄 Navigation loading timeout set for ${timeout}ms`)
    
    const navigationTimeout = setTimeout(() => {
      // Only force loading completion if we have some data or it's clearly stuck
      if (hasData || timeout > 5000) {
        console.log('⏰ Navigation timeout reached - forcing loading completion')
        setLoading(false)
      } else {
        console.log('⏰ Navigation timeout reached but no data - keeping loading for auth')
      }
    }, timeout)

    // Clear timeout if loading completes naturally
    if (!loading) {
      clearTimeout(navigationTimeout)
    }

    return () => {
      clearTimeout(navigationTimeout)
    }
  }, [loading, setLoading, timeout, hasData])

  // Also clear loading on route change
  useEffect(() => {
    const handleRouteChange = () => {
      console.log('🔄 Route changed - clearing any stuck loading states')
      setLoading(false)
    }

    // Listen for route changes (Next.js app router)
    window.addEventListener('beforeunload', handleRouteChange)
    
    return () => {
      window.removeEventListener('beforeunload', handleRouteChange)
    }
  }, [setLoading])
}