'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/contexts/GymContext'
import { useMembershipPlans } from '@/hooks/useOptimizedData'
import { useNavigationTimeout } from '@/hooks/useNavigationTimeout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Crown, 
  Users, 
  IndianRupee, 
  Calendar, 
  Settings,
  Eye,
  Download,
  Filter,
  Star,
  TrendingUp,
  Target,
  Sparkles,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  RotateCcw
} from 'lucide-react'
import ProtectedPage from '@/components/ProtectedPage'
import { useClientOnly } from '@/hooks/useClientOnly'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import Link from 'next/link'
import MembershipPlanDetailsModal from '@/components/MembershipPlanDetailsModal'
import MembershipPlansAdvancedFiltersModal from '@/components/MembershipPlansAdvancedFiltersModal'
import { exportMembershipPlansToCSV } from '@/lib/membershipPlansCsvExport'

// Membership Plan interface - using the table structure we created
interface MembershipPlan {
  id: string
  gym_id: string
  name: string
  price: number
  duration_months: number
  duration_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime'
  features: string[]
  description: string
  status: 'Active' | 'Inactive' | 'Discontinued'
  is_popular: boolean
  max_members: number
  color_theme: string
  created_at: string
}

export default function MembershipPlansPage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  
  // React Query optimized data fetching
  // Use isPending instead of isLoading - only true when NO data exists (not during background refetch)
  const { data: membershipPlans = [], isPending, refetch } = useMembershipPlans(gymId)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [durationFilter, setDurationFilter] = useState<string>('all')
  const [gymNotFound, setGymNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loading = isPending || gymLoading
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [exportingCSV, setExportingCSV] = useState(false)
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState({
    statusFilters: [] as string[],
    durationTypes: [] as string[],
    priceRange: { min: '', max: '' },
    popularityFilter: 'all' as 'all' | 'popular' | 'regular',
    memberLimitRange: { min: '', max: '' },
    featuresCountRange: { min: '', max: '' },
    planAgeRange: { min: '', max: '' },
    memberCountRange: { min: '', max: '' }
  })

  // Refresh callback for modals
  const refreshPlans = () => {
    refetch()
  }

  const hasActiveFilters = () => {
    const hasAdvanced = 
      advancedFilters.statusFilters.length > 0 ||
      advancedFilters.durationTypes.length > 0 ||
      advancedFilters.priceRange.min !== '' ||
      advancedFilters.priceRange.max !== '' ||
      advancedFilters.popularityFilter !== 'all' ||
      advancedFilters.memberLimitRange.min !== '' ||
      advancedFilters.memberLimitRange.max !== '' ||
      advancedFilters.featuresCountRange.min !== '' ||
      advancedFilters.featuresCountRange.max !== '' ||
      advancedFilters.planAgeRange.min !== '' ||
      advancedFilters.planAgeRange.max !== '' ||
      advancedFilters.memberCountRange.min !== '' ||
      advancedFilters.memberCountRange.max !== ''
    return hasAdvanced || searchTerm !== '' || statusFilter !== 'all' || durationFilter !== 'all'
  }

  const handleResetFilters = () => {
    setAdvancedFilters({
      statusFilters: [],
      durationTypes: [],
      priceRange: { min: '', max: '' },
      popularityFilter: 'all',
      memberLimitRange: { min: '', max: '' },
      featuresCountRange: { min: '', max: '' },
      planAgeRange: { min: '', max: '' },
      memberCountRange: { min: '', max: '' }
    })
    setSearchTerm('')
    setStatusFilter('all')
    setDurationFilter('all')
  }

  // Filter membership plans based on search term, status, and duration
  const filteredPlans = useMemo(() => {
    return membershipPlans.filter(plan => {
      const matchesSearch = searchTerm === '' || 
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.features.some((feature: string) => feature.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || plan.status.toLowerCase() === statusFilter.toLowerCase()
      const matchesDuration = durationFilter === 'all' || plan.duration_type.toLowerCase() === durationFilter.toLowerCase()
      
      return matchesSearch && matchesStatus && matchesDuration
    })
  }, [membershipPlans, searchTerm, statusFilter, durationFilter])

  // Get status badge color
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'inactive': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'discontinued': 'bg-red-100 text-red-800 border-red-200'
    }
    
    const colorClass = colors[status.toLowerCase()] || colors['active']
    return <Badge className={colorClass}>{status}</Badge>
  }

  // Get duration badge color
  const getDurationBadge = (durationType: string, durationMonths: number) => {
    const colors: Record<string, string> = {
      'daily': 'bg-blue-100 text-blue-800 border-blue-200',
      'weekly': 'bg-purple-100 text-purple-800 border-purple-200',
      'monthly': 'bg-orange-100 text-orange-800 border-orange-200',
      'yearly': 'bg-pink-100 text-pink-800 border-pink-200',
      'lifetime': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    const colorClass = colors[durationType.toLowerCase()] || colors['monthly']
    const displayText = durationType === 'monthly' && durationMonths !== 1 
      ? `${durationMonths} Months` 
      : durationType.charAt(0).toUpperCase() + durationType.slice(1)
    
    return <Badge className={colorClass}>{displayText}</Badge>
  }

  // Format amount
  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Calculate totals
  const totalPlans = membershipPlans.length
  const activePlans = membershipPlans.filter(plan => plan.status === 'Active').length
  const averagePrice = membershipPlans.length > 0 
    ? membershipPlans.reduce((sum, plan) => sum + plan.price, 0) / membershipPlans.length 
    : 0

  // 🚀 BUTTON HANDLERS WITH ENTERPRISE POWER
  const handleViewPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan)
    setShowDetailsModal(true)
  }

  const handleExportCSV = async () => {
    try {
      setExportingCSV(true)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for animation
      await exportMembershipPlansToCSV(filteredPlans)
      alert('Membership plans data exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data. Please try again.')
    } finally {
      setExportingCSV(false)
    }
  }

  const handleAdvancedFilters = () => {
    setShowAdvancedFilters(true)
  }

  const handleApplyAdvancedFilters = (filters: typeof advancedFilters) => {
    setAdvancedFilters(filters)
    setShowAdvancedFilters(false)
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this membership plan? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', planId)

      if (error) {
        console.error('Error deleting plan:', error)
        alert('Error deleting plan. Please try again.')
      } else {
        alert('Membership plan deleted successfully!')
        refreshPlans()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error deleting plan. Please try again.')
    }
  }
  const popularPlans = membershipPlans.filter((plan: any) => plan.is_popular).length

  // Auto-refresh with debouncing
  const { debouncedRefresh } = useAutoRefresh({
    onRefresh: refreshPlans,
    interval: 30000,
    enabled: true
  })

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header with Gradient */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <Crown className="h-8 w-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Membership Plans</h1>
                </div>
                <p className="text-purple-100 text-lg">Design, manage, and optimize your gym's membership offerings with powerful insights</p>
                <div className="flex items-center space-x-6 mt-4 text-sm text-purple-100">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Plan Strategy</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Revenue Optimization</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <IndianRupee className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Crown className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Membership Plans</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards with Purple Theme */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Plans</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {totalPlans}
                    </p>
                    <p className="text-purple-100 text-xs">Avg: {formatAmount(averagePrice)}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">This Month</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {formatAmount(averagePrice * activePlans)}
                    </p>
                    <p className="text-indigo-100 text-xs">{(activePlans / Math.max(totalPlans, 1) * 100).toFixed(0)}% of total</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Plans</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {totalPlans}
                    </p>
                    <p className="text-blue-100 text-xs">Latest: {membershipPlans[0]?.created_at ? new Date(membershipPlans[0].created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Plans</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {activePlans}
                    </p>
                    <p className="text-gray-500 text-xs">Currently available</p>
                  </div>
                  <div className="bg-purple-100 rounded-lg p-3">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Link href="/membership-plans/add">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
              >
                <Plus size={20} />
                Add Plan
              </button>
            </Link>
            <button 
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} className={exportingCSV ? 'animate-spin' : ''} />
              {exportingCSV ? 'Exporting...' : `Export CSV (${filteredPlans.length})`}
            </button>
            <button 
              onClick={handleAdvancedFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transform hover:scale-105 transition-all duration-200"
            >
              <Filter size={20} />
              More Filters
            </button>
            {hasActiveFilters() && (
              <button 
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transform hover:scale-105 transition-all duration-200"
              >
                <RotateCcw size={20} />
                Reset Filters
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search membership plans by name, features..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Durations</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Plans List */}
          {filteredPlans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Crown className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No membership plans found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchTerm || statusFilter !== 'all' || durationFilter !== 'all'
                    ? 'No membership plans match your search criteria.' 
                    : 'Get started by creating your first membership plan.'}
                </p>
                <Link href="/membership-plans/add">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Membership Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            /* 🎯 SQUARE RECTANGLE CARD LAYOUT */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className="relative hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 hover:border-blue-300 group overflow-hidden cursor-pointer"
                  style={{ 
                    borderTop: `6px solid ${plan.color_theme}`,
                    minHeight: '400px'
                  }}
                  onClick={() => handleViewPlan(plan)}
                >
                  {/* Hover Background Effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                    style={{ backgroundColor: plan.color_theme }}
                  />
                  
                  {/* Popular Badge */}
                  {plan.is_popular && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-6 h-full flex flex-col relative">
                    {/* Header Section */}
                    <div className="text-center mb-6">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                        style={{ backgroundColor: `${plan.color_theme}20` }}
                      >
                        <Crown className="h-8 w-8" style={{ color: plan.color_theme }} />
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {plan.name}
                      </h3>
                      
                      <div className="text-center mb-4">
                        <div className="text-4xl font-bold text-blue-600 mb-1">
                          {formatAmount(plan.price)}
                        </div>
                        <div className="text-sm text-gray-500">
                          per {plan.duration_type === 'monthly' && plan.duration_months !== 1 
                            ? `${plan.duration_months} months` 
                            : plan.duration_type.replace('ly', '')}
                        </div>
                      </div>

                      <div className="flex justify-center space-x-2 mb-4">
                        {getDurationBadge(plan.duration_type, plan.duration_months)}
                        {getStatusBadge(plan.status)}
                      </div>
                    </div>

                    {/* Description */}
                    {plan.description && (
                      <p className="text-gray-600 text-sm text-center mb-4 line-clamp-2">
                        {plan.description}
                      </p>
                    )}

                    {/* Features Section */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="mb-6 flex-1">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Features:</h4>
                        <div className="space-y-2">
                          {plan.features.slice(0, 4).map((feature: string, index: number) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span className="line-clamp-1">{feature}</span>
                            </div>
                          ))}
                          {plan.features.length > 4 && (
                            <div className="text-center">
                              <Badge variant="outline" className="text-xs">
                                +{plan.features.length - 4} more features
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer Info */}
                    <div className="text-center text-xs text-gray-500 mb-4">
                      {plan.max_members && (
                        <div className="mb-1">Max Members: {plan.max_members}</div>
                      )}
                      <div>Created: {new Date(plan.created_at).toLocaleDateString('en-IN')}</div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-center gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                      {/* Edit Button */}
                      <Link href={`/membership-plans/edit/${plan.id}`} className="flex-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full group/edit hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 overflow-hidden"
                        >
                          <Edit className="h-4 w-4 flex-shrink-0" />
                          <span className="max-w-0 group-hover/edit:max-w-xs overflow-hidden transition-all duration-200 group-hover/edit:ml-2 whitespace-nowrap">
                            Edit
                          </span>
                        </Button>
                      </Link>

                      {/* Delete Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="flex-1 group/delete hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 overflow-hidden"
                      >
                        <Trash2 className="h-4 w-4 flex-shrink-0" />
                        <span className="max-w-0 group-hover/delete:max-w-xs overflow-hidden transition-all duration-200 group-hover/delete:ml-2 whitespace-nowrap">
                          Delete
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🚀 ENTERPRISE MODALS */}
      {selectedPlan && (
        <MembershipPlanDetailsModal
          plan={selectedPlan}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedPlan(null)
          }}
          onPlanUpdated={() => {
            refreshPlans()
            setShowDetailsModal(false)
            setSelectedPlan(null)
          }}
        />
      )}

      <MembershipPlansAdvancedFiltersModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={() => {
          setShowAdvancedFilters(false)
        }}
      />
    </ProtectedPage>
  )
}