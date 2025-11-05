/**
 * Development guard for expenses fetching
 * Prevents accidental calls without gymId in development
 */

import { supabase } from '@/lib/supabaseClient'

/**
 * 🔒 DEV GUARD: Fetch expenses with runtime trap
 * In development, throws if called without gymId (with stack trace)
 * In production, returns empty array
 */
export async function fetchExpensesDevGuard(gymId?: string | null) {
  if (!gymId) {
    const error = new Error(
      '💥 fetchExpenses called without gymId — fix the caller!\n' +
      'This is a development guard. In production, this returns [].\n' +
      'Check the stack trace below to find where this was called from.'
    )
    
    console.error('🚨 EXPENSES DEV TRAP:', error.message)
    
    if (process.env.NODE_ENV === 'development') {
      throw error // Crash with stack trace in dev
    }
    
    return { data: [], error: null }
  }

  return supabase
    .from('expenses')
    .select('*')
    .eq('gym_id', gymId)
    .order('expense_date', { ascending: false })
}

/**
 * 🔒 Safe expenses fetch: Returns empty array if no gymId
 * Use this for non-critical UI elements
 */
export async function fetchExpensesSafe(gymId?: string | null) {
  if (!gymId) {
    console.warn('⚠️ fetchExpensesSafe: No gymId provided, returning []')
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('gym_id', gymId)
    .order('expense_date', { ascending: false })

  if (error) {
    console.error('❌ Expenses fetch error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      gymId,
    })
  }

  return { data: data || [], error }
}
