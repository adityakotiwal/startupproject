'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('Home page - Auth state:', { user: !!user, loading })
    
    if (!loading) {
      if (user) {
        console.log('User found, redirecting to dashboard')
        router.replace('/dashboard')
      } else {
        console.log('No user, redirecting to login')
        router.replace('/auth/login')
      }
    }
  }, [user, loading, router])

  // Show loading while redirecting
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      <p className="mt-4 text-gray-600">
        {loading ? 'Checking authentication...' : 'Redirecting...'}
      </p>
    </main>
  )
}