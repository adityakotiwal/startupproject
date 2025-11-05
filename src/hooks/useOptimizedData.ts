import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// ==================== MEMBERS ====================

export function useMembers(gymId: string | null) {
  return useQuery({
    queryKey: ['members', gymId],
    queryFn: async () => {
      if (!gymId) return []
      
      console.log('📊 Fetching members from API...')
      
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
          
          console.log(`💰 Member ${member.custom_fields?.full_name} (ID: ${member.id}): Payments count = ${payments?.length || 0}, Total Paid = ₹${totalPaid}`)
          
          return {
            ...member,
            membership_plans: Array.isArray(member.membership_plans)
              ? member.membership_plans[0]
              : member.membership_plans,
            total_paid: totalPaid,
          }
        })
      )
      
      console.log(`✅ Fetched ${membersWithPayments.length} members with payment data`)
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
      
      console.log('📊 Fetching staff from API...')
      
      const { data, error } = await supabase
        .from('staff_details')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log(`✅ Fetched ${data?.length || 0} staff (cached)`)
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
      
      console.log('📊 Fetching equipment from API...')
      
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log(`✅ Fetched ${data?.length || 0} equipment (cached)`)
      return data || []
    },
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  })
}

// ==================== EXPENSES ====================

export function useExpenses(gymId: string | null) {
  return useQuery({
    queryKey: ['expenses', gymId],
    queryFn: async () => {
      if (!gymId) return []
      
      console.log('📊 Fetching expenses from API...')
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('gym_id', gymId)
        .order('expense_date', { ascending: false })

      if (error) throw error
      
      console.log(`✅ Fetched ${data?.length || 0} expenses (cached)`)
      return data || []
    },
    enabled: !!gymId,
    staleTime: 3 * 60 * 1000,
  })
}

// ==================== PAYMENTS ====================

export function usePayments(gymId: string | null) {
  return useQuery({
    queryKey: ['payments', gymId],
    queryFn: async () => {
      if (!gymId) return []
      
      console.log('📊 Fetching payments from API...')
      
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
      
      console.log(`✅ Fetched ${data?.length || 0} payments (cached)`)
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
    
    prefetchExpenses: async (gymId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['expenses', gymId],
        queryFn: async () => {
          console.log('🚀 Prefetching expenses...')
          const { data } = await supabase
            .from('expenses')
            .select('*')
            .eq('gym_id', gymId)
          return data || []
        },
      })
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
