'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

interface Gym {
  id: string
  name: string
  owner_id: string
}

interface GymContextType {
  currentGym: Gym | null
  gymId: string | null
  loading: boolean
  error: string | null
  refreshGym: () => Promise<void>
}

const GymContext = createContext<GymContextType | undefined>(undefined)

export function GymProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [currentGym, setCurrentGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentGym = async () => {
    if (!user?.id) {
      setCurrentGym(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .select('id, name, owner_id')
        .eq('owner_id', user.id)
        .limit(1)
        .single()

      if (gymError) {
        console.error('Error fetching gym:', gymError)
        setError('No gym found for current user')
        setCurrentGym(null)
        return
      }

      if (gymData) {
        setCurrentGym(gymData)
      } else {
        setCurrentGym(null)
        setError('No gym found')
      }
    } catch (err) {
      console.error('Error in fetchCurrentGym:', err)
      setError('Failed to fetch gym')
      setCurrentGym(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentGym()
  }, [user?.id])

  const value = {
    currentGym,
    gymId: currentGym?.id || null,
    loading,
    error,
    refreshGym: fetchCurrentGym
  }

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>
}

export function useGymContext() {
  const context = useContext(GymContext)
  if (context === undefined) {
    throw new Error('useGymContext must be used within a GymProvider')
  }
  return context
}
