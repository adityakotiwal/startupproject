'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { useNavigationTimeout } from '@/hooks/useNavigationTimeout'
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
  BarChart3
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import PaymentDetailsModal from '@/components/PaymentDetailsModal'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Payment interface - based on your database structure
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
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

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

      // Fetch payments for the current gym with member data
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          members (
            id,
            custom_fields
          )
        `)
        .eq('gym_id', gymId)
        .order('payment_date', { ascending: false })

      if (error) {
        console.error('Error fetching payments:', error)
        setError(error.message)
        setPayments([])
      } else {
        console.log(`✅ Successfully fetched ${data?.length || 0} payments for gym: ${gymId}`)
        setPayments(data || [])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setError('An unexpected error occurred')
      setPayments([])
    } finally {
      console.log('Finished fetching payments, setting loading to false')
      setLoading(false)
    }
  }, [user?.id, gymId, gymLoading])

  useEffect(() => {
    if (isClient && user && gymId && !gymLoading) {
      console.log('🎯 LOADING PAYMENTS DATA FOR GYM:', gymId)
      fetchPayments()
    }
  }, [isClient, user, gymId, gymLoading, fetchPayments])

  // Filter payments based on search term and payment mode
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = searchTerm === '' || 
        payment.members?.custom_fields?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment_mode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount.toString().includes(searchTerm) ||
        payment.notes?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesMode = paymentModeFilter === 'all' || payment.payment_mode.toLowerCase() === paymentModeFilter.toLowerCase()

      return matchesSearch && matchesMode
    })
  }, [payments, searchTerm, paymentModeFilter])  // Get category badge color
  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      'equipment': 'bg-blue-100 text-blue-800 border-blue-200',
      'utilities': 'bg-green-100 text-green-800 border-green-200',
      'salaries': 'bg-purple-100 text-purple-800 border-purple-200',
      'maintenance': 'bg-orange-100 text-orange-800 border-orange-200',
      'rent': 'bg-red-100 text-red-800 border-red-200',
      'marketing': 'bg-pink-100 text-pink-800 border-pink-200',
      'other': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    const colorClass = colors[category.toLowerCase()] || colors['other']
    return <Badge className={colorClass}>{category}</Badge>
  }

  // Format amount
  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })
  }

  // Button handlers
  const handleViewPayment = (payment: Payment) => {
    console.log('💼 Opening payment details for:', payment.id)
    setSelectedPayment(payment)
    setShowDetailsModal(true)
  }

  const handleEditPayment = (payment: Payment) => {
    router.push(`/payments/edit/${payment.id}`)
  }

  const handleDeletePayment = async (payment: Payment) => {
    if (!confirm(`Are you sure you want to delete this ${payment.payment_mode} payment of ${formatAmount(payment.amount)}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id)

      if (error) throw error

      console.log('✅ Successfully deleted payment:', payment.id)
      await fetchPayments() // Refresh the list
    } catch (error) {
      console.error('❌ Error deleting payment:', error)
      alert('Failed to delete payment. Please try again.')
    }
  }

  const handleExportCSV = async () => {
    console.log('📊 Starting CSV export for', filteredPayments.length, 'payments')
    // Simple CSV export for payments
    const csvData = [
      ['Member Name', 'Amount', 'Payment Mode', 'Payment Date', 'Notes', 'Created At'],
      ...filteredPayments.map(payment => [
        payment.members?.custom_fields?.full_name || 'Unknown Member',
        payment.amount.toString(),
        payment.payment_mode,
        payment.payment_date,
        payment.notes || '',
        payment.created_at
      ])
    ]
    
    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `payments-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Calculate payment statistics
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const monthlyRevenue = payments.filter(payment => {
    const paymentDate = new Date(payment.payment_date)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
  }).reduce((sum, payment) => sum + payment.amount, 0)
  
  const todayRevenue = payments.filter(payment => {
    const paymentDate = new Date(payment.payment_date)
    const today = new Date()
    return paymentDate.toDateString() === today.toDateString()
  }).reduce((sum, payment) => sum + payment.amount, 0)
  
  const avgPayment = payments.length > 0 ? totalRevenue / payments.length : 0

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
            <p className="text-gray-600">Loading expenses...</p>
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
                  <Link href="/expenses" className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium">
                    Expenses
                  </Link>
                  <Link href="/payments" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Payments
                  </Link>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {currentGym?.name || 'Loading gym...'}
                </span>
                <Link href="/expenses/add">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header with Gradient */}
          <div className="relative mb-8 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-red-700"></div>
            <div className="relative px-8 py-12 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                      <Receipt className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Expense Management</h1>
                  </div>
                  <p className="text-red-100 text-lg font-medium">
                    Track, analyze, and optimize your gym expenses with powerful insights
                  </p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-red-200" />
                      <span className="text-red-100 text-sm">Advanced Analytics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-red-200" />
                      <span className="text-red-100 text-sm">Cost Optimization</span>
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
                    <Receipt className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Expenses</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Summary Cards with Gradients */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold tracking-tight">
                      {formatAmount(totalRevenue)}
                    </p>
                    <p className="text-green-100 text-xs">
                      {payments.length > 0 ? `Avg: ${formatAmount(avgPayment)}` : 'No data'}
                    </p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Revenue Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-blue-100 text-sm font-medium">This Month</p>
                    <p className="text-3xl font-bold tracking-tight">
                      {formatAmount(monthlyRevenue)}
                    </p>
                    <p className="text-blue-100 text-xs">
                      {totalRevenue > 0 ? `${((monthlyRevenue / totalRevenue) * 100).toFixed(1)}% of total` : 'No data'}
                    </p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Revenue Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-purple-100 text-sm font-medium">Today's Revenue</p>
                    <p className="text-3xl font-bold tracking-tight">
                      {formatAmount(todayRevenue)}
                    </p>
                    <p className="text-purple-100 text-xs">
                      Daily earnings
                    </p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Count Card */}
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-orange-100 text-sm font-medium">Total Payments</p>
                    <p className="text-3xl font-bold tracking-tight">
                      {payments.length.toLocaleString()}
                    </p>
                    <p className="text-orange-100 text-xs">
                      {payments.length > 0 ? `Latest: ${formatDate(payments[0]?.payment_date)}` : 'No payments yet'}
                    </p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                    <Receipt className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search payments by member, amount, or payment mode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Payment Modes</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                className="hover:bg-gray-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportCSV}
                className="hover:bg-green-50 border-green-200 text-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Payments List */}
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Receipt className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchTerm || paymentModeFilter !== 'all' 
                    ? 'No payments match your search criteria.' 
                    : 'Get started by recording your first payment.'}
                </p>
                <Link href="/payments/add">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Record First Payment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Receipt className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {payment.members?.custom_fields?.full_name || 'Unknown Member'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {payment.payment_mode}
                              </p>
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
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Added: {new Date(payment.created_at).toLocaleDateString('en-IN')}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewPayment(payment)}
                              className="hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditPayment(payment)}
                              className="hover:bg-green-50"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeletePayment(payment)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {showDetailsModal && selectedPayment && (
          <PaymentDetailsModal
            isOpen={showDetailsModal}
            payment={selectedPayment}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedPayment(null)
            }}
            onPaymentUpdated={() => {
              fetchPayments() // Refresh data after updates
            }}
          />
        )}


      </div>
    </ProtectedRoute>
  )
}