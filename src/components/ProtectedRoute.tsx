'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [initialCheck, setInitialCheck] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
      }
      setInitialCheck(false)
    }
  }, [user, loading, router])

  // Show loading spinner only on initial check, not on subsequent re-renders
  if (loading && initialCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return null
  }

  return <>{children}</>
}