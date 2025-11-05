'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dumbbell, Users, DollarSign, TrendingUp, LogOut,
  Clock, AlertTriangle, Target, Activity,
  UserPlus, CreditCard, Wrench, Bell,
  CheckCircle, AlertCircle
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useGymContext } from '@/hooks/useGymContext'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { gymId } = useGymContext()
  
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    overdueMembers: 0,
    monthlyRevenue: 0,
    totalEquipment: 0,
    staffCount: 0,
    recentPayments: 0,
    loading: true
  })

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const fetchStats = async () => {
    if (!gymId) {
      console.log('No gym ID available')
      setStats(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      console.log('Fetching stats for gym:', gymId)

      const [membersResult, paymentsResult, equipmentResult, staffResult] = await Promise.all([
        supabase.from('members').select('*').eq('gym_id', gymId),
        supabase.from('payments').select('amount, payment_date, status').eq('gym_id', gymId).gte('payment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('equipment').select('id').eq('gym_id', gymId),
        supabase.from('staff').select('id').eq('gym_id', gymId)
      ])

      console.log('Query results:', { membersResult, paymentsResult, equipmentResult, staffResult })

      const members = membersResult.data || []
      const payments = paymentsResult.data || []
      const equipment = equipmentResult.data || []
      const staff = staffResult.data || []

      const totalMembers = members.length
      const activeMembers = members.filter(m => m.status?.toLowerCase() === 'active').length
      const overdueMembers = members.filter(m => m.status?.toLowerCase() === 'overdue').length
      const monthlyRevenue = payments.filter(p => p.status === 'completed' || p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0)
      const recentPayments = payments.filter(p => new Date(p.payment_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length

      setStats({
        totalMembers,
        activeMembers,
        overdueMembers,
        monthlyRevenue,
        totalEquipment: equipment.length,
        staffCount: staff.length,
        recentPayments,
        loading: false
      })

      console.log('Stats updated:', { totalMembers, activeMembers, overdueMembers, monthlyRevenue })
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    if (gymId) {
      fetchStats()
    }
  }, [gymId])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
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
                
                <nav className="hidden md:flex space-x-1">
                  <Link href="/dashboard" className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link href="/members" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium">
                    Members
                  </Link>
                  <Link href="/staff" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium">
                    Staff
                  </Link>
                  <Link href="/equipment" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium">
                    Equipment
                  </Link>
                  <Link href="/membership-plans" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium">
                    Plans
                  </Link>
                  <Link href="/expenses" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium">
                    Expenses
                  </Link>
                  <Link href="/payments" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium">
                    Payments
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2"
                  onClick={fetchStats}
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
          {/* Welcome Section */}
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

          {/* Debug Info */}
          {!stats.loading && stats.totalMembers === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">No Members Found</span>
              </div>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>User ID: {user?.id || 'Not logged in'}</div>
                <div>Gym ID: {gymId || 'Not available'}</div>
                <div>Please login first: <Link href="/auth/login" className="underline text-blue-600">Login Page</Link></div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Members */}
            <Link href="/members" className="block">
              <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.loading ? '...' : stats.totalMembers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% vs last month
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Active Members */}
            <Link href="/members?filter=active" className="block">
              <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.loading ? '...' : stats.activeMembers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalMembers > 0 ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Monthly Revenue */}
            <Link href="/payments" className="block">
              <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.loading ? '...' : `₹${stats.monthlyRevenue.toLocaleString()}`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8% vs last month
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Overdue Payments */}
            <Link href="/members?filter=overdue" className="block">
              <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.loading ? '...' : stats.overdueMembers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.overdueMembers === 0 ? 'All up to date' : 'Needs attention'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/equipment" className="block">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Equipment</p>
                      <p className="text-2xl font-bold">{stats.loading ? '...' : stats.totalEquipment}</p>
                    </div>
                    <Wrench className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff" className="block">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Staff Members</p>
                      <p className="text-2xl font-bold">{stats.loading ? '...' : stats.staffCount}</p>
                    </div>
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/payments" className="block">
              <Card className="hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recent Payments</p>
                      <p className="text-2xl font-bold">{stats.loading ? '...' : stats.recentPayments}</p>
                      <p className="text-xs text-gray-500">Last 7 days</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Most common tasks for gym management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/members/add">
                  <Button variant="outline" className="w-full h-16 flex flex-col">
                    <UserPlus className="h-6 w-6 mb-1" />
                    <span className="text-xs">Add Member</span>
                  </Button>
                </Link>
                <Link href="/payments">
                  <Button variant="outline" className="w-full h-16 flex flex-col">
                    <CreditCard className="h-6 w-6 mb-1" />
                    <span className="text-xs">Record Payment</span>
                  </Button>
                </Link>
                <Link href="/staff/add">
                  <Button variant="outline" className="w-full h-16 flex flex-col">
                    <Users className="h-6 w-6 mb-1" />
                    <span className="text-xs">Add Staff</span>
                  </Button>
                </Link>
                <Link href="/equipment">
                  <Button variant="outline" className="w-full h-16 flex flex-col">
                    <Wrench className="h-6 w-6 mb-1" />
                    <span className="text-xs">Manage Equipment</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}