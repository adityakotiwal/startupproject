'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

interface Gym {
  id: string
  name: string
  owner_id: string
}

export function useGymContext() {
  const { user } = useAuth()
  const [currentGym, setCurrentGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setCurrentGym(null)
      setLoading(false)
      return
    }

    const fetchCurrentGym = async () => {
      try {
        setLoading(true)
        setError(null)

        // ALWAYS fetch gym based on current user's ownership, not localStorage
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
          console.log('✅ Current gym set:', gymData)
        } else {
          setCurrentGym(null)
          setError('No gym found')
        }
      } catch (error) {
        console.error('Error in fetchCurrentGym:', error)
        setError('Failed to fetch gym data')
        setCurrentGym(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentGym()
  }, [user?.id]) // Only depend on user.id, not localStorage

  return {
    currentGym,
    loading,
    error,
    gymId: currentGym?.id || null
  }
}