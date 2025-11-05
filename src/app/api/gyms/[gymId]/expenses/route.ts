import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * 🔒 NEW PATH-BASED EXPENSES ROUTE
 * gymId is REQUIRED in the path: /api/gyms/:gymId/expenses
 * Old callers without gymId will 404 → easy to spot
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { gymId: string } }
) {
  const gymId = params.gymId
  const auth = req.headers.get('authorization')
  const referer = req.headers.get('referer')
  const ua = req.headers.get('user-agent')

  // 401: Missing authorization
  if (!auth?.startsWith('Bearer ')) {
    console.warn('[GET /api/gyms/:gymId/expenses] 401 - No bearer token', { 
      referer, 
      ua: ua?.substring(0, 50) 
    })
    return NextResponse.json({ error: 'Unauthorized: missing bearer token' }, { status: 401 })
  }

  // 400: Missing gymId (shouldn't happen with path-based routing, but be explicit)
  if (!gymId) {
    console.warn('[GET /api/gyms/:gymId/expenses] 400 - Missing gymId', { referer, ua })
    return NextResponse.json({ error: 'Missing gymId in path' }, { status: 400 })
  }

  const jwt = auth.slice('Bearer '.length)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  )

  // Verify user authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.warn('[GET /api/gyms/:gymId/expenses] 401 - Invalid token', { gymId })
    return NextResponse.json({ error: 'Unauthorized: invalid token' }, { status: 401 })
  }

  // Verify gym exists and user has access
  const { data: gym, error: gymErr } = await supabase
    .from('gyms')
    .select('id, owner_id')
    .eq('id', gymId)
    .maybeSingle()

  if (gymErr) {
    console.error('[GET /api/gyms/:gymId/expenses] 500 - Gym query error', { 
      gymId, 
      error: gymErr.message 
    })
    return NextResponse.json({ error: gymErr.message }, { status: 500 })
  }

  if (!gym) {
    console.warn('[GET /api/gyms/:gymId/expenses] 400 - Invalid gymId', { gymId })
    return NextResponse.json({ error: 'Invalid gymId: gym not found' }, { status: 400 })
  }

  if (gym.owner_id !== user.id) {
    console.warn('[GET /api/gyms/:gymId/expenses] 403 - Access denied', { 
      gymId, 
      userId: user.id, 
      ownerId: gym.owner_id 
    })
    return NextResponse.json({ error: 'Forbidden: not gym owner' }, { status: 403 })
  }

  // Fetch expenses for this gym
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select('*')
    .eq('gym_id', gymId)
    .order('expense_date', { ascending: false })

  if (expErr) {
    console.error('[GET /api/gyms/:gymId/expenses] 500 - Expenses query error', { 
      gymId, 
      error: expErr.message 
    })
    return NextResponse.json({ error: expErr.message }, { status: 500 })
  }

  console.log(`✅ [GET /api/gyms/${gymId}/expenses] Returned ${expenses?.length || 0} expenses`)
  return NextResponse.json({ expenses: expenses || [] })
}

export const dynamic = 'force-dynamic'
