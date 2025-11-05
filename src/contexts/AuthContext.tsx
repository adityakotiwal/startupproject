'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { AuthContextType, User } from '@/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Add navigation loading timeout protection
  useEffect(() => {
    // Prevent infinite loading states - force stop after 5 seconds
    const loadingTimeout = setTimeout(() => {
      if (loading && initialLoadComplete) {
        console.log('⏰ Force stopping stuck loading state')
        setLoading(false)
      }
    }, 5000)

    return () => clearTimeout(loadingTimeout)
  }, [loading, initialLoadComplete])

  useEffect(() => {
    let mounted = true
    
    // Get initial session without showing loading if we already have a user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          await getProfile(true) // Skip loading spinner for initial check
        } else if (mounted) {
          setLoading(false)
        }
        
        if (mounted) {
          setInitialLoadComplete(true)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
          setInitialLoadComplete(true)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('Auth state changed:', event, !!session)
      
      // Only handle actual auth changes, not token refreshes
      if (event === 'SIGNED_IN' && session?.user) {
        await getProfile(false) // Show loading for actual sign-in
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED') {
        // Don't reload profile on token refresh, session is still valid
        console.log('Token refreshed, keeping current user state')
      }
    })

    // Handle page visibility changes to prevent stuck loading states
    const handleVisibilityChange = () => {
      if (!mounted) return
      
      if (document.visibilityState === 'visible') {
        // Tab became visible again - if we're stuck in loading, reset it
        if (loading && initialLoadComplete) {
          console.log('Tab visible - resetting stuck loading state')
          setLoading(false)
        }
      }
    }

    // Handle page focus to ensure auth state is current (with debouncing)
    let focusTimeout: NodeJS.Timeout
    const handleFocus = async () => {
      if (!mounted || !initialLoadComplete) return
      
      // Clear any existing timeout to debounce rapid focus events
      clearTimeout(focusTimeout)
      
      // Only check session after 2 seconds of focus to avoid rapid checks
      focusTimeout = setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          // Only sign out if session is truly expired AND user was logged in
          if (!session && user) {
            console.log('Session expired after focus check, signing out')
            setUser(null)
            setLoading(false)
          } else if (session && !user) {
            // User might have signed in elsewhere, refresh profile
            console.log('New session detected, refreshing profile')
            await getProfile(true)
          }
        } catch (error) {
          console.log('Focus session check failed:', error)
          // Don't sign out on network errors
        }
      }, 2000)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(focusTimeout) // Clean up focus timeout
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const getProfile = async (skipLoading = false) => {
    try {
      if (!skipLoading) {
        setLoading(true)
      }
      
      // Add timeout to prevent infinite loading
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 10000)
      )
      
      const { data: { user: authUser } } = await Promise.race([
        supabase.auth.getUser(),
        timeout
      ]) as any
      
      if (authUser) {
        console.log('Auth user found:', authUser)
        
        // Try to get user profile from profiles table, but fallback to auth user if not found
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, try to create it
          console.log('Profile not found, creating new profile...')
          
          const newProfile = {
            id: authUser.id,
            full_name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: 'owner'
          }

          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single()

          if (insertError) {
            console.error('Failed to create profile:', insertError)
            // Use fallback with compatibility fields
            const fallbackUser = {
              ...newProfile,
              name: newProfile.full_name,
              email: authUser.email || ''
            }
            setUser(fallbackUser)
          } else {
            console.log('✅ Profile created successfully!')
            // Add compatibility fields
            const userWithCompat = {
              ...createdProfile,
              name: createdProfile.full_name,
              email: authUser.email || ''
            }
            setUser(userWithCompat)
          }
        } else if (error) {
          console.log('Profile table error (using auth user data):', error)
          // Use auth user data as fallback
          const fallbackUser = {
            id: authUser.id,
            full_name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: 'owner',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || ''
          }
          console.log('Using fallback user:', fallbackUser)
          setUser(fallbackUser)
        } else {
          console.log('Profile found:', profile)
          // Add compatibility fields for existing profile
          const userWithCompat = {
            ...profile,
            name: profile.full_name,
            email: authUser.email || ''
          }
          setUser(userWithCompat)
        }
      } else {
        console.log('No auth user found')
        setUser(null)
      }
    } catch (error) {
      console.error('Error in getProfile:', error)
      setUser(null)
    } finally {
      setLoading(false)
      setInitialLoadComplete(true)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('Attempting to sign in with:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Supabase signIn response:', { data, error })

      if (error) {
        console.error('SignIn error:', error)
        return { error: error.message }
      }

      console.log('SignIn successful, session:', data.session)
      return {}
    } catch (error) {
      console.error('SignIn exception:', error)
      return { error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      // If user was created successfully, try to create their profile
      if (data.user) {
        console.log('User created, attempting to create profile:', data.user.id)
        
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: data.user.email || email,
                name: name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                gym_id: null
              }
            ])

          if (profileError) {
            console.log('Profile creation error (continuing anyway):', profileError)
            // Don't fail the signup if profile creation fails
          } else {
            console.log('Profile created successfully')
          }
        } catch (profileException) {
          console.log('Profile creation exception (continuing anyway):', profileException)
          // Don't fail the signup if profile creation fails
        }

        if (!data.session) {
          // User created but needs email verification
          return { requiresVerification: true }
        }
      }

      // User created and logged in immediately
      return {}
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      // Clear all gym-related localStorage data to prevent cross-gym data leakage
      localStorage.removeItem('current_gym_id')
      localStorage.removeItem('gym_name')
      localStorage.removeItem('gym_data')
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
    } catch (error) {
      console.error('Error in signOut:', error)
    } finally {
      setUser(null)
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}