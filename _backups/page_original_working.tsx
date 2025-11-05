'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dumbbell, Users, DollarSign, TrendingUp, Settings, LogOut, Plus, 
  Calendar, Clock, AlertTriangle, Target, Award, Activity, Zap,
  ChevronRight, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  UserPlus, CreditCard, Wrench, Star, Bell, Search, Filter,
  CheckCircle, XCircle, AlertCircle, TrendingDown
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import { useGymContext } from '@/hooks/useGymContext'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { gymId } = useGymContext()
  const isClient = useClientOnly()
  
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    overdueMembers: 0,
    quitMembers: 0,
    monthlyRevenue: 0,
    totalEquipment: 0,
    staffCount: 0,
    recentPayments: 0,
    loading: true
  })

  const [recentActivities, setRecentActivities] = useState([])
  const [upcomingRenewals, setUpcomingRenewals] = useState([])

  console.log('Dashboard - Current user:', user)

  const fetchComprehensiveStats = useCallback(async (timeoutId: NodeJS.Timeout) => {
    try {
      // Use gymId from context instead of manually fetching
      if (!gymId) {
        console.log('No gym ID available from context')
        clearTimeout(timeoutId)
        setStats(prev => ({ ...prev, loading: false }))
        return
      }

      console.log('Using gym ID from context:', gymId)

      // Use the EXACT same query as members page to ensure consistency
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          *,
          membership_plans:plan_id (
            name,
            duration_days,
            price
          )
        `)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })

      console.log('Members fetch result:', { data: members, error: membersError })

      if (membersError) {
        console.error('Members query error:', membersError)
      }

      // Process members data - same logic as members page
      const membersData = members || []
      console.log('Processed members:', membersData)
      
      const totalMembers = membersData.length
      const activeMembers = membersData.filter(m => {
        const status = m.status?.toLowerCase()
        return status === 'active'
      }).length
      const overdueMembers = membersData.filter(m => {
        const status = m.status?.toLowerCase()
        return status === 'overdue'
      }).length
      const quitMembers = membersData.filter(m => {
        const status = m.status?.toLowerCase()
        return status === 'quit'
      }).length

      console.log('Member stats calculated:', { totalMembers, activeMembers, overdueMembers, quitMembers })

      setStats({
        totalMembers,
        activeMembers,
        overdueMembers,
        quitMembers,
        monthlyRevenue: 0, // Will add later
        totalEquipment: 0, // Will add later  
        staffCount: 0, // Will add later
        recentPayments: 0, // Will add later
        loading: false
      })
      
      console.log('✅ DASHBOARD STATS LOADED!')
      console.log('Final stats:', {
        totalMembers,
        activeMembers,
        overdueMembers,
        quitMembers
      })
      clearTimeout(timeoutId)
    } catch (error) {
      console.error('Error in fetchComprehensiveStats:', error)
      clearTimeout(timeoutId)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }, [gymId])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setStats(prev => ({ ...prev, loading: false }))
    }, 5000)
    
    // Only fetch if we have a gymId
    if (gymId) {
      fetchComprehensiveStats(timeoutId)
    } else {
      console.log('Waiting for gymId from context...')
      clearTimeout(timeoutId)
      setStats(prev => ({ ...prev, loading: false }))
    }
    
    // Handle visibility changes and refresh data
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && gymId) {
        console.log('Tab visible - refreshing dashboard data')
        const newTimeoutId = setTimeout(() => {
          setStats(prev => ({ ...prev, loading: false }))
        }, 5000)
        fetchComprehensiveStats(newTimeoutId)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Auto-refresh every 30 seconds if tab is active
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && gymId) {
        console.log('Auto-refreshing dashboard data')
        const newTimeoutId = setTimeout(() => {
          setStats(prev => ({ ...prev, loading: false }))
        }, 5000)
        fetchComprehensiveStats(newTimeoutId)
      }
    }, 30000)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(refreshInterval)
    }
  }, [gymId, fetchComprehensiveStats])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getGrowthPercentage = (current: number, category: string) => {
    // Mock growth percentages - replace with real calculation later
    const mockGrowth = {
      members: 12,
      revenue: 8,
      equipment: 5,
      staff: 15
    }
    return mockGrowth[category as keyof typeof mockGrowth] || 0
  }

  // Don't render interactive elements until client-side hydration is complete
  if (!isClient) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                    <Dumbbell className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    GymSync Pro
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Loading...</span>
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
              <p className="text-gray-600">Loading your gym management dashboard...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Enhanced Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                    <Dumbbell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      GymSync Pro
                    </h1>
                    <p className="text-xs text-gray-500">Gym Management Suite</p>
                  </div>
                </div>
                
                {/* Enhanced Navigation Menu */}
                <nav className="hidden md:flex space-x-1">
                  <Link href="/dashboard" className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-blue-200">
                    Dashboard
                  </Link>
                  <Link href="/members" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    Members
                  </Link>
                  <Link href="/staff" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    Staff
                  </Link>
                  <Link href="/equipment" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    Equipment
                  </Link>
                  <Link href="/membership-plans" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    Plans
                  </Link>
                  <Link href="/expenses" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    Expenses
                  </Link>
                  <Link href="/payments" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                    Payments
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 hover:bg-blue-100 transition-colors"
                  onClick={() => {
                    setStats(prev => ({ ...prev, loading: true }))
                    const timeoutId = setTimeout(() => {
                      setStats(prev => ({ ...prev, loading: false }))
                    }, 5000)
                    fetchComprehensiveStats(timeoutId)
                  }}
                  disabled={stats.loading}
                >
                  <Activity className={`h-4 w-4 ${stats.loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {(user?.name || user?.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{user?.name || user?.full_name}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Hero Section */}
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.name?.split(' ')[0] || 'Gym Owner'}! 👋
                  </h2>
                  <p className="text-blue-100 text-lg">
                    Here's what's happening at your gym today
                  </p>
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Last updated: {new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">System Status: All Good</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (gymId) {
                          setStats(prev => ({ ...prev, loading: true }))
                          const timeoutId = setTimeout(() => {
                            setStats(prev => ({ ...prev, loading: false }))
                          }, 5000)
                          fetchComprehensiveStats(timeoutId)
                        }
                      }}
                      className="text-white hover:bg-white/20 border-white/30"
                      disabled={stats.loading || !gymId}
                    >
                      <Activity className={`h-4 w-4 mr-1 ${stats.loading ? 'animate-spin' : ''}`} />
                      {stats.loading ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                    <Target className="h-16 w-16 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Debug Info for Development */}
          {!stats.loading && stats.totalMembers === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">No Members Found in Dashboard</span>
              </div>
              <p className="text-xs text-yellow-700">
                The dashboard is not showing member data. This usually means you need to login first.
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-yellow-600">User ID: {user?.id || 'Not logged in'}</div>
                <div className="text-xs text-yellow-600">Gym ID: {gymId || 'Not available'}</div>
                <div className="text-xs text-yellow-600 font-medium">
                  Please login first to see your gym data: <Link href="/auth/login" className="underline text-blue-600">Login Page</Link>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Members Card - Clickable */}
            <Link href="/members" className="block">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Total Members</CardTitle>
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900 mb-1">
                    {stats.loading ? (
                      <div className="animate-pulse bg-blue-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.totalMembers
                    )}
                  </div>
                  <div className="flex items-center text-xs">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">+{getGrowthPercentage(stats.totalMembers, 'members')}%</span>
                    <span className="text-gray-500 ml-1">vs last month</span>
                  </div>
                  {!stats.loading && stats.totalMembers === 0 && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      Click to add your first member
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* Active Members Card - Clickable */}
            <Link href="/members?filter=active" className="block">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Active Members</CardTitle>
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900 mb-1">
                    {stats.loading ? (
                      <div className="animate-pulse bg-green-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.activeMembers
                    )}
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-600">
                      {stats.totalMembers > 0 ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}% of total
                    </span>
                  </div>
                  {!stats.loading && stats.activeMembers === 0 && stats.totalMembers > 0 && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      Click to view all members
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* Monthly Revenue Card - Clickable */}
            <Link href="/payments" className="block">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Monthly Revenue</CardTitle>
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900 mb-1">
                    {stats.loading ? (
                      <div className="animate-pulse bg-purple-200 h-8 w-20 rounded"></div>
                    ) : (
                      `₹${stats.monthlyRevenue.toLocaleString()}`
                    )}
                  </div>
                  <div className="flex items-center text-xs">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">+{getGrowthPercentage(stats.monthlyRevenue, 'revenue')}%</span>
                    <span className="text-gray-500 ml-1">vs last month</span>
                  </div>
                  {!stats.loading && stats.monthlyRevenue === 0 && (
                    <div className="mt-2 text-xs text-purple-600 font-medium">
                      Click to record payments
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* Overdue Payments Card - Clickable */}
            <Link href="/members?filter=overdue" className="block">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">Overdue Payments</CardTitle>
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-900 mb-1">
                    {stats.loading ? (
                      <div className="animate-pulse bg-orange-200 h-8 w-12 rounded"></div>
                    ) : (
                      stats.overdueMembers
                    )}
                  </div>
                  <div className="flex items-center text-xs">
                    {stats.overdueMembers > 0 ? (
                      <>
                        <AlertCircle className="h-3 w-3 text-orange-500 mr-1" />
                        <span className="text-orange-600 font-medium">Needs attention</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-600 font-medium">All up to date</span>
                      </>
                    )}
                  </div>
                  {!stats.loading && stats.overdueMembers > 0 && (
                    <div className="mt-2 text-xs text-orange-600 font-medium">
                      Click to view overdue members
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/equipment" className="block">
              <Card className="border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Equipment</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.loading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                        ) : (
                          stats.totalEquipment
                        )}
                      </p>
                      {!stats.loading && stats.totalEquipment === 0 && (
                        <p className="text-xs text-indigo-600 font-medium mt-1">Click to add equipment</p>
                      )}
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <Wrench className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff" className="block">
              <Card className="border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Staff Members</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.loading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                        ) : (
                          stats.staffCount
                        )}
                      </p>
                      {!stats.loading && stats.staffCount === 0 && (
                        <p className="text-xs text-cyan-600 font-medium mt-1">Click to add staff</p>
                      )}
                    </div>
                    <div className="p-3 bg-cyan-100 rounded-full">
                      <Users className="h-6 w-6 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/payments" className="block">
              <Card className="border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recent Payments</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.loading ? (
                          <div className="animate-pulse bg-gray-200 h-6 w-8 rounded"></div>
                        ) : (
                          stats.recentPayments
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <CreditCard className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Actions Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>
                Most common tasks for gym management
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/members/add" className="group">
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group-hover:shadow-md">
                    <UserPlus className="h-8 w-8 text-blue-600 mb-2" />
                    <p className="font-medium text-gray-900">Add Member</p>
                    <p className="text-xs text-gray-500">Register new member</p>
                  </div>
                </Link>
                
                <Link href="/payments" className="group">
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all group-hover:shadow-md">
                    <CreditCard className="h-8 w-8 text-green-600 mb-2" />
                    <p className="font-medium text-gray-900">Record Payment</p>
                    <p className="text-xs text-gray-500">Process membership fee</p>
                  </div>
                </Link>
                
                <Link href="/equipment" className="group">
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all group-hover:shadow-md">
                    <Wrench className="h-8 w-8 text-purple-600 mb-2" />
                    <p className="font-medium text-gray-900">Manage Equipment</p>
                    <p className="text-xs text-gray-500">Track maintenance</p>
                  </div>
                </Link>
                
                <Link href="/staff/add" className="group">
                  <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group-hover:shadow-md">
                    <Users className="h-8 w-8 text-indigo-600 mb-2" />
                    <p className="font-medium text-gray-900">Add Staff</p>
                    <p className="text-xs text-gray-500">Hire new team member</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}