'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { usePayments, useInvalidateQueries } from '@/hooks/useOptimizedData'
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
  FileText,
  Send,
  UserPlus,
  FileDown
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppHeader from '@/components/AppHeader'
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
  
  // React Query optimized data fetching
  const { data: payments = [], isLoading, refetch } = usePayments(gymId)
  const { invalidatePayments } = useInvalidateQueries()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all')
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
  
  // Refresh callback for modals
  const refreshPayments = () => {
    refetch()
    invalidatePayments()
  }
  
  const loading = isLoading || gymLoading

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

      // Refresh payments list
      refreshPayments()
      
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AppHeader 
          onRefresh={refreshPayments}
          isRefreshing={loading}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header with Gradient */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <CreditCard className="h-8 w-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Payment Management</h1>
                </div>
                <p className="text-green-100 text-lg">Track, analyze, and manage your gym revenue with comprehensive insights</p>
                <div className="flex items-center space-x-6 mt-4 text-sm text-green-100">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Revenue Analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Income Tracking</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <CreditCard className="h-16 w-16 text-white" />
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Revenue Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatAmount(totalRevenue)}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
              <p className="text-green-100 text-xs">
                {payments.length > 0 ? `Avg: ${formatAmount(totalRevenue / payments.length)}` : 'No data'}
              </p>
            </div>

            {/* Monthly Revenue Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">This Month</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatAmount(monthlyRevenue)}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
              </div>
              <p className="text-emerald-100 text-xs">
                {totalRevenue > 0 ? `${((monthlyRevenue / totalRevenue) * 100).toFixed(1)}% of total` : 'No data'}
              </p>
            </div>

            {/* Total Payments Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Payments</p>
                  <p className="text-3xl font-bold mt-1">
                    {payments.length.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Receipt className="h-8 w-8" />
                </div>
              </div>
              <p className="text-blue-100 text-xs">
                Latest: {payments.length > 0 ? new Date(payments[0].payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No payments'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Link href="/payments/add">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
              >
                <Plus size={20} />
                Add Payment
              </button>
            </Link>
            <button 
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} className={exportingCSV ? 'animate-spin' : ''} />
              {exportingCSV ? 'Exporting...' : `Export CSV (${filteredPayments.length})`}
            </button>
            <button 
              onClick={handleAdvancedFilters}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transform hover:scale-105 transition-all duration-200 ${
                advancedFilters
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <Filter size={20} />
              More Filters
              {advancedFilters && (
                <span className="bg-purple-800 px-2 py-1 rounded-full text-xs">
                  Active
                </span>
              )}
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
                      placeholder="Search by member name, amount, or payment mode..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
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
                {filteredPayments.map((payment) => (
                  <Card 
                    key={payment.id} 
                    className="relative border-0 shadow-lg hover:shadow-2xl hover:scale-105 hover:border-green-300 transition-all duration-300 cursor-pointer group overflow-hidden"
                    onClick={() => handleViewDetails(payment)}
                  >
                    {/* Colored background overlay on hover */}
                    <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

                    <CardContent className="p-6 relative z-10">
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
                          
                          {/* Quick Actions */}
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* View Member Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (payment.member_id) {
                                  fetchMemberDetails(payment.member_id)
                                } else {
                                  alert('Member information not available')
                                }
                              }}
                              className="group hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-all duration-200 overflow-hidden"
                            >
                              <User className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                Member
                              </span>
                            </Button>

                            {/* Download Receipt Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const receiptData = `
PAYMENT RECEIPT
================
Receipt ID: ${payment.id}
Member: ${payment.members?.custom_fields?.full_name || 'Unknown'}
Amount: ₹${payment.amount.toLocaleString('en-IN')}
Payment Mode: ${payment.payment_mode}
Payment Date: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}
Notes: ${payment.notes || 'N/A'}
================
Thank you for your payment!
Generated: ${new Date().toLocaleString('en-IN')}
                                `.trim()
                                
                                const blob = new Blob([receiptData], { type: 'text/plain' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `payment-receipt-${payment.id}.txt`
                                a.click()
                                URL.revokeObjectURL(url)
                              }}
                              className="group hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all duration-200 overflow-hidden"
                            >
                              <FileDown className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                Receipt
                              </span>
                            </Button>

                            {/* Send WhatsApp Receipt */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const memberPhone = payment.members?.custom_fields?.phone
                                if (memberPhone) {
                                  const message = `Hi ${payment.members?.custom_fields?.full_name || 'Member'}! Your payment of ₹${payment.amount.toLocaleString('en-IN')} has been received. Payment Mode: ${payment.payment_mode}. Date: ${new Date(payment.payment_date).toLocaleDateString('en-IN')}. Thank you!`
                                  const whatsappUrl = `https://wa.me/${memberPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
                                  window.open(whatsappUrl, '_blank')
                                } else {
                                  alert('Member phone number not available')
                                }
                              }}
                              className="group hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all duration-200 overflow-hidden"
                            >
                              <Send className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                WhatsApp
                              </span>
                            </Button>

                            {/* Edit Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPayment(payment)}
                              className="group hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 overflow-hidden"
                            >
                              <Edit className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                Edit
                              </span>
                            </Button>

                            {/* Delete Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePayment(payment)}
                              className="group hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 overflow-hidden"
                            >
                              <Trash2 className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                Delete
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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