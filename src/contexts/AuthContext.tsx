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
  
  // Track previous user ID to detect real sign-in vs focus-triggered refresh
  const prevUserIdRef = React.useRef<string | null>(null)

  useEffect(() => {
    let mounted = true
    let initTimeoutId: NodeJS.Timeout
    let sessionTimeoutId: NodeJS.Timeout
    
    // Get initial session without showing loading if we already have a user
    const initializeAuth = async () => {
      try {
        // Set a HARD timeout to prevent infinite loading - this WILL fire
        initTimeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('⚠️ Auth initialization HARD timeout (5s) - forcing clear')
            setLoading(false)
            setInitialLoadComplete(true)
            setUser(null)
          }
        }, 5000) // Reduced to 5 seconds for faster recovery
        
        // Wrap getSession in a race condition
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) => {
          sessionTimeoutId = setTimeout(() => reject(new Error('Session timeout')), 3000)
        })
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
        
        clearTimeout(sessionTimeoutId)
        
        if (session?.user && mounted) {
          prevUserIdRef.current = session.user.id
          await getProfile(true) // Skip loading spinner for initial check
        } else if (mounted) {
          setLoading(false)
        }
        
        if (mounted) {
          setInitialLoadComplete(true)
          clearTimeout(initTimeoutId)
        }
      } catch (error: any) {
        console.error('Error initializing auth:', error?.message || error)
        if (mounted) {
          setLoading(false)
          setInitialLoadComplete(true)
          setUser(null)
          clearTimeout(initTimeoutId)
          clearTimeout(sessionTimeoutId)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes (single subscription only)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      const currentUserId = session?.user?.id ?? null
      
      // Log significant events (optional - helps debugging)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        console.log('Auth state changed:', event, !!session)
      }
      
      // Ignore token refreshes and user updates - don't trigger loading
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
        prevUserIdRef.current = currentUserId
        return
      }
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
        prevUserIdRef.current = null
        return
      }
      
      // ONLY treat as real sign-in when moving from "no user" to "some user"
      // This prevents focus-triggered SIGNED_IN events from showing loading spinner
      if (event === 'SIGNED_IN' && currentUserId && !prevUserIdRef.current) {
        // Real sign-in → fetch profile and show loading
        setLoading(true)
        try {
          await getProfile(false)
        } finally {
          setLoading(false)
        }
      }
      
      // Update tracked user ID
      prevUserIdRef.current = currentUserId
    })

    // ⚠️ REMOVED: Focus/visibility handlers
    // We no longer call getSession() from AuthContext on focus
    // Supabase automatically refreshes tokens, and data rehydration 
    // is handled by useFocusRehydration hook in one place

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (initTimeoutId) clearTimeout(initTimeoutId)
      if (sessionTimeoutId) clearTimeout(sessionTimeoutId)
    }
  }, [])

  const getProfile = async (skipLoading = false) => {
    try {
      if (!skipLoading) {
        setLoading(true)
      }
      
      // Simple auth check with timeout
      const authPromise = supabase.auth.getUser()
      const timeout = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('getUser timeout')), 4000)
      )
      
      const result = await Promise.race([authPromise, timeout])
      const authUser = result.data.user
      const authError = result.error
      
      // Handle auth errors gracefully
      if (authError) {
        console.log('⚠️ Auth error (treating as not logged in):', authError.message)
        setUser(null)
        return
      }
      
      if (authUser) {
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
            // Add compatibility fields
            const userWithCompat = {
              ...createdProfile,
              name: createdProfile.full_name,
              email: authUser.email || ''
            }
            setUser(userWithCompat)
          }
        } else if (error) {
          // Use auth user data as fallback
          const fallbackUser = {
            id: authUser.id,
            full_name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: 'owner',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || ''
          }
          setUser(fallbackUser)
        } else {
          // Add compatibility fields for existing profile
          const userWithCompat = {
            ...profile,
            name: profile.full_name,
            email: authUser.email || ''
          }
          setUser(userWithCompat)
        }
      } else {
        setUser(null)
      }
    } catch (error: any) {
      console.error('Error in getProfile:', error?.message || error)
      if (error?.message === 'Auth request timeout') {
        console.warn('⚠️ Authentication timed out - treating as not logged in')
      }
      setUser(null)
    } finally {
      setLoading(false)
      setInitialLoadComplete(true)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('SignIn error:', error)
        return { error: error.message }
      }

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