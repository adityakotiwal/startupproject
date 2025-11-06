'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function HealthCheck() {
  const [status, setStatus] = useState<any>({
    loading: true,
    envVars: false,
    supabaseConnection: false,
    error: null
  })

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Check environment variables
        const envVars = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        
        // Try a simple Supabase query with timeout
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
        
        const healthCheck = supabase.from('gyms').select('count').limit(1)
        
        try {
          await Promise.race([healthCheck, timeout])
          setStatus({
            loading: false,
            envVars: true,
            supabaseConnection: true,
            error: null
          })
        } catch (err: any) {
          setStatus({
            loading: false,
            envVars: true,
            supabaseConnection: false,
            error: err.message
          })
        }
      } catch (error: any) {
        setStatus({
          loading: false,
          envVars: false,
          supabaseConnection: false,
          error: error.message
        })
      }
    }

    checkHealth()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">GymSync Pro - Health Check</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <span className={`px-3 py-1 rounded ${status.loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
              {status.loading ? 'Checking...' : 'Complete'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Environment Variables:</span>
            <span className={`px-3 py-1 rounded ${status.envVars ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {status.envVars ? '✓ Configured' : '✗ Missing'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Supabase Connection:</span>
            <span className={`px-3 py-1 rounded ${status.supabaseConnection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {status.supabaseConnection ? '✓ Connected' : '✗ Failed'}
            </span>
          </div>

          {status.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="font-medium text-red-800">Error:</p>
              <p className="text-red-600 text-sm mt-1">{status.error}</p>
            </div>
          )}

          {!status.loading && status.envVars && status.supabaseConnection && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="font-medium text-green-800">✓ All systems operational</p>
              <p className="text-green-600 text-sm mt-1">You can navigate to the app</p>
              <a href="/auth/login" className="text-blue-600 hover:underline mt-2 inline-block">
                Go to Login →
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Build time: {new Date().toISOString()}</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  )
}
