'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/contexts/GymContext'
import { useWorkoutTemplates, useWorkoutAnalytics, useCreateWorkoutTemplate } from '@/hooks/useWorkoutPlans'
import ProtectedPage from '@/components/ProtectedPage'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { 
  Dumbbell, Plus, Search, Filter, TrendingUp, Users, 
  Award, Target, Calendar, MoreVertical, Edit, Trash2, 
  Copy, Eye, Clock, Zap, ArrowUp, Activity, ChevronDown, CheckCircle,
  UserCheck, X, Pause, Play, BarChart3, Mail, Phone
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function WorkoutPlansPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { currentGym, gymId } = useGymContext()
  const { data: templates = [], isPending: loadingTemplates } = useWorkoutTemplates(gymId)
  const { data: analytics } = useWorkoutAnalytics(gymId)
  const createTemplate = useCreateWorkoutTemplate()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignTemplateId, setAssignTemplateId] = useState<string | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  
  // Assigned members view
  const [activeTab, setActiveTab] = useState<'templates' | 'assigned'>('templates')
  const [assignedPlans, setAssignedPlans] = useState<any[]>([])
  const [loadingAssigned, setLoadingAssigned] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  
  // Form states for creating workout plan
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_weeks: 4,
    difficulty_level: 'Intermediate',
    category: 'Strength',
  })
  const [isCreating, setIsCreating] = useState(false)
  
  // Fetch members when assign modal opens
  const fetchMembers = async () => {
    if (!gymId) return
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, custom_fields, status')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching members:', error)
        setMembers([])
        return
      }
      setMembers(data || [])
      console.log('Fetched members:', data?.length || 0)
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
    }
  }

  const handleOpenAssignModal = (templateId: string) => {
    setAssignTemplateId(templateId)
    setShowAssignModal(true)
    fetchMembers()
  }

  const handleAssignWorkout = async () => {
    if (!gymId || !assignTemplateId || !selectedMemberId) {
      alert('Please select a member')
      return
    }
    
    const template = templates.find(t => t.id === assignTemplateId)
    if (!template) return
    
    setAssignmentLoading(true)
    try {
      const { error } = await supabase
        .from('member_workout_plans')
        .insert({
          gym_id: gymId,
          member_id: selectedMemberId,
          template_id: assignTemplateId,
          plan_name: template.name,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + template.duration_weeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Active',
          completion_percentage: 0,
        })
      
      if (error) throw error
      
      // Update times_assigned count
      await supabase
        .from('workout_plan_templates')
        .update({ times_assigned: (template.times_assigned || 0) + 1 })
        .eq('id', assignTemplateId)
      
      alert('Workout plan assigned successfully!')
      setShowAssignModal(false)
      setSelectedMemberId('')
      if (activeTab === 'assigned') {
        fetchAssignedPlans()
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error assigning workout:', error)
      alert('Failed to assign workout plan')
    } finally {
      setAssignmentLoading(false)
    }
  }

  // Fetch assigned plans
  const fetchAssignedPlans = async () => {
    if (!gymId) return
    setLoadingAssigned(true)
    try {
      const { data, error } = await supabase
        .from('member_workout_plans')
        .select(`
          *,
          members!member_id (
            id,
            custom_fields,
            status
          ),
          workout_plan_templates!template_id (
            name,
            difficulty_level,
            category,
            duration_weeks
          )
        `)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAssignedPlans(data || [])
    } catch (error) {
      console.error('Error fetching assigned plans:', error)
    } finally {
      setLoadingAssigned(false)
    }
  }

  // Manage assignment actions
  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this workout plan assignment?')) return
    
    try {
      const { error } = await supabase
        .from('member_workout_plans')
        .delete()
        .eq('id', assignmentId)
      
      if (error) throw error
      alert('Assignment removed successfully!')
      fetchAssignedPlans()
    } catch (error) {
      console.error('Error removing assignment:', error)
      alert('Failed to remove assignment')
    }
  }

  const handleUpdateStatus = async (assignmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('member_workout_plans')
        .update({ status: newStatus })
        .eq('id', assignmentId)
      
      if (error) throw error
      alert('Status updated successfully!')
      fetchAssignedPlans()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleExtendPlan = async (assignment: any) => {
    const extraWeeks = prompt('How many weeks do you want to extend?', '4')
    if (!extraWeeks) return
    
    const weeks = parseInt(extraWeeks)
    if (isNaN(weeks) || weeks <= 0) {
      alert('Please enter a valid number of weeks')
      return
    }
    
    try {
      const currentEndDate = new Date(assignment.end_date)
      const newEndDate = new Date(currentEndDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
      
      const { error } = await supabase
        .from('member_workout_plans')
        .update({ end_date: newEndDate.toISOString().split('T')[0] })
        .eq('id', assignment.id)
      
      if (error) throw error
      alert(`Plan extended by ${weeks} weeks!`)
      fetchAssignedPlans()
    } catch (error) {
      console.error('Error extending plan:', error)
      alert('Failed to extend plan')
    }
  }

  // Load assigned plans when tab changes
  useMemo(() => {
    if (activeTab === 'assigned') {
      fetchAssignedPlans()
    }
  }, [activeTab, gymId])

  // Handle form submission
  const handleCreateWorkout = async () => {
    if (!gymId || !formData.name.trim()) {
      alert('Please provide a workout plan name')
      return
    }
    
    setIsCreating(true)
    try {
      await createTemplate.mutateAsync({
        gym_id: gymId,
        name: formData.name,
        description: formData.description,
        duration_weeks: formData.duration_weeks,
        difficulty_level: formData.difficulty_level,
        category: formData.category,
        is_active: true,
        created_by: user?.id,
      })
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        duration_weeks: 4,
        difficulty_level: 'Intermediate',
        category: 'Strength',
      })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating workout plan:', error)
      alert('Failed to create workout plan. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDifficulty = filterDifficulty === 'All' || template.difficulty_level === filterDifficulty
      const matchesCategory = filterCategory === 'All' || template.category === filterCategory
      
      return matchesSearch && matchesDifficulty && matchesCategory && template.is_active
    })
  }, [templates, searchQuery, filterDifficulty, filterCategory])

  // Get unique categories and difficulties
  const categories = useMemo(() => {
    const cats = templates.map(t => t.category).filter(Boolean)
    return ['All', ...Array.from(new Set(cats))]
  }, [templates])

  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']

  // Difficulty colors
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-50'
      case 'Intermediate': return 'text-yellow-600 bg-yellow-50'
      case 'Advanced': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Banner - Equipment Style */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl overflow-hidden">
              <div className="px-8 py-10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Dumbbell className="h-10 w-10 text-white" />
                      <h1 className="text-4xl font-bold text-white">Workout Plans</h1>
                    </div>
                    <p className="text-blue-100 text-lg mb-4">
                      Create, manage, and assign workout routines to your members
                    </p>
                    <div className="flex items-center space-x-6 text-white text-sm">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4" />
                        <span>Plan Builder</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Progress Tracking</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                      <Dumbbell className="h-16 w-16 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards with Blue/Purple Theme */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Templates</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {analytics?.totalTemplates || templates.length}
                    </p>
                    <p className="text-blue-100 text-xs">{templates.filter(t => t.is_active).length} active</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Assignments</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {analytics?.activePlans || 0}
                    </p>
                    <p className="text-green-100 text-xs">{analytics?.totalAssignments || 0} total</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Completion Rate</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {analytics?.avgCompletionRate || '0.0'}%
                    </p>
                    <p className="text-purple-100 text-xs">Average progress</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Engagement</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {analytics?.engagementRate || '0'}%
                    </p>
                    <p className="text-gray-500 text-xs">Member activity</p>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-3">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('templates')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <Dumbbell className="h-5 w-5" />
                  <span>Workout Templates</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {templates.filter(t => t.is_active).length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('assigned')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'assigned'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>Assigned Plans</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {assignedPlans.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Templates View */}
          {activeTab === 'templates' && (
            <>
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Workout Plan
                </Button>
              </div>

              {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search workout plans by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-white"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {/* Filter Options */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <Card className="border-0 shadow-md bg-white p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty Level</label>
                          <div className="flex flex-wrap gap-2">
                            {difficulties.map(diff => (
                              <button
                                key={diff}
                                onClick={() => setFilterDifficulty(diff)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  filterDifficulty === diff
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {diff}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                          <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                              <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  filterCategory === cat
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          {/* Workout Templates Grid */}
          {loadingTemplates ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="border-0 shadow-md animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Dumbbell className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Workout Plans Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || filterDifficulty !== 'All' || filterCategory !== 'All'
                    ? 'Try adjusting your filters or search query'
                    : 'Create your first workout plan to get started'}
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Workout Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => router.push(`/workout-plans/${template.id}`)}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all group cursor-pointer overflow-hidden">
                    {/* Gradient Header */}
                    <div className="h-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative">
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(template.difficulty_level)}`}>
                          {template.difficulty_level}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white mb-1">{template.name}</h3>
                        {template.category && (
                          <span className="text-white text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
                            {template.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {template.description || 'No description provided'}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm mb-4">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{template.duration_weeks} weeks</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{template.times_assigned || 0} assigned</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!gymId || !user?.id) return
                            if (!confirm('Are you sure you want to duplicate this workout plan?')) return
                            
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
                                  created_by: user.id,
                                })
                                .select()
                                .single()
                              
                              if (templateError) throw templateError
                              
                              // Fetch and duplicate exercises
                              const { data: exercises } = await supabase
                                .from('workout_exercises')
                                .select('*')
                                .eq('template_id', template.id)
                              
                              if (exercises && exercises.length > 0) {
                                const duplicatedExercises = exercises.map((ex: any) => ({
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
                                
                                await supabase
                                  .from('workout_exercises')
                                  .insert(duplicatedExercises)
                              }
                              
                              alert('Workout plan duplicated successfully!')
                              window.location.reload()
                            } catch (error) {
                              console.error('Error duplicating:', error)
                              alert('Failed to duplicate workout plan')
                            }
                          }}
                          className="group-hover:border-purple-600 group-hover:text-purple-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/workout-plans/${template.id}`)
                          }}
                          className="group-hover:border-orange-600 group-hover:text-orange-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!confirm('Are you sure you want to delete this workout plan?')) return
                            
                            try {
                              await supabase
                                .from('workout_plan_templates')
                                .delete()
                                .eq('id', template.id)
                              
                              alert('Workout plan deleted successfully!')
                              window.location.reload()
                            } catch (error) {
                              console.error('Error deleting:', error)
                              alert('Failed to delete workout plan')
                            }
                          }}
                          className="group-hover:border-red-600 group-hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenAssignModal(template.id)
                          }}
                          size="sm"
                          className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign to Member
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Results Summary */}
          {filteredTemplates.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{filteredTemplates.length}</span> of{' '}
                <span className="font-semibold">{templates.filter(t => t.is_active).length}</span> workout plans
              </p>
            </div>
          )}
            </>
          )}

          {/* Assigned Members View */}
          {activeTab === 'assigned' && (
            <div className="space-y-6">
              {/* Header Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Active Assignments</h2>
                  <p className="text-gray-600 mt-1">Manage workout plans assigned to your members</p>
                </div>
                <Button
                  onClick={() => {
                    setShowAssignModal(true)
                    setAssignTemplateId(null)
                    fetchMembers()
                  }}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign New Plan
                </Button>
              </div>

              {/* Loading State */}
              {loadingAssigned ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : assignedPlans.length === 0 ? (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <UserCheck className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assigned Plans Yet</h3>
                    <p className="text-gray-600 mb-6 text-center max-w-md">
                      Start assigning workout plans to your members to help them achieve their fitness goals
                    </p>
                    <Button
                      onClick={() => {
                        setShowAssignModal(true)
                        setAssignTemplateId(null)
                        fetchMembers()
                      }}
                      className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Your First Plan
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {assignedPlans.map((assignment) => {
                    const member = assignment.members
                    const template = assignment.workout_plan_templates
                    const memberName = member?.custom_fields?.full_name || 'Unknown Member'
                    const memberEmail = member?.custom_fields?.email
                    const memberPhone = member?.custom_fields?.phone
                    
                    // Calculate days remaining
                    const endDate = new Date(assignment.end_date)
                    const today = new Date()
                    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0
                    const isExpired = daysRemaining < 0
                    
                    return (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group"
                      >
                        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              {/* Member Info */}
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-4">
                                  <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {memberName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900">{memberName}</h3>
                                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                                      {memberEmail && (
                                        <div className="flex items-center">
                                          <Mail className="h-3 w-3 mr-1" />
                                          {memberEmail}
                                        </div>
                                      )}
                                      {memberPhone && (
                                        <div className="flex items-center">
                                          <Phone className="h-3 w-3 mr-1" />
                                          {memberPhone}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Plan Details */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-gray-900">{assignment.plan_name}</h4>
                                    <span className={`
                                      px-3 py-1 rounded-full text-xs font-semibold
                                      ${assignment.status === 'Active' ? 'bg-green-100 text-green-700' : ''}
                                      ${assignment.status === 'Completed' ? 'bg-blue-100 text-blue-700' : ''}
                                      ${assignment.status === 'Paused' ? 'bg-yellow-100 text-yellow-700' : ''}
                                    `}>
                                      {assignment.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <p className="text-gray-500 text-xs">Difficulty</p>
                                      <p className="font-medium text-gray-900">{template?.difficulty_level || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 text-xs">Category</p>
                                      <p className="font-medium text-gray-900">{template?.category || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 text-xs">Duration</p>
                                      <p className="font-medium text-gray-900">{template?.duration_weeks || 0} weeks</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 text-xs">Progress</p>
                                      <p className="font-medium text-gray-900">{assignment.completion_percentage || 0}%</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                  <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600">Completion Progress</span>
                                    <span className="font-semibold text-gray-900">{assignment.completion_percentage || 0}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all"
                                      style={{ width: `${assignment.completion_percentage || 0}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Date Info */}
                                <div className="flex items-center space-x-6 text-sm">
                                  <div className="flex items-center text-gray-600">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <span>Started: {new Date(assignment.start_date).toLocaleDateString()}</span>
                                  </div>
                                  <div className={`flex items-center ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-600'}`}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span>
                                      {isExpired ? 'Expired' : isExpiringSoon ? `${daysRemaining} days left` : `Ends: ${new Date(assignment.end_date).toLocaleDateString()}`}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col space-y-2 ml-4">
                                {assignment.status === 'Active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(assignment.id, 'Paused')}
                                    className="hover:border-yellow-600 hover:text-yellow-600"
                                  >
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </Button>
                                )}
                                {assignment.status === 'Paused' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(assignment.id, 'Active')}
                                    className="hover:border-green-600 hover:text-green-600"
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Resume
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExtendPlan(assignment)}
                                  className="hover:border-blue-600 hover:text-blue-600"
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Extend
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/members?id=${member?.id}`)}
                                  className="hover:border-purple-600 hover:text-purple-600"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveAssignment(assignment.id)}
                                  className="hover:border-red-600 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Create Workout Plan Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isCreating && setShowCreateModal(false)}
                className="fixed inset-0 bg-black bg-opacity-50 z-50"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                          <Dumbbell className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Create Workout Plan</h3>
                          <p className="text-blue-100 text-sm">Build a custom workout routine</p>
                        </div>
                      </div>
                      <button
                        onClick={() => !isCreating && setShowCreateModal(false)}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                        disabled={isCreating}
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Form Content */}
                  <div className="p-6 space-y-6">
                    {/* Plan Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Workout Plan Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Beginner Full Body Strength"
                        className="w-full"
                        disabled={isCreating}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the workout plan goals, target audience, and what to expect..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isCreating}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Duration (weeks)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="52"
                          value={formData.duration_weeks}
                          onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 4 })}
                          className="w-full"
                          disabled={isCreating}
                        />
                      </div>

                      {/* Difficulty Level */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Difficulty
                        </label>
                        <select
                          value={formData.difficulty_level}
                          onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isCreating}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isCreating}
                        >
                          <option value="Strength">Strength</option>
                          <option value="Cardio">Cardio</option>
                          <option value="Hypertrophy">Hypertrophy</option>
                          <option value="Fat Loss">Fat Loss</option>
                          <option value="Endurance">Endurance</option>
                          <option value="Flexibility">Flexibility</option>
                          <option value="CrossFit">CrossFit</option>
                          <option value="Powerlifting">Powerlifting</option>
                          <option value="Bodybuilding">Bodybuilding</option>
                        </select>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold mb-1">Next Step: Add Exercises</p>
                          <p>After creating this plan, you'll be able to add exercises for each day of the week.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateWorkout}
                      disabled={isCreating || !formData.name.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Workout Plan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Assign Workout Modal */}
        <AnimatePresence>
          {showAssignModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !assignmentLoading && setShowAssignModal(false)}
                className="fixed inset-0 bg-black bg-opacity-50 z-50"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Assign Workout Plan</h3>
                          <p className="text-green-100 text-sm">Choose a member to assign this plan</p>
                        </div>
                      </div>
                      <button
                        onClick={() => !assignmentLoading && setShowAssignModal(false)}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                        disabled={assignmentLoading}
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Template Selection - Only show if no template pre-selected */}
                    {!assignTemplateId && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select Workout Plan <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={assignTemplateId || ''}
                          onChange={(e) => setAssignTemplateId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          disabled={assignmentLoading}
                        >
                          <option value="">Choose a workout plan...</option>
                          {templates.filter(t => t.is_active).map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name} - {template.difficulty_level} ({template.duration_weeks} weeks)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Member <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={assignmentLoading}
                      >
                        <option value="">Choose a member...</option>
                        {members.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.custom_fields?.full_name || 'Unknown Member'} {member.custom_fields?.email ? `- ${member.custom_fields.email}` : ''}
                          </option>
                        ))}
                      </select>
                      {members.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">No active members found</p>
                      )}
                    </div>

                    {selectedMemberId && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-green-800">
                            <p className="font-semibold mb-1">Ready to Assign</p>
                            <p>This workout plan will be assigned with today as the start date.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowAssignModal(false)}
                      disabled={assignmentLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignWorkout}
                      disabled={assignmentLoading || !selectedMemberId || !assignTemplateId}
                      className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                    >
                      {assignmentLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Assigning...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Assign Workout Plan
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
