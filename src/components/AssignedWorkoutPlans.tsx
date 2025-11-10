'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Calendar, Target, TrendingUp, Loader } from 'lucide-react'
import Link from 'next/link'

interface WorkoutPlan {
  id: string
  plan_name: string
  start_date: string
  end_date: string
  status: string
  completion_percentage: number
  template_id: string
  workout_plan_templates?: {
    name: string
    difficulty_level: string
    category: string
  }
}

interface AssignedWorkoutPlansProps {
  memberId: string
}

export default function AssignedWorkoutPlans({ memberId }: AssignedWorkoutPlansProps) {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkoutPlans()
  }, [memberId])

  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('member_workout_plans')
        .select(`
          *,
          workout_plan_templates (
            name,
            difficulty_level,
            category
          )
        `)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWorkoutPlans(data || [])
    } catch (error) {
      console.error('Error fetching workout plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-50 text-green-700'
      case 'Intermediate':
        return 'bg-yellow-50 text-yellow-700'
      case 'Advanced':
        return 'bg-red-50 text-red-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Dumbbell className="h-5 w-5 mr-2 text-blue-600" />
          Workout Plans
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : workoutPlans.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No workout plans assigned</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workoutPlans.map((plan) => (
              <Link
                key={plan.id}
                href={`/workout-plans/${plan.template_id}`}
                className="block"
              >
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {plan.workout_plan_templates?.name || plan.plan_name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(plan.status)}>
                          {plan.status}
                        </Badge>
                        {plan.workout_plan_templates?.difficulty_level && (
                          <Badge className={getDifficultyColor(plan.workout_plan_templates.difficulty_level)}>
                            {plan.workout_plan_templates.difficulty_level}
                          </Badge>
                        )}
                        {plan.workout_plan_templates?.category && (
                          <Badge variant="outline" className="text-xs">
                            {plan.workout_plan_templates.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span className="flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        Progress
                      </span>
                      <span className="font-semibold">{plan.completion_percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${plan.completion_percentage || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(plan.start_date)}</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>Ends {formatDate(plan.end_date)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
