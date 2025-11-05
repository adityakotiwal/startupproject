import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { callApi } from '@/lib/apiClient'

// ==================== MEMBERS ====================

export function useMembers(gymId: string | null) {
  return useQuery({
    queryKey: ['members', gymId],
    queryFn: async () => {
      if (!gymId) return []
      
      // ⚡ OPTIMIZED: Fetch members and payment totals in 2 queries instead of N+1
      
      // 1) Fetch all members with their membership plans
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          *,
          membership_plans!plan_id (
            name,
            price,
            duration_days
          )
        `)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      if (membersError) throw membersError
      if (!members) return []
      
      // 2) Fetch all payment totals for this gym in ONE query using the view
      const { data: paymentTotals, error: totalsError } = await supabase
        .from('member_payment_totals')
        .select('member_id, total_amount, payment_count, last_payment_date')
        .eq('gym_id', gymId)
      
      if (totalsError) {
        console.warn('⚠️ Could not fetch payment totals (view may not exist yet):', totalsError.message)
        // Fallback: if view doesn't exist, return members without payment data
        // This ensures backward compatibility during migration
        return members.map(member => ({
          ...member,
          membership_plans: Array.isArray(member.membership_plans)
            ? member.membership_plans[0]
            : member.membership_plans,
          total_paid: 0, // Safe fallback
        }))
      }
      
      // 3) Create a lookup map for O(1) access
      const totalsByMemberId = new Map(
        (paymentTotals || []).map(t => [t.member_id, t])
      )
      
      // 4) Merge data in memory (fast!)
      return members.map(member => {
        const paymentData = totalsByMemberId.get(member.id)
        return {
          ...member,
          membership_plans: Array.isArray(member.membership_plans)
            ? member.membership_plans[0]
            : member.membership_plans,
          total_paid: paymentData?.total_amount ?? 0,
          payment_count: paymentData?.payment_count ?? 0,
          last_payment_date: paymentData?.last_payment_date ?? null,
        }
      })
    },
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000, // Fresh for 2 minutes (balance between freshness and performance)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes when not in use
    // Keep previous data visible during refetch (no zeros flicker)
    placeholderData: (previousData) => previousData,
  })
}

// ==================== STAFF ====================

export function useStaff(gymId: string | null) {
  return useQuery({
    queryKey: ['staff', gymId],
    queryFn: async () => {
      if (!gymId) return []
      
      const { data, error } = await supabase
        .from('staff_details')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      return data || []
    },
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000, // 5 minutes - staff changes less frequently
  })
}

// ==================== EQUIPMENT ====================

export function useEquipment(gymId: string | null) {
  return useQuery({
    queryKey: ['equipment', gymId],
    queryFn: async () => {
      if (!gymId) return []
      
      const { data, error} = await supabase
        .from('equipment')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      return data || []
    },
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  })
}

// ==================== EXPENSES ====================

/**
 * 🔒 NEW: Fetch expenses via path-based API
 * Route: /api/gyms/:gymId/expenses (gymId in path, not query param)
 * This makes it IMPOSSIBLE to call without gymId
 */
async function fetchExpenses(gymId: string) {
  const res = await callApi(`/api/gyms/${encodeURIComponent(gymId)}/expenses`)
  
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const error = new Error(body?.error || `Expenses API failed with ${res.status}`)
    console.error('❌ Expenses API error:', {
      status: res.status,
      gymId,
      error: body?.error,
      hint: body?.migration?.hint
    })
    throw error
  }
  
  const { expenses } = await res.json()
  return expenses as any[]
}

/**
 * Single source of truth for expenses fetching
 * 🔒 GATED: Will not run without gymId
 * 🔒 KEY INCLUDES GYM_ID: Prevents cross-gym cache pollution
 * 🔒 NEW PATH: Uses /api/gyms/:gymId/expenses (impossible to call without gymId)
 */
export function useExpenses(gymId?: string | null) {
  return useQuery({
    queryKey: ['expenses', gymId], // 🔒 Key includes gymId
    queryFn: () => {
      // 🔒 Runtime trap: Crash in dev if called without gymId
      if (!gymId) {
        const error = new Error('[useExpenses] Called without gymId — fix the caller')
        console.error('💥 useExpenses trap:', error.message)
        if (process.env.NODE_ENV === 'development') {
          throw error // Crash the caller with stack trace
        }
        throw error
      }
      
      console.log('📊 Fetching expenses via NEW API...', gymId)
      return fetchExpenses(gymId)
    },
    enabled: !!gymId, // 🔒 Only fetch when gymId exists
    staleTime: 3 * 60 * 1000,
    retry: 1, // Only retry once to avoid spam
  })
}

// ==================== PAYMENTS ====================

export function usePayments(gymId: string | null) {
  return useQuery({
    queryKey: ['payments', gymId],
    queryFn: async () => {
      if (!gymId) return []
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          members (
            custom_fields
          )
        `)
        .eq('gym_id', gymId)
        .order('payment_date', { ascending: false })

      if (error) throw error
      
      return data || []
    },
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000, // 2 minutes - payment data changes frequently
  })
}

// ==================== MEMBERSHIP PLANS ====================

export function useMembershipPlans(gymId: string | null) {
  return useQuery({
    queryKey: ['membershipPlans', gymId],
    queryFn: async () => {
      if (!gymId) return []
      
      console.log('📊 Fetching membership plans from API...')
      
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log(`✅ Fetched ${data?.length || 0} membership plans (cached)`)
      return data || []
    },
    enabled: !!gymId,
    staleTime: 10 * 60 * 1000, // 10 minutes - plans change infrequently
    // Let global config handle refetch behavior (refetchOnMount: true)
    // Using isPending in components prevents loading spinner during background refetch
  })
}

// ==================== PREFETCH FUNCTIONS ====================

export function usePrefetchData() {
  const queryClient = useQueryClient()
  
  return {
    prefetchMembers: async (gymId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['members', gymId],
        queryFn: async () => {
          console.log('🚀 Prefetching members...')
          const { data } = await supabase
            .from('members')
            .select(`*, membership_plans(name, price, duration_days)`)
            .eq('gym_id', gymId)
          return data || []
        },
      })
    },
    
    prefetchStaff: async (gymId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['staff', gymId],
        queryFn: async () => {
          console.log('🚀 Prefetching staff...')
          const { data } = await supabase
            .from('staff_details')
            .select('*')
            .eq('gym_id', gymId)
          return data || []
        },
      })
    },
    
    prefetchEquipment: async (gymId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['equipment', gymId],
        queryFn: async () => {
          console.log('🚀 Prefetching equipment...')
          const { data } = await supabase
            .from('equipment')
            .select('*')
            .eq('gym_id', gymId)
          return data || []
        },
      })
    },
    
    prefetchExpenses: async (gymId: string | null) => {
      // Gate: Don't call expenses until gymId exists
      if (!gymId) {
        console.warn('🛑 Skip expenses prefetch — missing gymId')
        return
      }
      
      try {
        console.log('🚀 Prefetching expenses via NEW API...', gymId)
        
        await queryClient.prefetchQuery({
          queryKey: ['expenses', gymId],
          queryFn: () => fetchExpenses(gymId), // Use the same API fetcher
        })
        
        console.log(`✅ Prefetched expenses via /api/gyms/${gymId}/expenses`)
      } catch (err: any) {
        console.error('🔴 prefetchExpenses failed:', err.message)
      }
    },
    
    prefetchPayments: async (gymId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['payments', gymId],
        queryFn: async () => {
          console.log('🚀 Prefetching payments...')
          const { data } = await supabase
            .from('payments')
            .select('*, members(custom_fields)')
            .eq('gym_id', gymId)
          return data || []
        },
      })
    },
  }
}

// ==================== INVALIDATION HELPERS ====================

export function useInvalidateQueries() {
  const queryClient = useQueryClient()
  
  return {
    invalidateMembers: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
    invalidateStaff: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
    invalidateEquipment: () => queryClient.invalidateQueries({ queryKey: ['equipment'] }),
    invalidateExpenses: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    invalidatePayments: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
    invalidateAll: () => queryClient.invalidateQueries(),
  }
}

// ==================== FOCUS REHYDRATION ====================

/**
 * Hook to rehydrate queries on focus/visibility - DEBOUNCED + MUTEX
 * 
 * What this fixes:
 * - Single session refresh (AuthContext no longer does this)
 * - Debounced to prevent flurries (350ms delay)
 * - Mutex prevents overlapping rehydrations
 * - Only refetches ACTIVE queries (keeps cached data visible)
 * - Respects staleTime (won't refetch if data is fresh)
 */
export function useFocusRehydration(gymId: string | null) {
  const queryClient = useQueryClient()
  const inFlightRef = React.useRef(false)
  const timeoutRef = React.useRef<number | null>(null)
  
  React.useEffect(() => {
    const rehydrate = async () => {
      // Mutex: prevent overlapping rehydrations
      if (inFlightRef.current) {
        console.log('🔒 Rehydration already in progress, skipping')
        return
      }
      
      inFlightRef.current = true
      
      try {
        console.log('🔄 Focus rehydration started')
        
        // Single session refresh (AuthContext no longer does this)
        await supabase.auth.getSession()
        
        // Only refetch if gymId exists
        if (!gymId) {
          console.log('⏭️ Skip focus rehydration - no gymId yet')
          return
        }
        
        // Only refetch ACTIVE queries; cached data stays visible
        // type: 'active' means only queries currently being used by mounted components
        await Promise.allSettled([
          queryClient.refetchQueries({ queryKey: ['members', gymId], type: 'active' }),
          queryClient.refetchQueries({ queryKey: ['staff', gymId], type: 'active' }),
          queryClient.refetchQueries({ queryKey: ['equipment', gymId], type: 'active' }),
          queryClient.refetchQueries({ queryKey: ['payments', gymId], type: 'active' }),
          queryClient.refetchQueries({ queryKey: ['expenses', gymId], type: 'active' }),
        ])
        
        console.log('✅ Focus rehydration complete')
      } catch (error) {
        console.error('❌ Focus rehydration failed:', error)
      } finally {
        inFlightRef.current = false
      }
    }
    
    // Debounce focus events to avoid flurries (350ms)
    const onFocus = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = window.setTimeout(() => {
        rehydrate()
      }, 350)
    }
    
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        onFocus()
      }
    }
    
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [queryClient, gymId])
}
