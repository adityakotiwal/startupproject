import { NextResponse } from 'next/server'

/**
 * 🚨 DEPRECATED ENDPOINT TRAP
 * This catches old callers using /api/expenses (without gymId in path)
 * Returns 410 Gone with clear migration message
 * 
 * If you see this in Network tab → Find and fix the caller!
 */
export async function GET() {
  console.error(
    '🚨 [DEPRECATED] /api/expenses called without gymId in path!\n' +
    '   ❌ Old: GET /api/expenses?gymId=...\n' +
    '   ✅ New: GET /api/gyms/:gymId/expenses\n' +
    '   → Check Network tab Initiator to find the bad caller'
  )
  
  return NextResponse.json(
    { 
      error: 'Deprecated endpoint. Use /api/gyms/:gymId/expenses',
      migration: {
        old: '/api/expenses?gymId=xxx',
        new: '/api/gyms/xxx/expenses',
        hint: 'Check the Network tab Initiator column to find the caller'
      }
    },
    { status: 410 } // 410 Gone - Resource permanently removed
  )
}

export const dynamic = 'force-dynamic'
