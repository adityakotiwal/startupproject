'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { supabase } from '@/lib/supabaseClient'
import { useMembers, usePayments, useExpenses, useMembershipPlans } from '@/hooks/useOptimizedData'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { exportAnalyticsToCSV } from '@/lib/csvExport'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppHeader from '@/components/AppHeader'
import { useClientOnly } from '@/hooks/useClientOnly'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

interface AnalyticsData {
  memberGrowth: any[]
  revenueData: any[]
  paymentModes: any[]
  memberStatus: any[]
  expenseCategories: any[]
  monthlyComparison: any[]
  retentionRate: number
  churnRate: number
  avgRevenuePerMember: number
  paymentCollectionRate: number
  profitMargin: number
  activeMembers: number
  newMembersThisMonth: number
  membersTurnover: number
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const isClient = useClientOnly()
  
  // 🔒 Use React Query hooks with built-in gymId gates
  // Use isPending instead of isLoading - only true when NO data exists (not during background refetch)
  const { data: members = [], isPending: membersLoading } = useMembers(gymId)
  const { data: payments = [], isPending: paymentsLoading } = usePayments(gymId)
  const { data: expenses = [], isPending: expensesLoading } = useExpenses(gymId)
  const { data: membershipPlans = [], isPending: plansLoading } = useMembershipPlans(gymId)
  
  // Combined loading state from all React Query hooks
  const loading = membersLoading || paymentsLoading || expensesLoading || plansLoading
  
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30') // days
  const [exportingReport, setExportingReport] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    memberGrowth: [],
    revenueData: [],
    paymentModes: [],
    memberStatus: [],
    expenseCategories: [],
    monthlyComparison: [],
    retentionRate: 0,
    churnRate: 0,
    avgRevenuePerMember: 0,
    paymentCollectionRate: 0,
    profitMargin: 0,
    activeMembers: 0,
    newMembersThisMonth: 0,
    membersTurnover: 0
  })

  const processAnalyticsData = useCallback(() => {
    // 🔒 GATE: Do not proceed without gymId or if still loading
    if (!gymId || loading) {
      return
    }

    try {
      const days = parseInt(dateRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      // Use data from React Query hooks (already fetched with gymId gates)

      // 1. MEMBER ANALYTICS
      const totalMembers = members?.length || 0
      const activeMembers = members?.filter(m => m.status === 'active').length || 0
      const newMembersThisMonth = members?.filter(m => {
        const joinDate = new Date(m.start_date)
        return joinDate >= startOfMonth
      }).length || 0
      
      const quitMembers = members?.filter(m => m.status === 'quit').length || 0
      const churnRate = totalMembers > 0 ? (quitMembers / totalMembers) * 100 : 0
      const retentionRate = 100 - churnRate

      // Member Growth Over Time (Last 6 months)
      const memberGrowth = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthMembers = members?.filter(m => {
          const joinDate = new Date(m.start_date)
          return joinDate <= monthEnd
        }).length || 0
        
        memberGrowth.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          members: monthMembers,
          active: members?.filter(m => {
            const joinDate = new Date(m.start_date)
            return joinDate <= monthEnd && m.status === 'active'
          }).length || 0
        })
      }

      // Member Status Distribution
      const memberStatus = [
        { name: 'Active', value: activeMembers, color: '#10b981' },
        { name: 'Overdue', value: members?.filter(m => m.status === 'overdue').length || 0, color: '#f59e0b' },
        { name: 'Quit', value: quitMembers, color: '#ef4444' }
      ]

      // 2. REVENUE ANALYTICS
      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      const monthlyRevenue = payments?.filter(p => {
        const paymentDate = new Date(p.payment_date)
        return paymentDate >= startOfMonth
      }).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
      const monthlyExpenses = expenses?.filter(e => {
        const expenseDate = new Date(e.expense_date)
        return expenseDate >= startOfMonth
      }).reduce((sum, e) => sum + (e.amount || 0), 0) || 0

      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
      const avgRevenuePerMember = activeMembers > 0 ? totalRevenue / activeMembers : 0

      // Revenue vs Expenses Over Time (Last 6 months)
      const monthlyComparison = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const revenue = payments?.filter(p => {
          const paymentDate = new Date(p.payment_date)
          return paymentDate >= monthStart && paymentDate <= monthEnd
        }).reduce((sum, p) => sum + (p.amount || 0), 0) || 0
        
        const expense = expenses?.filter(e => {
          const expenseDate = new Date(e.expense_date)
          return expenseDate >= monthStart && expenseDate <= monthEnd
        }).reduce((sum, e) => sum + (e.amount || 0), 0) || 0
        
        monthlyComparison.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          revenue,
          expenses: expense,
          profit: revenue - expense
        })
      }

      // 3. PAYMENT ANALYTICS
      const paymentModeCount: Record<string, number> = {}
      payments?.forEach(p => {
        const mode = p.payment_mode || 'Unknown'
        paymentModeCount[mode] = (paymentModeCount[mode] || 0) + 1
      })

      const paymentModes = Object.entries(paymentModeCount).map(([name, value]) => ({
        name,
        value,
        amount: payments?.filter(p => p.payment_mode === name).reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      }))

      // Calculate expected vs collected payments
      const expectedPayments = members?.filter(m => m.status === 'active').length || 0
      const collectedPayments = payments?.filter(p => {
        const paymentDate = new Date(p.payment_date)
        return paymentDate >= startOfMonth
      }).length || 0
      const paymentCollectionRate = expectedPayments > 0 ? (collectedPayments / expectedPayments) * 100 : 0

      // 4. EXPENSE ANALYTICS
      const expenseCategoryCount: Record<string, number> = {}
      expenses?.forEach(e => {
        const category = e.category || 'Other'
        expenseCategoryCount[category] = (expenseCategoryCount[category] || 0) + (e.amount || 0)
      })

      const expenseCategories = Object.entries(expenseCategoryCount).map(([name, value]) => ({
        name,
        value
      }))

      setAnalyticsData({
        memberGrowth,
        revenueData: monthlyComparison,
        paymentModes,
        memberStatus,
        expenseCategories,
        monthlyComparison,
        retentionRate,
        churnRate,
        avgRevenuePerMember,
        paymentCollectionRate,
        profitMargin,
        activeMembers,
        newMembersThisMonth,
        membersTurnover: quitMembers
      })

    } catch (error) {
      console.error('Error processing analytics:', error)
    }
  }, [gymId, dateRange, members, payments, expenses, membershipPlans, loading])

  // Process analytics whenever data changes
  useEffect(() => {
    processAnalyticsData()
  }, [processAnalyticsData])

  const exportReport = async () => {
    try {
      setExportingReport(true)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for animation
      
      const reportData = {
        generatedAt: new Date().toISOString(),
        gymName: currentGym?.name,
        dateRange: `Last ${dateRange} days`,
        ...analyticsData
      }
      
      exportAnalyticsToCSV(reportData, `analytics-report-${new Date().toISOString().split('T')[0]}.csv`)
    } finally {
      setExportingReport(false)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'members', name: 'Member Analytics', icon: Users },
    { id: 'revenue', name: 'Revenue & Expenses', icon: DollarSign },
    { id: 'payments', name: 'Payment Analytics', icon: CreditCard }
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (!isClient) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <AppHeader />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">Loading Analytics...</div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AppHeader onRefresh={processAnalyticsData} isRefreshing={loading} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header */}
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <BarChart3 className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-bold">Advanced Analytics</h1>
                  </div>
                  <p className="text-blue-100 text-lg">
                    Comprehensive insights into your gym's performance
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                    <Activity className="h-16 w-16 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
              <option value="180">Last 6 Months</option>
              <option value="365">Last Year</option>
            </select>

            <button
              onClick={exportReport}
              disabled={exportingReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} className={exportingReport ? 'animate-spin' : ''} />
              {exportingReport ? 'Exporting...' : 'Export Report'}
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={20} />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content Based on Active Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Members</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                          {loading ? '...' : analyticsData.activeMembers}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {analyticsData.newMembersThisMonth} new this month
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <UserCheck className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                          {loading ? '...' : `${analyticsData.retentionRate.toFixed(1)}%`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {analyticsData.membersTurnover} members quit
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <Target className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">
                          {loading ? '...' : `${analyticsData.profitMargin.toFixed(1)}%`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Revenue - Expenses
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">
                          {loading ? '...' : `${analyticsData.paymentCollectionRate.toFixed(1)}%`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Payment collection
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <CreditCard className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Revenue vs Expenses</CardTitle>
                    <CardDescription>Monthly comparison (Last 6 months)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.monthlyComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                        <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Member Status Distribution</CardTitle>
                    <CardDescription>Current member breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.memberStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.memberStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Member Growth Trend</CardTitle>
                  <CardDescription>Total and active members over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analyticsData.memberGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="members" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Total Members" />
                      <Area type="monotone" dataKey="active" stackId="2" stroke="#10b981" fill="#10b981" name="Active Members" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Retention Rate</h3>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="text-4xl font-bold text-green-600">
                      {analyticsData.retentionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Members staying active
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Churn Rate</h3>
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-4xl font-bold text-red-600">
                      {analyticsData.churnRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {analyticsData.membersTurnover} members quit
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Avg Revenue/Member</h3>
                      <DollarSign className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-4xl font-bold text-blue-600">
                      ₹{analyticsData.avgRevenuePerMember.toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Per active member
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Revenue & Expense Trends</CardTitle>
                  <CardDescription>6-month financial overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData.monthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                      <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Expense Breakdown by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.expenseCategories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ₹${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.expenseCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Financial Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Profit Margin</p>
                        <p className="text-2xl font-bold text-green-600">
                          {analyticsData.profitMargin.toFixed(1)}%
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{analyticsData.monthlyComparison.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{analyticsData.monthlyComparison.reduce((sum, item) => sum + item.expenses, 0).toLocaleString()}
                        </p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Payment Mode Distribution</CardTitle>
                    <CardDescription>Preferred payment methods</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.paymentModes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8b5cf6" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Payment Collection Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Collection Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {analyticsData.paymentCollectionRate.toFixed(1)}%
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Mode Revenue</h4>
                      {analyticsData.paymentModes.map((mode, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-600">{mode.name}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            ₹{mode.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
