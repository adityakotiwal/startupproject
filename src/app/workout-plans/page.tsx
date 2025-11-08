'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { useWorkoutTemplates, useWorkoutAnalytics } from '@/hooks/useWorkoutPlans'
import ProtectedRoute from '@/components/ProtectedRoute'
import { 
  Dumbbell, Plus, Search, Filter, TrendingUp, Users, 
  Award, Target, Calendar, MoreVertical, Edit, Trash2, 
  Copy, Eye, Clock, Zap, ArrowUp, Activity, ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function WorkoutPlansPage() {
  const { user, signOut } = useAuth()
  const { currentGym, gymId } = useGymContext()
  const { data: templates = [], isPending: loadingTemplates } = useWorkoutTemplates(gymId)
  const { data: analytics } = useWorkoutAnalytics(gymId)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

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
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <div className="flex items-center space-x-2 cursor-pointer group">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                      <Dumbbell className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">
                        {currentGym?.name || 'GymSync Pro'}
                      </h1>
                      <p className="text-xs text-gray-500">Workout Plans</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex space-x-1">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                  Dashboard
                </Link>
                <Link href="/members" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                  Members
                </Link>
                <Link href="/workout-plans" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Workout Plans
                </Link>
                <Link href="/analytics" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                  Analytics
                </Link>
              </nav>

              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header with Stats */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                    <Dumbbell className="h-8 w-8 text-white" />
                  </div>
                  <span>Workout Plans</span>
                </h2>
                <p className="text-gray-600 mt-1">
                  Create, manage, and assign workout routines to your members
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Workout Plan
              </Button>
            </div>

            {/* Analytics Cards */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Total Templates</p>
                        <h3 className="text-3xl font-bold text-blue-900 mt-1">{analytics.totalTemplates}</h3>
                      </div>
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Active Assignments</p>
                        <h3 className="text-3xl font-bold text-green-900 mt-1">{analytics.activePlans}</h3>
                      </div>
                      <div className="p-3 bg-green-600 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Completion Rate</p>
                        <h3 className="text-3xl font-bold text-purple-900 mt-1">{analytics.avgCompletionRate}%</h3>
                      </div>
                      <div className="p-3 bg-purple-600 rounded-lg">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-700 font-medium">Engagement</p>
                        <h3 className="text-3xl font-bold text-orange-900 mt-1">{analytics.engagementRate}%</h3>
                      </div>
                      <div className="p-3 bg-orange-600 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 group-hover:border-blue-600 group-hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="group-hover:border-purple-600 group-hover:text-purple-600"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="group-hover:border-orange-600 group-hover:text-orange-600"
                        >
                          <Edit className="h-4 w-4" />
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
        </main>
      </div>
    </ProtectedRoute>
  )
}
