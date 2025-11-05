'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  TrendingUp, 
  IndianRupee, 
  Calendar, 
  Receipt,
  Eye,
  Edit,
  Trash2,
  Settings,
  Target,
  BarChart3,
  CreditCard,
  DollarSign,
  RotateCcw,
  X,
  User,
  FileText
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PaymentsAdvancedFiltersModal from '@/components/PaymentsAdvancedFiltersModal'
import { exportPaymentsToCSV } from '@/lib/csvExport'

// Payment interface - using your exact table structure
interface Payment {
  id: string
  gym_id: string
  member_id: string
  amount: number
  payment_date: string
  payment_mode: string
  notes?: string
  created_at: string
  members?: {
    id: string
    custom_fields: {
      full_name?: string
      phone?: string
      email?: string
    } | null
  }
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const isClient = useClientOnly()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all')
  const [gymNotFound, setGymNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [memberPayments, setMemberPayments] = useState<Payment[]>([])
  const [loadingMember, setLoadingMember] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)

  // Add gentle timeout protection
  useEffect(() => {
    if (!loading) return
    
    const gentleTimeout = setTimeout(() => {
      if (payments.length > 0 || !user || gymId === null) {
        console.log('⏰ Gentle timeout - completing loading with data available')
        setLoading(false)
      }
    }, 5000)
    
    return () => clearTimeout(gentleTimeout)
  }, [loading, payments.length, user, gymId])

  const fetchPayments = useCallback(async () => {
    if (!user?.id || gymLoading) {
      return
    }
    
    if (!gymId) {
      setLoading(false)
      return
    }
    
    try {
      console.log('Fetching payments for gym:', gymId)
      setError(null)
      setGymNotFound(false)

      // Fetch payments for the current gym with member details
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          members:member_id (
            id,
            custom_fields
          )
        `)
        .eq('gym_id', gymId)
        .order('payment_date', { ascending: false })

      if (error) {
        console.error('❌ Error fetching payments:', error)
        setError(`Failed to load payments: ${error.message}`)
        return
      }

      console.log('✅ Payments loaded:', data?.length || 0)
      setPayments(data || [])
      
    } catch (error) {
      console.error('❌ Unexpected error fetching payments:', error)
      setError('An unexpected error occurred while loading payments')
    } finally {
      setLoading(false)
    }
  }, [user?.id, gymId, gymLoading])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Format currency amount
  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState<any>(null)

  // Filter payments based on search and filters
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const memberName = payment.members?.custom_fields?.full_name || ''
      
      // Basic search match
      const searchMatch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.amount.toString().includes(searchTerm) ||
                         payment.payment_mode.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Basic mode filter
      const modeMatch = paymentModeFilter === 'all' || payment.payment_mode === paymentModeFilter
      
      // Advanced filters
      let advancedMatch = true
      
      if (advancedFilters) {
        // Payment mode filter
        if (advancedFilters.paymentModes && advancedFilters.paymentModes.length > 0) {
          advancedMatch = advancedMatch && advancedFilters.paymentModes.includes(payment.payment_mode)
        }
        
        // Amount range filter
        if (advancedFilters.amountFrom) {
          advancedMatch = advancedMatch && payment.amount >= parseInt(advancedFilters.amountFrom)
        }
        if (advancedFilters.amountTo) {
          advancedMatch = advancedMatch && payment.amount <= parseInt(advancedFilters.amountTo)
        }
        
        // Date range filter
        if (advancedFilters.dateFrom) {
          advancedMatch = advancedMatch && new Date(payment.payment_date) >= new Date(advancedFilters.dateFrom)
        }
        if (advancedFilters.dateTo) {
          advancedMatch = advancedMatch && new Date(payment.payment_date) <= new Date(advancedFilters.dateTo)
        }
        
        // Age filter (days since payment)
        if (advancedFilters.ageFrom || advancedFilters.ageTo) {
          const paymentAge = Math.floor((Date.now() - new Date(payment.payment_date).getTime()) / (1000 * 60 * 60 * 24))
          
          if (advancedFilters.ageFrom) {
            advancedMatch = advancedMatch && paymentAge >= parseInt(advancedFilters.ageFrom)
          }
          if (advancedFilters.ageTo) {
            advancedMatch = advancedMatch && paymentAge <= parseInt(advancedFilters.ageTo)
          }
        }
      }
      
      return searchMatch && modeMatch && advancedMatch
    })
  }, [payments, searchTerm, paymentModeFilter, advancedFilters])

  // Get unique payment modes for filter
  const paymentModes = useMemo(() => {
    const modes = new Set(payments.map(p => p.payment_mode))
    return Array.from(modes)
  }, [payments])

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowDetailsModal(true)
  }

  const handleEditPayment = (payment: Payment) => {
    // Navigate to edit page with payment ID
    router.push(`/payments/edit/${payment.id}`)
  }

  const handleDeletePayment = async (payment: Payment) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this payment of ${formatAmount(payment.amount)} from ${payment.members?.custom_fields?.full_name || 'Unknown Member'}?`
    )
    
    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id)
        .eq('gym_id', gymId) // Extra security check

      if (error) {
        console.error('Error deleting payment:', error)
        alert('Failed to delete payment. Please try again.')
        return
      }

      // Remove payment from local state
      setPayments(prevPayments => prevPayments.filter(p => p.id !== payment.id))
      
      // Show success message
      alert('Payment deleted successfully!')
      
    } catch (error) {
      console.error('Unexpected error deleting payment:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const handleExportCSV = async () => {
    console.log('📊 Starting CSV export for', filteredPayments.length, 'payments')
    
    if (filteredPayments.length === 0) {
      alert('No payments to export. Please add some payments first.')
      return
    }

    try {
      setExportingCSV(true)
      
      // Create filename with gym name and current date
      const gymName = currentGym?.name || 'Gym'
      const today = new Date().toISOString().split('T')[0]
      const filename = `${gymName.replace(/\s+/g, '-')}-payments-${today}.csv`
      
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Export filtered payments to CSV
      exportPaymentsToCSV(filteredPayments, filename)
      
      // Show success message
      console.log('✅ CSV export completed successfully')
      
    } catch (error) {
      console.error('❌ Error exporting payments:', error)
      alert('Failed to export payments. Please try again.')
    } finally {
      setExportingCSV(false)
    }
  }

  const handleAdvancedFilters = () => {
    setShowAdvancedFilters(true)
  }

  const handleApplyAdvancedFilters = (filters: any) => {
    console.log('📊 Advanced filters applied:', filters)
    setAdvancedFilters(filters)
    setShowAdvancedFilters(false)
  }

  const handleResetFilters = () => {
    setAdvancedFilters(null)
    setSearchTerm('')
    setPaymentModeFilter('all')
  }

  const fetchMemberDetails = async (memberId: string) => {
    setLoadingMember(true)
    try {
      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select(`
          *,
          membership_plans (
            name,
            price,
            duration_days
          )
        `)
        .eq('id', memberId)
        .eq('gym_id', gymId)
        .single()

      if (memberError) {
        console.error('Error fetching member:', memberError)
        return
      }

      // Fetch all payments for this member
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberId)
        .eq('gym_id', gymId)
        .order('payment_date', { ascending: false })

      if (paymentsError) {
        console.error('Error fetching member payments:', paymentsError)
        return
      }

      setSelectedMember(memberData)
      setMemberPayments(paymentsData || [])
      setShowMemberModal(true)
      
    } catch (error) {
      console.error('Error fetching member details:', error)
    } finally {
      setLoadingMember(false)
    }
  }

  const hasActiveFilters = () => {
    return advancedFilters !== null || searchTerm !== '' || paymentModeFilter !== 'all'
  }

  // Calculate totals
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const monthlyRevenue = payments.filter(payment => {
    const paymentDate = new Date(payment.payment_date)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
  }).reduce((sum, payment) => sum + payment.amount, 0)

  // Better loading state management
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  if (loading && user && !gymNotFound && !error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payments...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                  <Receipt className="h-8 w-8" />
                  <span className="text-2xl font-bold">GymSync Pro</span>
                </Link>
                
                {/* Navigation Menu */}
                <nav className="hidden md:flex space-x-8">
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link href="/members" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Members
                  </Link>
                  <Link href="/staff" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Staff
                  </Link>
                  <Link href="/equipment" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Equipment
                  </Link>
                  <Link href="/membership-plans" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Membership Plans
                  </Link>
                  <Link href="/expenses" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Expenses
                  </Link>
                  <Link href="/payments" className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium">
                    Payments
                  </Link>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {currentGym?.name || 'Loading gym...'}
                </span>
                <Link href="/payments/add">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header with Gradient */}
          <div className="relative mb-8 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700"></div>
            <div className="relative px-8 py-12 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                      <CreditCard className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Payment Management</h1>
                  </div>
                  <p className="text-green-100 text-lg font-medium">
                    Track, analyze, and manage your gym revenue with comprehensive insights
                  </p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-green-200" />
                      <span className="text-green-100 text-sm">Revenue Analytics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-green-200" />
                      <span className="text-green-100 text-sm">Income Tracking</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                    <IndianRupee className="h-16 w-16 text-white" />
                  </div>
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
                    <CreditCard className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Payments</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Summary Cards with Gradients */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Revenue Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-600 to-green-700"></div>
                <CardContent className="relative p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold tracking-tight">
                        {formatAmount(totalRevenue)}
                      </p>
                      <p className="text-green-100 text-xs">
                        {payments.length > 0 ? `Avg: ${formatAmount(totalRevenue / payments.length)}` : 'No data'}
                      </p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Revenue Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-emerald-100 text-sm font-medium">This Month</p>
                    <p className="text-3xl font-bold tracking-tight">
                      {formatAmount(monthlyRevenue)}
                    </p>
                    <p className="text-emerald-100 text-xs">
                      {totalRevenue > 0 ? `${((monthlyRevenue / totalRevenue) * 100).toFixed(1)}% of total` : 'No data'}
                    </p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Total Records Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-blue-100 text-sm font-medium">Total Payments</p>
                    <p className="text-3xl font-bold tracking-tight">
                      {payments.length.toLocaleString()}
                    </p>
                    <p className="text-blue-100 text-xs">
                      Latest: {payments.length > 0 ? new Date(payments[0].payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No payments'}
                    </p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <Receipt className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by member name, amount, or payment mode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={paymentModeFilter}
                    onChange={(e) => setPaymentModeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Payment Modes</option>
                    {paymentModes.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                  
                  <Button variant="outline" onClick={handleAdvancedFilters}>
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                  </Button>
                  
                  <Button variant="outline" onClick={handleExportCSV} disabled={exportingCSV}>
                    <Download className={`h-4 w-4 mr-2 ${exportingCSV ? 'animate-spin' : ''}`} />
                    {exportingCSV ? 'Exporting...' : 'Export CSV'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Filters Indicator and Reset Button */}
          {hasActiveFilters() && (
            <Card className="mb-4 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Filter className="h-5 w-5 text-orange-600" />
                    <div>
                      <h3 className="text-sm font-medium text-orange-800">Filters Active</h3>
                      <p className="text-xs text-orange-700">
                        Showing {filteredPayments.length} of {payments.length} payments
                        {advancedFilters && ' (Advanced filters applied)'}
                        {searchTerm && ` • Search: "${searchTerm}"`}
                        {paymentModeFilter !== 'all' && ` • Mode: ${paymentModeFilter}`}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetFilters}
                    className="text-orange-700 border-orange-300 hover:bg-orange-100"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payments List */}
          <div className="space-y-4">
            {loading ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading payments...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredPayments.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CreditCard className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                  <p className="text-gray-500 text-center mb-6 max-w-sm">
                    {searchTerm || paymentModeFilter !== 'all' 
                      ? 'No payments match your current filters.' 
                      : 'Record your first payment to get started.'}
                  </p>
                  <Link href="/payments/add">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Record First Payment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <CreditCard className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {payment.members?.custom_fields?.full_name || 'Unknown Member'}
                              </h3>
                              <Badge 
                                className={`${
                                  payment.payment_mode === 'Cash' ? 'bg-green-100 text-green-800 border-green-200' :
                                  payment.payment_mode === 'Card' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  payment.payment_mode === 'UPI' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                  'bg-gray-100 text-gray-800 border-gray-200'
                                }`}
                              >
                                {payment.payment_mode}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {formatAmount(payment.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        
                        {payment.notes && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{payment.notes}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Added: {new Date(payment.created_at).toLocaleDateString('en-IN')}
                          </div>
                          <motion.div 
                            className="flex space-x-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.3 }}
                          >
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetails(payment)}
                                className="hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditPayment(payment)}
                                className="hover:bg-green-50"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeletePayment(payment)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </motion.div>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters Modal */}
        {showAdvancedFilters && (
          <PaymentsAdvancedFiltersModal
            isOpen={showAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
            onApplyFilters={handleApplyAdvancedFilters}
          />
        )}

        {/* Enhanced Payment Details Modal */}
        {showDetailsModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Enhanced Header with Gradient */}
              <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                      <Receipt className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Payment Details</h2>
                      <p className="text-green-100 font-medium">
                        Transaction ID: {selectedPayment.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetailsModal(false)}
                    className="text-white hover:bg-white/20 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Payment Summary Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <IndianRupee className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Payment Amount</h3>
                          <p className="text-green-600 text-sm">Revenue Record</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-700">
                          {formatAmount(selectedPayment.amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(selectedPayment.payment_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Payment Mode Badge */}
                    <div className="flex items-center justify-between">
                      <Badge 
                        className={`px-3 py-1 text-sm font-semibold ${
                          selectedPayment.payment_mode === 'Cash' ? 'bg-green-100 text-green-800 border-green-200' :
                          selectedPayment.payment_mode === 'Card' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          selectedPayment.payment_mode === 'UPI' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          selectedPayment.payment_mode === 'Bank Transfer' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                          selectedPayment.payment_mode === 'Net Banking' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                          selectedPayment.payment_mode === 'Cheque' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          selectedPayment.payment_mode === 'Digital Wallet' ? 'bg-pink-100 text-pink-800 border-pink-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        {selectedPayment.payment_mode}
                      </Badge>
                      
                      {/* Status Indicator */}
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600 font-medium">Completed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Member Information Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Member Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Full Name</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900 pl-6">
                          {selectedPayment.members?.custom_fields?.full_name || 'Unknown Member'}
                        </p>
                      </div>
                      
                      {selectedPayment.members?.custom_fields?.phone && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">📱 Phone Number</span>
                          </div>
                          <p className="text-gray-900 font-medium pl-6">
                            {selectedPayment.members.custom_fields.phone}
                          </p>
                        </div>
                      )}
                      
                      {selectedPayment.members?.custom_fields?.email && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-500">✉️ Email Address</span>
                          </div>
                          <p className="text-gray-900 font-medium pl-6 break-all">
                            {selectedPayment.members.custom_fields.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Timeline Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                      Payment Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Payment Date */}
                      <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900">Payment Made</h4>
                          <p className="text-green-700 font-medium">
                            {new Date(selectedPayment.payment_date).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-green-600">
                            {(() => {
                              const paymentDate = new Date(selectedPayment.payment_date)
                              const today = new Date()
                              const diffTime = Math.abs(today.getTime() - paymentDate.getTime())
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                              return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
                            })()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-700">
                            {formatAmount(selectedPayment.amount)}
                          </div>
                        </div>
                      </div>

                      {/* Recorded Date */}
                      <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Receipt className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900">Payment Recorded</h4>
                          <p className="text-blue-700 font-medium">
                            {new Date(selectedPayment.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} at {new Date(selectedPayment.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm text-blue-600">System timestamp</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes Section */}
                {selectedPayment.notes && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <FileText className="h-5 w-5 mr-2 text-amber-600" />
                        Payment Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <p className="text-gray-800 leading-relaxed">{selectedPayment.notes}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}


              </div>

              {/* Enhanced Action Footer */}
              <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 rounded-b-xl">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        if (selectedPayment.member_id) {
                          setShowDetailsModal(false)
                          fetchMemberDetails(selectedPayment.member_id)
                        } else {
                          alert('Member information not available')
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={loadingMember}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {loadingMember ? 'Loading...' : 'View Member Details'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDetailsModal(false)
                        handleEditPayment(selectedPayment)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Payment
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeletePayment(selectedPayment)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailsModal(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comprehensive Member Details Modal */}
        {showMemberModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Member Profile</h2>
                      <p className="text-blue-100 font-medium">
                        {selectedMember.custom_fields?.full_name || 'Unknown Member'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMemberModal(false)}
                    className="text-white hover:bg-white/20 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Member Information Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <User className="h-5 w-5 mr-2 text-green-600" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Full Name</span>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedMember.custom_fields?.full_name || 'Not specified'}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Phone Number</span>
                            <p className="text-gray-900 font-medium">
                              {selectedMember.custom_fields?.phone || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Email Address</span>
                            <p className="text-gray-900 font-medium break-all">
                              {selectedMember.custom_fields?.email || 'Not provided'}
                            </p>
                          </div>
                        </div>
                        {selectedMember.custom_fields?.gender && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Gender</span>
                            <p className="text-gray-900 font-medium">
                              {selectedMember.custom_fields.gender}
                            </p>
                          </div>
                        )}
                        {selectedMember.custom_fields?.dateOfBirth && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Date of Birth</span>
                            <p className="text-gray-900 font-medium">
                              {new Date(selectedMember.custom_fields.dateOfBirth).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Membership Information */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                        Membership Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Membership Plan</span>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedMember.membership_plans?.name || 'No active plan'}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Status</span>
                          <div className="mt-1">
                            <Badge className={`${
                              selectedMember.status === 'active' ? 'bg-green-100 text-green-800' :
                              selectedMember.status === 'expired' ? 'bg-red-100 text-red-800' :
                              selectedMember.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedMember.status?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Plan Price</span>
                          <p className="text-gray-900 font-medium">
                            {selectedMember.membership_plans?.price 
                              ? formatAmount(selectedMember.membership_plans.price) 
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Start Date</span>
                          <p className="text-gray-900 font-medium">
                            {new Date(selectedMember.start_date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">End Date</span>
                          <p className="text-gray-900 font-medium">
                            {new Date(selectedMember.end_date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Member Since</span>
                        <p className="text-gray-900 font-medium">
                          {new Date(selectedMember.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Statistics */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                      Payment Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {memberPayments.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Payments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {formatAmount(memberPayments.reduce((sum, payment) => sum + payment.amount, 0))}
                        </div>
                        <div className="text-sm text-gray-600">Total Amount</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {memberPayments.length > 0 
                            ? formatAmount(memberPayments.reduce((sum, payment) => sum + payment.amount, 0) / memberPayments.length)
                            : formatAmount(0)}
                        </div>
                        <div className="text-sm text-gray-600">Average Payment</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {memberPayments.length > 0 
                            ? new Date(memberPayments[0].payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                            : 'No payments'}
                        </div>
                        <div className="text-sm text-gray-600">Last Payment</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment History */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Receipt className="h-5 w-5 mr-2 text-indigo-600" />
                      Payment History ({memberPayments.length} payments)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {memberPayments.length === 0 ? (
                      <div className="text-center py-12">
                        <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
                        <p className="text-gray-500">This member has not made any payments yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {memberPayments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <Receipt className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-3">
                                  <span className="font-semibold text-gray-900">
                                    {formatAmount(payment.amount)}
                                  </span>
                                  <Badge className={`text-xs ${
                                    payment.payment_mode === 'Cash' ? 'bg-green-100 text-green-800' :
                                    payment.payment_mode === 'Card' ? 'bg-blue-100 text-blue-800' :
                                    payment.payment_mode === 'UPI' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {payment.payment_mode}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                {payment.notes && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    📝 {payment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                {(() => {
                                  const paymentDate = new Date(payment.payment_date)
                                  const today = new Date()
                                  const diffTime = Math.abs(today.getTime() - paymentDate.getTime())
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                  return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
                                })()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Information */}
                {(selectedMember.custom_fields?.address || selectedMember.custom_fields?.emergencyContact) && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <FileText className="h-5 w-5 mr-2 text-amber-600" />
                        Additional Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedMember.custom_fields?.address && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Address</span>
                            <p className="text-gray-900 font-medium mt-1">
                              {selectedMember.custom_fields.address}
                            </p>
                            {selectedMember.custom_fields?.pincode && (
                              <p className="text-gray-700 text-sm">
                                PIN: {selectedMember.custom_fields.pincode}
                              </p>
                            )}
                          </div>
                        )}
                        {selectedMember.custom_fields?.emergencyContact && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Emergency Contact</span>
                            <p className="text-gray-900 font-medium mt-1">
                              {selectedMember.custom_fields.emergencyContact}
                            </p>
                            {selectedMember.custom_fields?.emergencyPhone && (
                              <p className="text-gray-700 text-sm">
                                Phone: {selectedMember.custom_fields.emergencyPhone}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 rounded-b-xl">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="flex gap-3">
                    <Link href={`/members/edit/${selectedMember.id}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Member
                      </Button>
                    </Link>
                    <Link href={`/payments/add?member_id=${selectedMember.id}`}>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Record Payment
                      </Button>
                    </Link>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowMemberModal(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}