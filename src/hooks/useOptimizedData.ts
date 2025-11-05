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
      
      const { data, error } = await supabase
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

      if (error) throw error
      
      // Calculate total paid for each member in parallel
      const membersWithPayments = await Promise.all(
        (data || []).map(async (member) => {
          const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount')
            .eq('member_id', member.id)
            .eq('gym_id', gymId)
          
          if (paymentsError) {
            console.error(`❌ Error fetching payments for ${member.custom_fields?.full_name}:`, paymentsError)
          }
          
          const totalPaid = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
          
          return {
            ...member,
            membership_plans: Array.isArray(member.membership_plans)
              ? member.membership_plans[0]
              : member.membership_plans,
            total_paid: totalPaid,
          }
        })
      )
      
      return membersWithPayments
    },
    enabled: !!gymId,
    staleTime: 0, // Always fetch fresh data to ensure payments are up-to-date
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes when not in use (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component mounts
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
    refetchOnWindowFocus: false, // Don't refetch when switching tabs - plans are static
    refetchOnMount: false, // Use cached data on mount
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
 * Hook to rehydrate all queries on focus/visibility
 * Ensures data is fresh when user returns to tab
 * Only refetches queries where prerequisites (gymId) exist
 */
export function useFocusRehydration(gymId: string | null) {
  const queryClient = useQueryClient()
  
  React.useEffect(() => {
    const handleRehydrate = async () => {
      // Always refresh auth session first
      await supabase.auth.getSession()
      
      // Only refetch queries if gymId is available
      if (!gymId) {
        console.log('⏭️ Skip focus rehydration - no gymId yet')
        return
      }
      
      // Refetch all queries with valid prerequisites
      await Promise.allSettled([
        queryClient.refetchQueries({ queryKey: ['members', gymId] }),
        queryClient.refetchQueries({ queryKey: ['staff', gymId] }),
        queryClient.refetchQueries({ queryKey: ['equipment', gymId] }),
        queryClient.refetchQueries({ queryKey: ['payments', gymId] }),
        queryClient.refetchQueries({ queryKey: ['expenses', gymId] }), // Only runs if gymId exists
      ])
    }
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleRehydrate()
      }
    }
    
    window.addEventListener('focus', handleRehydrate)
    document.addEventListener('visibilitychange', handleVisibility)
    
    return () => {
      window.removeEventListener('focus', handleRehydrate)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [gymId, queryClient])
}
