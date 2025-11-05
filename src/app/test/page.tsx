'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...')
  const [userStatus, setUserStatus] = useState('Checking...')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Test basic connection
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setConnectionStatus('❌ Connection Error: ' + error.message)
      } else {
        setConnectionStatus('✅ Supabase Connected Successfully')
      }

      setUserStatus(data.session ? '✅ User Logged In: ' + data.session.user.email : '❌ No User Session')

    } catch (error) {
      setConnectionStatus('❌ Exception: ' + (error as Error).message)
    }
  }

  const testSignUp = async () => {
    try {
      const testEmail = 'test@gymsync.com'
      const testPassword = 'password123'
      
      console.log('Testing signup...')
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: 'Test User',
          },
        },
      })

      console.log('Signup result:', { data, error })
      
      if (error) {
        alert('Signup Error: ' + error.message)
      } else {
        alert('Signup Success! Check console for details')
      }
    } catch (error) {
      console.error('Signup exception:', error)
      alert('Signup Exception: ' + (error as Error).message)
    }
  }

  const testSignIn = async () => {
    try {
      const testEmail = 'test@gymsync.com'
      const testPassword = 'password123'
      
      console.log('Testing signin...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      console.log('Signin result:', { data, error })
      
      if (error) {
        alert('Signin Error: ' + error.message)
      } else {
        alert('Signin Success! Check console for details')
        testConnection() // Refresh status
      }
    } catch (error) {
      console.error('Signin exception:', error)
      alert('Signin Exception: ' + (error as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Connection Status:</h3>
            <p className="text-sm">{connectionStatus}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">User Status:</h3>
            <p className="text-sm">{userStatus}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Environment Variables:</h3>
            <p className="text-xs break-all">URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Set'}</p>
            <p className="text-xs break-all">Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not Set'}</p>
          </div>

          <div className="space-y-2">
            <button 
              onClick={testSignUp}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Sign Up (test@gymsync.com)
            </button>
            <button 
              onClick={testSignIn}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test Sign In (test@gymsync.com)
            </button>
            <button 
              onClick={testConnection}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}