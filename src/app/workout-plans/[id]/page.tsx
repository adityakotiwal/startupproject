'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/contexts/GymContext'
import { 
  useWorkoutTemplate, 
  useWorkoutExercises, 
  useUpdateWorkoutTemplate,
  useDeleteWorkoutTemplate 
} from '@/hooks/useWorkoutPlans'
import ProtectedPage from '@/components/ProtectedPage'
import { 
  Dumbbell, Plus, ArrowLeft, Edit, Trash2, Save, X,
  Calendar, Target, Activity, Clock, Zap, Users,
  ChevronDown, ChevronUp, MoreVertical, Copy, CheckCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'

export default function WorkoutPlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { currentGym, gymId } = useGymContext()
  const templateId = params.id as string
  
  const { data: template, isPending: loadingTemplate, refetch: refetchTemplate } = useWorkoutTemplate(templateId)
  const { data: exercises = [], isPending: loadingExercises, refetch: refetchExercises } = useWorkoutExercises(templateId)
  const updateTemplate = useUpdateWorkoutTemplate()
  const deleteTemplate = useDeleteWorkoutTemplate()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    duration_weeks: 4,
    difficulty_level: 'Intermediate',
    category: '',
  })
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [expandedDays, setExpandedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7])
  const [exerciseForm, setExerciseForm] = useState({
    day_number: 1,
    exercise_name: '',
    exercise_type: 'Strength',
    target_muscle_group: '',
    sets: 3,
    reps: '10-12',
    duration_minutes: 0,
    rest_seconds: 60,
    weight_recommendation: '',
    instructions: '',
    video_url: '',
    order_index: 0,
  })
  const [isCreatingExercise, setIsCreatingExercise] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)

  // Load template data into edit form
  useEffect(() => {
    if (template) {
      setEditForm({
        name: template.name,
        description: template.description || '',
        duration_weeks: template.duration_weeks,
        difficulty_level: template.difficulty_level,
        category: template.category || '',
      })
    }
  }, [template])

  // Group exercises by day
  const exercisesByDay = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.day_number]) {
      acc[exercise.day_number] = []
    }
    acc[exercise.day_number].push(exercise)
    return acc
  }, {} as Record<number, any[]>)

  const toggleDay = (day: number) => {
    setExpandedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleUpdateTemplate = async () => {
    if (!templateId || !gymId) return
    
    try {
      // Update the template (optimistic update happens in the mutation)
      await updateTemplate.mutateAsync({
        id: templateId,
        updates: editForm,
        gym_id: gymId, // Pass gym_id for optimistic update
      })
      
      // Force Next.js to refresh server-side data
      router.refresh()
      
      setIsEditing(false)
      alert('✅ Workout plan updated successfully!')
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Failed to update workout plan')
    }
  }

  const handleDeleteTemplate = async () => {
    if (!templateId || !gymId) return
    if (!confirm('Are you sure you want to delete this workout plan? This action cannot be undone.')) return
    
    try {
      await deleteTemplate.mutateAsync({ id: templateId, gymId })
      
      // Invalidate queries before navigating
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workoutTemplates', gymId] }),
        queryClient.invalidateQueries({ queryKey: ['workoutAnalytics', gymId] })
      ])
      
      alert('✅ Workout plan deleted successfully!')
      router.push('/workout-plans')
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete workout plan')
    }
  }

  const handleAddExercise = async () => {
    if (!templateId || !gymId || !exerciseForm.exercise_name.trim()) {
      alert('Please provide exercise name')
      return
    }
    
    setIsCreatingExercise(true)
    try {
      const { error } = await supabase
        .from('workout_exercises')
        .insert({
          template_id: templateId,
          gym_id: gymId,
          ...exerciseForm,
        })
      
      if (error) throw error
      
      // Reset form and close modal
      setExerciseForm({
        day_number: selectedDay || 1,
        exercise_name: '',
        exercise_type: 'Strength',
        target_muscle_group: '',
        sets: 3,
        reps: '10-12',
        duration_minutes: 0,
        rest_seconds: 60,
        weight_recommendation: '',
        instructions: '',
        video_url: '',
        order_index: 0,
      })
      setShowAddExercise(false)
      refetchExercises()
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('Failed to add exercise')
    } finally {
      setIsCreatingExercise(false)
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Delete this exercise?')) return
    
    try {
      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', exerciseId)
      
      if (error) throw error
      refetchExercises()
    } catch (error) {
      console.error('Error deleting exercise:', error)
      alert('Failed to delete exercise')
    }
  }

  const handleDuplicateTemplate = async () => {
    if (!template || !gymId) return
    
    try {
      // Create duplicate template
      const { data: newTemplate, error: templateError } = await supabase
        .from('workout_plan_templates')
        .insert({
          gym_id: gymId,
          name: `${template.name} (Copy)`,
          description: template.description,
          duration_weeks: template.duration_weeks,
          difficulty_level: template.difficulty_level,
          category: template.category,
          is_active: true,
          created_by: user?.id,
        })
        .select()
        .single()
      
      if (templateError) throw templateError
      
      // Duplicate all exercises
      if (exercises.length > 0) {
        const duplicatedExercises = exercises.map(ex => ({
          template_id: newTemplate.id,
          gym_id: gymId,
          day_number: ex.day_number,
          exercise_name: ex.exercise_name,
          exercise_type: ex.exercise_type,
          target_muscle_group: ex.target_muscle_group,
          sets: ex.sets,
          reps: ex.reps,
          duration_minutes: ex.duration_minutes,
          rest_seconds: ex.rest_seconds,
          weight_recommendation: ex.weight_recommendation,
          instructions: ex.instructions,
          video_url: ex.video_url,
          order_index: ex.order_index,
        }))
        
        const { error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(duplicatedExercises)
        
        if (exercisesError) throw exercisesError
      }
      
      // Invalidate queries to update the main page
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workoutTemplates', gymId] }),
        queryClient.invalidateQueries({ queryKey: ['workoutAnalytics', gymId] })
      ])
      
      alert('✅ Workout plan duplicated successfully!')
      router.push(`/workout-plans/${newTemplate.id}`)
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Failed to duplicate workout plan')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-50 border-green-200'
      case 'Intermediate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'Advanced': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getMuscleGroupColor = (muscle: string) => {
    const colors: Record<string, string> = {
      'Chest': 'bg-red-100 text-red-700',
      'Back': 'bg-blue-100 text-blue-700',
      'Legs': 'bg-green-100 text-green-700',
      'Shoulders': 'bg-yellow-100 text-yellow-700',
      'Arms': 'bg-purple-100 text-purple-700',
      'Core': 'bg-orange-100 text-orange-700',
      'Cardio': 'bg-pink-100 text-pink-700',
    }
    return colors[muscle] || 'bg-gray-100 text-gray-700'
  }

  if (loadingTemplate) {
    return (
      <ProtectedPage>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Loading workout plan...</p>
          </div>
        </div>
      </ProtectedPage>
    )
  }

  if (!template) {
    return (
      <ProtectedPage>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md w-full shadow-xl">
            <CardContent className="p-8 text-center">
              <Dumbbell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Workout Plan Not Found</h2>
              <p className="text-gray-600 mb-6">The workout plan you're looking for doesn't exist or has been deleted.</p>
              <Button 
                onClick={() => router.push('/workout-plans')} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Workout Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedPage>
    )
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => router.push('/workout-plans')}
            className="mb-6 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workout Plans
          </Button>

          {/* Header */}
          <div className="mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
              <CardContent className="p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    {/* Edit Mode Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-white border-opacity-30">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                          <Edit className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">Edit Workout Plan</h2>
                          <p className="text-blue-100 text-sm">Update your workout plan details below</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-blue-100">
                        <Activity className="h-4 w-4" />
                        <span>{template?.times_assigned || 0} members using this plan</span>
                      </div>
                    </div>

                    {/* Plan Name */}
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Plan Name <span className="text-yellow-300 ml-1">*</span>
                      </label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="text-xl font-bold bg-white text-gray-900 border-2 border-blue-300 focus:border-blue-400 placeholder-gray-400"
                        placeholder="e.g., Beginner Full Body Workout"
                      />
                      <p className="text-blue-100 text-xs mt-1">Give your plan a clear, descriptive name</p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-blue-300 focus:border-blue-400 rounded-lg placeholder-gray-400 resize-none"
                        rows={4}
                        placeholder="Describe the goals, target audience, and what makes this plan effective..."
                      />
                      <p className="text-blue-100 text-xs mt-1">Help members understand what this plan is about</p>
                    </div>

                    {/* Plan Configuration Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Duration */}
                      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
                        <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Duration (Weeks)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="52"
                          value={editForm.duration_weeks}
                          onChange={(e) => setEditForm({ ...editForm, duration_weeks: parseInt(e.target.value) || 1 })}
                          className="bg-white text-gray-900 border-2 border-blue-300 focus:border-blue-400 text-lg font-bold"
                        />
                        <p className="text-blue-100 text-xs mt-1">How long is this program?</p>
                      </div>

                      {/* Difficulty */}
                      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
                        <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                          <Zap className="h-4 w-4 mr-2" />
                          Difficulty Level
                        </label>
                        <select
                          value={editForm.difficulty_level}
                          onChange={(e) => setEditForm({ ...editForm, difficulty_level: e.target.value })}
                          className="w-full px-3 py-2 bg-white text-gray-900 border-2 border-blue-300 focus:border-blue-400 rounded-lg text-lg font-bold"
                        >
                          <option value="Beginner">🟢 Beginner</option>
                          <option value="Intermediate">🟡 Intermediate</option>
                          <option value="Advanced">🔴 Advanced</option>
                        </select>
                        <p className="text-blue-100 text-xs mt-1">Who is this plan for?</p>
                      </div>

                      {/* Category */}
                      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
                        <label className="block text-white text-sm font-semibold mb-2 flex items-center">
                          <Dumbbell className="h-4 w-4 mr-2" />
                          Category
                        </label>
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="w-full px-3 py-2 bg-white text-gray-900 border-2 border-blue-300 focus:border-blue-400 rounded-lg text-lg font-bold"
                        >
                          <option value="">Select Category</option>
                          <option value="Strength">💪 Strength</option>
                          <option value="Cardio">🏃 Cardio</option>
                          <option value="Hypertrophy">🦾 Hypertrophy</option>
                          <option value="Fat Loss">🔥 Fat Loss</option>
                          <option value="Endurance">⚡ Endurance</option>
                          <option value="Flexibility">🧘 Flexibility</option>
                          <option value="CrossFit">🏋️ CrossFit</option>
                          <option value="Powerlifting">💥 Powerlifting</option>
                          <option value="Bodybuilding">🏆 Bodybuilding</option>
                        </select>
                        <p className="text-blue-100 text-xs mt-1">Main focus area</p>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-500 bg-opacity-20 backdrop-blur-sm border border-blue-300 border-opacity-30 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-blue-200 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-white">
                          <p className="font-semibold mb-1">💡 Pro Tip</p>
                          <p className="text-blue-100">Changes will be reflected for all {template?.times_assigned || 0} members currently using this plan. Make sure your updates are accurate!</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-2">
                      <Button 
                        onClick={handleUpdateTemplate} 
                        className="flex-1 bg-green-500 text-white hover:bg-green-600 shadow-xl font-bold text-lg py-6 border-2 border-green-400"
                      >
                        <Save className="h-5 w-5 mr-2" />
                        Save Changes
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsEditing(false)
                          // Reset form to original values
                          if (template) {
                            setEditForm({
                              name: template.name,
                              description: template.description || '',
                              duration_weeks: template.duration_weeks,
                              difficulty_level: template.difficulty_level,
                              category: template.category || '',
                            })
                          }
                        }} 
                        className="bg-gray-600 text-white hover:bg-gray-700 shadow-xl font-bold text-lg py-6 border-2 border-gray-500"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{template.name}</h1>
                        <p className="text-blue-100 mb-4">{template.description || 'No description provided'}</p>
                        <div className="flex flex-wrap gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(template.difficulty_level)}`}>
                            {template.difficulty_level}
                          </span>
                          {template.category && (
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white bg-opacity-20 border border-white border-opacity-30">
                              {template.category}
                            </span>
                          )}
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white bg-opacity-20 border border-white border-opacity-30 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {template.duration_weeks} weeks
                          </span>
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white bg-opacity-20 border border-white border-opacity-30 flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {template.times_assigned || 0} assigned
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={() => setIsEditing(true)} 
                          className="bg-blue-500 text-white hover:bg-blue-600 shadow-lg font-semibold border-2 border-blue-400"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Plan
                        </Button>
                        <Button 
                          onClick={handleDuplicateTemplate} 
                          className="bg-purple-500 hover:bg-purple-600 text-white shadow-lg font-semibold border-2 border-purple-400"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button 
                          onClick={handleDeleteTemplate} 
                          className="bg-red-500 hover:bg-red-600 text-white shadow-lg font-semibold border-2 border-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Days and Exercises */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Activity className="h-6 w-6 mr-2 text-blue-600" />
                Weekly Schedule
              </h2>
              <Button
                onClick={() => {
                  setSelectedDay(1)
                  setExerciseForm({ ...exerciseForm, day_number: 1 })
                  setShowAddExercise(true)
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>

            {[1, 2, 3, 4, 5, 6, 7].map(day => {
              const dayExercises = exercisesByDay[day] || []
              const isExpanded = expandedDays.includes(day)
              const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              
              return (
                <Card key={day} className="border-0 shadow-lg overflow-hidden">
                  <div
                    onClick={() => toggleDay(day)}
                    className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 cursor-pointer hover:from-gray-100 hover:to-blue-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        {day}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{dayNames[day - 1]}</h3>
                        <p className="text-sm text-gray-600">
                          {dayExercises.length} {dayExercises.length === 1 ? 'exercise' : 'exercises'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDay(day)
                          setExerciseForm({ ...exerciseForm, day_number: day })
                          setShowAddExercise(true)
                        }}
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent className="p-6">
                          {dayExercises.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                              <p>No exercises for this day</p>
                              <Button
                                onClick={() => {
                                  setSelectedDay(day)
                                  setExerciseForm({ ...exerciseForm, day_number: day })
                                  setShowAddExercise(true)
                                }}
                                size="sm"
                                className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Exercise
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {dayExercises.map((exercise: any, idx: number) => (
                                <Card key={exercise.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                          <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                                            {idx + 1}
                                          </span>
                                          <h4 className="text-lg font-bold text-gray-900">{exercise.exercise_name}</h4>
                                          {exercise.target_muscle_group && (
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getMuscleGroupColor(exercise.target_muscle_group)}`}>
                                              {exercise.target_muscle_group}
                                            </span>
                                          )}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                                          {exercise.sets && (
                                            <div className="flex items-center text-gray-700">
                                              <Target className="h-4 w-4 mr-1 text-blue-600" />
                                              <span className="font-semibold">{exercise.sets}</span> sets
                                            </div>
                                          )}
                                          {exercise.reps && (
                                            <div className="flex items-center text-gray-700">
                                              <Zap className="h-4 w-4 mr-1 text-purple-600" />
                                              <span className="font-semibold">{exercise.reps}</span> reps
                                            </div>
                                          )}
                                          {exercise.rest_seconds && (
                                            <div className="flex items-center text-gray-700">
                                              <Clock className="h-4 w-4 mr-1 text-orange-600" />
                                              <span className="font-semibold">{exercise.rest_seconds}s</span> rest
                                            </div>
                                          )}
                                          {exercise.weight_recommendation && (
                                            <div className="flex items-center text-gray-700">
                                              <Dumbbell className="h-4 w-4 mr-1 text-green-600" />
                                              <span className="font-semibold">{exercise.weight_recommendation}</span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {exercise.instructions && (
                                          <p className="text-sm text-gray-600 mb-2">{exercise.instructions}</p>
                                        )}
                                        
                                        {exercise.video_url && (
                                          <a
                                            href={exercise.video_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline"
                                          >
                                            📹 Watch tutorial video
                                          </a>
                                        )}
                                      </div>
                                      
                                      <Button
                                        onClick={() => handleDeleteExercise(exercise.id)}
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )
            })}
          </div>
        </main>

        {/* Add Exercise Modal */}
        <AnimatePresence>
          {showAddExercise && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isCreatingExercise && setShowAddExercise(false)}
                className="fixed inset-0 bg-black bg-opacity-50 z-50"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                          <Dumbbell className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Add Exercise</h3>
                          <p className="text-blue-100 text-sm">Day {exerciseForm.day_number}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => !isCreatingExercise && setShowAddExercise(false)}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                        disabled={isCreatingExercise}
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-6">
                    {/* Day Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Day <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={exerciseForm.day_number}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, day_number: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isCreatingExercise}
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map(day => (
                          <option key={day} value={day}>Day {day} - {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day - 1]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Exercise Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Exercise Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={exerciseForm.exercise_name}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, exercise_name: e.target.value })}
                        placeholder="e.g., Barbell Bench Press"
                        disabled={isCreatingExercise}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Exercise Type */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Exercise Type</label>
                        <select
                          value={exerciseForm.exercise_type}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, exercise_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isCreatingExercise}
                        >
                          <option value="Strength">Strength</option>
                          <option value="Cardio">Cardio</option>
                          <option value="Flexibility">Flexibility</option>
                          <option value="Plyometric">Plyometric</option>
                          <option value="Olympic">Olympic</option>
                        </select>
                      </div>

                      {/* Target Muscle */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Target Muscle Group</label>
                        <select
                          value={exerciseForm.target_muscle_group}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, target_muscle_group: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isCreatingExercise}
                        >
                          <option value="">Select muscle group</option>
                          <option value="Chest">Chest</option>
                          <option value="Back">Back</option>
                          <option value="Legs">Legs</option>
                          <option value="Shoulders">Shoulders</option>
                          <option value="Arms">Arms</option>
                          <option value="Core">Core</option>
                          <option value="Cardio">Cardio</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Sets */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sets</label>
                        <Input
                          type="number"
                          min="0"
                          value={exerciseForm.sets}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, sets: parseInt(e.target.value) || 0 })}
                          disabled={isCreatingExercise}
                        />
                      </div>

                      {/* Reps */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Reps</label>
                        <Input
                          value={exerciseForm.reps}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                          placeholder="8-12"
                          disabled={isCreatingExercise}
                        />
                      </div>

                      {/* Rest */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rest (sec)</label>
                        <Input
                          type="number"
                          min="0"
                          value={exerciseForm.rest_seconds}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, rest_seconds: parseInt(e.target.value) || 0 })}
                          disabled={isCreatingExercise}
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (min)</label>
                        <Input
                          type="number"
                          min="0"
                          value={exerciseForm.duration_minutes}
                          onChange={(e) => setExerciseForm({ ...exerciseForm, duration_minutes: parseInt(e.target.value) || 0 })}
                          disabled={isCreatingExercise}
                        />
                      </div>
                    </div>

                    {/* Weight Recommendation */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Weight Recommendation</label>
                      <Input
                        value={exerciseForm.weight_recommendation}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, weight_recommendation: e.target.value })}
                        placeholder="e.g., 50kg, Bodyweight, 50% 1RM"
                        disabled={isCreatingExercise}
                      />
                    </div>

                    {/* Instructions */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions</label>
                      <textarea
                        value={exerciseForm.instructions}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Detailed form cues and tips..."
                        disabled={isCreatingExercise}
                      />
                    </div>

                    {/* Video URL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Video Tutorial URL (optional)</label>
                      <Input
                        value={exerciseForm.video_url}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, video_url: e.target.value })}
                        placeholder="https://youtube.com/..."
                        disabled={isCreatingExercise}
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddExercise(false)}
                      disabled={isCreatingExercise}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddExercise}
                      disabled={isCreatingExercise || !exerciseForm.exercise_name.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      {isCreatingExercise ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Exercise
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </ProtectedPage>
  )
}
