/**
 * API Client with automatic fresh token injection
 * Ensures every API call uses the latest auth token
 */

import { supabase } from './supabaseClient'

/**
 * Make an authenticated API call with a fresh token
 * @param path - API path (e.g., '/api/whatsapp/send')
 * @param init - Fetch init options
 * @returns Fetch response
 */
export async function callApi(path: string, init: RequestInit = {}): Promise<Response> {
  // Always get fresh session before API call
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers = new Headers(init.headers || {})
  
  // Inject fresh bearer token
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  
  // Set Content-Type if not already set
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  
  return fetch(path, {
    ...init,
    headers,
    cache: 'no-store', // Never cache API calls
  })
}

/**
 * Timeout wrapper for async operations
 * @param promise - Promise to wrap
 * @param ms - Timeout in milliseconds (default: 15000)
 * @returns Promise result or throws timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 15000
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  
  try {
    return await promise
  } finally {
    clearTimeout(timeoutId)
  }
}
