/**
 * 🏋️ Workout Plans Data Hooks
 * Custom React Query hooks for workout plan management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// ==========================================
// 📊 QUERY KEYS
// ==========================================
export const workoutKeys = {
  all: ['workouts'] as const,
  templates: (gymId: string | null) => [...workoutKeys.all, 'templates', gymId] as const,
  template: (id: string) => [...workoutKeys.all, 'template', id] as const,
  exercises: (templateId: string) => [...workoutKeys.all, 'exercises', templateId] as const,
  memberPlans: (gymId: string | null) => [...workoutKeys.all, 'memberPlans', gymId] as const,
  memberPlan: (id: string) => [...workoutKeys.all, 'memberPlan', id] as const,
  memberPlansByMember: (memberId: string) => [...workoutKeys.all, 'memberPlans', 'member', memberId] as const,
  logs: (gymId: string | null) => [...workoutKeys.all, 'logs', gymId] as const,
  exerciseLibrary: ['exerciseLibrary'] as const,
}

// ==========================================
// 🎯 WORKOUT PLAN TEMPLATES
// ==========================================

export function useWorkoutTemplates(gymId: string | null) {
  return useQuery({
    queryKey: workoutKeys.templates(gymId),
    queryFn: async () => {
      if (!gymId) return []
      
      const { data, error } = await supabase
        .from('workout_plan_templates')
        .select('*')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!gymId,
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when user returns to the page
    refetchOnMount: 'always', // Always refetch when component mounts (navigation)
  })
}

export function useWorkoutTemplate(id: string | null) {
  return useQuery({
    queryKey: workoutKeys.template(id || ''),
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('workout_plan_templates')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// ==========================================
// 💪 WORKOUT EXERCISES
// ==========================================

export function useWorkoutExercises(templateId: string | null) {
  return useQuery({
    queryKey: workoutKeys.exercises(templateId || ''),
    queryFn: async () => {
      if (!templateId) return []
      
      const { data, error } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('template_id', templateId)
        .order('day_number', { ascending: true })
        .order('order_index', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: !!templateId,
  })
}

// ==========================================
// 👤 MEMBER WORKOUT PLANS
// ==========================================

export function useMemberWorkoutPlans(gymId: string | null) {
  return useQuery({
    queryKey: workoutKeys.memberPlans(gymId),
    queryFn: async () => {
      if (!gymId) return []
      
      const { data, error } = await supabase
        .from('member_workout_plans')
        .select(`
          *,
          members (
            first_name,
            last_name,
            email,
            phone,
            photo_url
          )
        `)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!gymId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

export function useMemberPlansByMember(memberId: string | null) {
  return useQuery({
    queryKey: workoutKeys.memberPlansByMember(memberId || ''),
    queryFn: async () => {
      if (!memberId) return []
      
      const { data, error } = await supabase
        .from('member_workout_plans')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!memberId,
  })
}

// ==========================================
// 📚 EXERCISE LIBRARY
// ==========================================

export function useExerciseLibrary() {
  return useQuery({
    queryKey: workoutKeys.exerciseLibrary,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .order('is_popular', { ascending: false })
        .order('name', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (library changes rarely)
  })
}

// ==========================================
// 🔄 MUTATION HOOKS
// ==========================================

export function useCreateWorkoutTemplate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (template: any) => {
      const { data, error } = await supabase
        .from('workout_plan_templates')
        .insert(template)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.templates(data.gym_id) })
    },
  })
}

export function useUpdateWorkoutTemplate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any; gym_id?: string }) => {
      const { data, error } = await supabase
        .from('workout_plan_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onMutate: async ({ id, updates, gym_id }) => {
      // Only do optimistic updates if gym_id is provided
      if (!gym_id) return {}
      
      // Cancel any outgoing refetches to avoid optimistic update being overwritten
      await queryClient.cancelQueries({ queryKey: workoutKeys.templates(gym_id) })
      await queryClient.cancelQueries({ queryKey: workoutKeys.template(id) })
      
      // Snapshot the previous values
      const previousTemplates = queryClient.getQueryData(workoutKeys.templates(gym_id))
      const previousTemplate = queryClient.getQueryData(workoutKeys.template(id))
      
      // Optimistically update the cache for instant UI feedback
      queryClient.setQueryData(workoutKeys.templates(gym_id), (old: any) => {
        if (!old) return old
        return old.map((template: any) => 
          template.id === id ? { ...template, ...updates } : template
        )
      })
      
      queryClient.setQueryData(workoutKeys.template(id), (old: any) => {
        if (!old) return old
        return { ...old, ...updates }
      })
      
      // Return context with previous values for rollback
      return { previousTemplates, previousTemplate, gym_id, id }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTemplates && context?.gym_id) {
        queryClient.setQueryData(workoutKeys.templates(context.gym_id), context.previousTemplates)
      }
      if (context?.previousTemplate && context?.id) {
        queryClient.setQueryData(workoutKeys.template(context.id), context.previousTemplate)
      }
    },
    onSuccess: (data) => {
      // Update cache with server response to ensure consistency
      queryClient.setQueryData(workoutKeys.template(data.id), data)
      queryClient.setQueryData(workoutKeys.templates(data.gym_id), (old: any) => {
        if (!old) return [data]
        return old.map((template: any) => 
          template.id === data.id ? data : template
        )
      })
    },
    onSettled: async (data, error, variables) => {
      // Always refetch to ensure we have latest server data
      if (data) {
        await queryClient.invalidateQueries({ 
          queryKey: workoutKeys.templates(data.gym_id),
          refetchType: 'all'
        })
        await queryClient.invalidateQueries({ 
          queryKey: ['workoutAnalytics', data.gym_id],
          refetchType: 'all'
        })
      }
    },
  })
}

export function useDeleteWorkoutTemplate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, gymId }: { id: string; gymId: string }) => {
      const { error } = await supabase
        .from('workout_plan_templates')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, gymId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.templates(data.gymId) })
    },
  })
}

export function useAssignWorkoutToMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (assignment: any) => {
      const { data, error } = await supabase
        .from('member_workout_plans')
        .insert(assignment)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.memberPlans(data.gym_id) })
      queryClient.invalidateQueries({ queryKey: workoutKeys.memberPlansByMember(data.member_id) })
    },
  })
}

// ==========================================
// 📈 ANALYTICS HOOKS
// ==========================================

export function useWorkoutAnalytics(gymId: string | null) {
  return useQuery({
    queryKey: ['workoutAnalytics', gymId],
    queryFn: async () => {
      if (!gymId) return null
      
      // Fetch all relevant data for analytics
      const [templatesResult, plansResult, logsResult] = await Promise.all([
        supabase.from('workout_plan_templates').select('*').eq('gym_id', gymId),
        supabase.from('member_workout_plans').select('*').eq('gym_id', gymId),
        supabase.from('workout_logs').select('*').eq('gym_id', gymId),
      ])
      
      const templates = templatesResult.data || []
      const plans = plansResult.data || []
      const logs = logsResult.data || []
      
      // Calculate analytics
      const totalTemplates = templates.length
      const activeTemplates = templates.filter(t => t.is_active).length
      const totalAssignments = plans.length
      const activePlans = plans.filter(p => p.status === 'Active').length
      const completedPlans = plans.filter(p => p.status === 'Completed').length
      const avgCompletionRate = plans.length > 0 
        ? plans.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / plans.length 
        : 0
      
      // Most popular templates
      const popularTemplates = templates
        .sort((a, b) => (b.times_assigned || 0) - (a.times_assigned || 0))
        .slice(0, 5)
      
      // Recent activity
      const recentLogs = logs
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
      
      return {
        totalTemplates,
        activeTemplates,
        totalAssignments,
        activePlans,
        completedPlans,
        avgCompletionRate: avgCompletionRate.toFixed(1),
        popularTemplates,
        recentLogs,
        engagementRate: activePlans > 0 ? ((activePlans / totalAssignments) * 100).toFixed(1) : '0',
      }
    },
    enabled: !!gymId,
    staleTime: 0, // Always consider data stale for real-time updates
    refetchOnWindowFocus: true,
  })
}
