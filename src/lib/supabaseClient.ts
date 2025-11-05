import { createClient } from '@supabase/supabase-js'

// These environment variables should be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Improve session persistence for app switching
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'gymsync-auth-token', // Unique key for better isolation
    flowType: 'pkce',
    // Reduce aggressive session checking
    debug: false
  },
  // Add retry logic for better reliability
  global: {
    headers: {
      'x-client-info': 'gymsyncpro@1.0.0'
    }
  },
  // Reduce realtime connection issues
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// Session recovery utility
export const recoverSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Session recovery error:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Failed to recover session:', error)
    return null
  }
}

// Check if session is valid
export const isSessionValid = async () => {
  try {
    const session = await recoverSession()
    if (!session) return false
    
    // Check if session is expired
    const now = Math.round(Date.now() / 1000)
    return session.expires_at ? session.expires_at > now : false
  } catch (error) {
    console.error('Session validation error:', error)
    return false
  }
}

export default supabase