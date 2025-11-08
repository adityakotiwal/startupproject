'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from './AppLayout'

interface ProtectedPageProps {
  children: React.ReactNode
}

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [initialCheck, setInitialCheck] = useState(true)

  // Check if we're on an auth page (no sidebar needed)
  const isAuthPage = pathname?.startsWith('/auth')

  useEffect(() => {
    if (!loading) {
      if (!user && !isAuthPage) {
        router.push('/auth/login')
      }
      setInitialCheck(false)
    }
  }, [user, loading, router, isAuthPage])

  // Show loading spinner only on initial check
  if (loading && initialCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if user is not authenticated
  if (!user && !isAuthPage) {
    return null
  }

  // For auth pages, render without sidebar
  if (isAuthPage) {
    return <>{children}</>
  }

  // For protected pages, render with sidebar layout
  return <AppLayout>{children}</AppLayout>
}
