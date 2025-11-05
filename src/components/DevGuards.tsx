'use client'

import { useEffect } from 'react'

/**
 * 🚨 DEVELOPMENT GUARD: Traps bad expenses API calls
 * 
 * This component monkey-patches window.fetch in development to catch:
 * - Old route: /api/expenses (without gymId in path)
 * - Wrong path: /expenses or expenses (missing /api/)
 * - Malformed: /api/gyms/.../expenses (missing gymId segment)
 * 
 * When a bad call is detected:
 * - Logs the URL
 * - Prints a full stack trace showing the exact caller
 * - Makes it EASY to find and fix the rogue code
 * 
 * Usage: Mount in app/layout.tsx under development only:
 * {process.env.NODE_ENV === 'development' ? <DevGuards /> : null}
 */
export default function DevGuards() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const origFetch = window.fetch
    
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      
      // Detect bad expenses calls
      const isBadExpensesCall = 
        url.includes('/api/expenses') ||                                      // ❌ Old route (query param)
        url.match(/^(https?:\/\/[^/]+)?\/expenses($|\?)/) ||                // ❌ Missing /api/
        (url.includes('/api/gyms/') && url.includes('/expenses') &&         // ❌ Malformed path
         !/\/api\/gyms\/[a-zA-Z0-9_-]+\/expenses/.test(url))

      if (isBadExpensesCall) {
        console.error(
          '🚨 BAD EXPENSES CALL DETECTED!\n' +
          `   URL: ${url}\n` +
          '   ❌ This call will fail (410 Gone or 404)\n' +
          '   ✅ Use: /api/gyms/:gymId/expenses\n' +
          '   → Stack trace below shows the caller:'
        )
        console.trace('Bad expenses call stack')
      }
      
      return origFetch(input as any, init)
    }

    return () => {
      window.fetch = origFetch
    }
  }, [])

  return null
}
