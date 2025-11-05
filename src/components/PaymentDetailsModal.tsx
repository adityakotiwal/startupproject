'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Receipt,
  IndianRupee,
  Calendar,
  CreditCard,
  User,
  Phone,
  Mail,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  TrendingUp,
  Target,
  Settings,
  CheckCircle,
  XCircle,
  Activity,
  Award,
  Clock,
  FileText,
  DollarSign,
  PieChart,
  Users,
  Smartphone,
  MapPin,
  Star,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

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

interface PaymentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  payment: Payment
  onPaymentUpdated: () => void
}

export default function PaymentDetailsModal({ 
  isOpen, 
  onClose, 
  payment,
  onPaymentUpdated 
}: PaymentDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [memberStats, setMemberStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    averagePayment: 0,
    lastPaymentDays: 0,
    paymentFrequency: 'Unknown',
    preferredMethod: 'Unknown'
  })
  const [paymentMethodStats, setPaymentMethodStats] = useState({
    methodCount: 0,
    methodPercentage: 0,
    methodRank: 0
  })

  useEffect(() => {
    if (isOpen && payment) {
      fetchMemberStats()
      fetchPaymentMethodStats()
    }
  }, [isOpen, payment])

  if (!isOpen || !payment) return null

  const fetchMemberStats = async () => {
    try {
      // Fetch all payments for this member
      const { data: memberPayments } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_mode')
        .eq('gym_id', payment.gym_id)
        .eq('member_id', payment.member_id)
        .order('payment_date', { ascending: false })

      if (memberPayments && memberPayments.length > 0) {
        const totalAmount = memberPayments.reduce((sum, p) => sum + p.amount, 0)
        const totalPayments = memberPayments.length
        const averagePayment = totalAmount / totalPayments

        // Calculate days since last payment (excluding current)
        const otherPayments = memberPayments.filter(p => p.payment_date !== payment.payment_date)
        const lastPaymentDays = otherPayments.length > 0 
          ? Math.floor((new Date(payment.payment_date).getTime() - new Date(otherPayments[0].payment_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0

        // Find preferred payment method
        const methodCounts = memberPayments.reduce((acc, p) => {
          acc[p.payment_mode] = (acc[p.payment_mode] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        const preferredMethod = Object.entries(methodCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'

        // Calculate payment frequency
        let paymentFrequency = 'Irregular'
        if (totalPayments >= 12) {
          const monthsSpan = Math.max(1, 
            (new Date(memberPayments[0].payment_date).getTime() - 
             new Date(memberPayments[totalPayments - 1].payment_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
          )
          const paymentsPerMonth = totalPayments / monthsSpan
          
          if (paymentsPerMonth >= 0.8) paymentFrequency = 'Monthly'
          else if (paymentsPerMonth >= 0.4) paymentFrequency = 'Bi-Monthly'
          else if (paymentsPerMonth >= 0.2) paymentFrequency = 'Quarterly'
        }

        setMemberStats({
          totalPayments,
          totalAmount,
          averagePayment,
          lastPaymentDays,
          paymentFrequency,
          preferredMethod
        })
      }
    } catch (error) {
      console.error('Error fetching member stats:', error)
    }
  }

  const fetchPaymentMethodStats = async () => {
    try {
      // Fetch all payments for this gym to get method statistics
      const { data: allPayments } = await supabase
        .from('payments')
        .select('payment_mode, amount')
        .eq('gym_id', payment.gym_id)

      if (allPayments && allPayments.length > 0) {
        const methodStats = allPayments.reduce((acc, p) => {
          const method = p.payment_mode || 'Unknown'
          acc[method] = (acc[method] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const currentMethodCount = methodStats[payment.payment_mode] || 0
        const methodPercentage = (currentMethodCount / allPayments.length) * 100
        
        // Calculate rank of this payment method
        const sortedMethods = Object.entries(methodStats)
          .sort((a, b) => b[1] - a[1])
        const methodRank = sortedMethods.findIndex(([method]) => method === payment.payment_mode) + 1

        setPaymentMethodStats({
          methodCount: currentMethodCount,
          methodPercentage,
          methodRank
        })
      }
    } catch (error) {
      console.error('Error fetching payment method stats:', error)
    }
  }

  const handleDeletePayment = async () => {
    if (!confirm(`Are you sure you want to delete this payment of ₹${payment.amount.toLocaleString('en-IN')}?`)) {
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', payment.id)

      if (error) throw error

      onPaymentUpdated()
      onClose()
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Failed to delete payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicatePayment = () => {
    // Create URL with pre-filled data for new payment
    const params = new URLSearchParams({
      member_id: payment.member_id,
      amount: payment.amount.toString(),
      payment_mode: payment.payment_mode,
      notes: payment.notes || ''
    })
    window.open(`/payments/record?${params.toString()}`, '_blank')
  }

  const formatAmount = (amount: number) => `₹${amount.toLocaleString('en-IN')}`
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysAgo = (dateString: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'cash': 'bg-green-100 text-green-800 border-green-200',
      'card': 'bg-blue-100 text-blue-800 border-blue-200',
      'upi': 'bg-purple-100 text-purple-800 border-purple-200',
      'bank_transfer': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'cheque': 'bg-orange-100 text-orange-800 border-orange-200',
      'online': 'bg-pink-100 text-pink-800 border-pink-200'
    }
    return colors[method.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white hover:bg-white/10 rounded-full p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
              <Receipt className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Payment Details</h2>
              <p className="text-blue-100 mt-1">
                Transaction #{payment.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Payment Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Main Payment Info */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                  <CardTitle className="flex items-center text-green-800">
                    <IndianRupee className="h-5 w-5 mr-2" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {formatAmount(payment.amount)}
                    </p>
                    <p className="text-gray-600 mt-1">Payment Amount</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Calendar className="h-4 w-4 text-blue-600 mr-1" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(payment.payment_date)}</p>
                      <p className="text-xs text-gray-500">{getDaysAgo(payment.payment_date)}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CreditCard className="h-4 w-4 text-purple-600 mr-1" />
                      </div>
                      <Badge className={getPaymentMethodColor(payment.payment_mode)}>
                        {payment.payment_mode}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">Payment Method</p>
                    </div>
                  </div>

                  {payment.notes && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <FileText className="h-4 w-4 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Notes</span>
                      </div>
                      <p className="text-sm text-gray-600">{payment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Member Information */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center text-blue-800">
                    <User className="h-5 w-5 mr-2" />
                    Member Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {payment.members?.custom_fields?.full_name || 'Unknown Member'}
                      </p>
                      <p className="text-sm text-gray-500">Member ID: {payment.member_id.slice(-8)}</p>
                    </div>
                  </div>

                  {payment.members?.custom_fields?.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{payment.members.custom_fields.phone}</span>
                    </div>
                  )}

                  {payment.members?.custom_fields?.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{payment.members.custom_fields.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Member Payment Analytics */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-indigo-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Member Analytics</span>
                    </div>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Total Payments:</span>
                      <span className="text-xs font-medium">{memberStats.totalPayments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Total Amount:</span>
                      <span className="text-xs font-medium">{formatAmount(memberStats.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Average:</span>
                      <span className="text-xs font-medium">{formatAmount(memberStats.averagePayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Frequency:</span>
                      <span className="text-xs font-medium">{memberStats.paymentFrequency}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Analytics */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Method Analytics</span>
                    </div>
                    <Target className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Method Usage:</span>
                      <span className="text-xs font-medium">{paymentMethodStats.methodCount} times</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Popularity:</span>
                      <span className="text-xs font-medium">{paymentMethodStats.methodPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Rank:</span>
                      <span className="text-xs font-medium">#{paymentMethodStats.methodRank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Preferred:</span>
                      <span className="text-xs font-medium">{memberStats.preferredMethod}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Analytics */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Transaction Info</span>
                    </div>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Days Ago:</span>
                      <span className="text-xs font-medium">{Math.floor((new Date().getTime() - new Date(payment.payment_date).getTime()) / (1000 * 60 * 60 * 24))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Last Payment:</span>
                      <span className="text-xs font-medium">{memberStats.lastPaymentDays} days ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Created:</span>
                      <span className="text-xs font-medium">{new Date(payment.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Status:</span>
                      <span className="text-xs font-medium text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                <CardTitle className="flex items-center text-gray-800">
                  <Settings className="h-5 w-5 mr-2" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleDuplicatePayment}
                    variant="outline"
                    className="flex items-center hover:bg-blue-50 border-blue-200"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Payment
                  </Button>
                  
                  <Button
                    onClick={() => window.open(`/payments/record?member_id=${payment.member_id}`, '_blank')}
                    variant="outline"
                    className="flex items-center hover:bg-green-50 border-green-200"
                  >
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Record New Payment
                  </Button>
                  
                  <Button
                    onClick={() => window.open(`/members/${payment.member_id}`, '_blank')}
                    variant="outline"
                    className="flex items-center hover:bg-purple-50 border-purple-200"
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Member Profile
                  </Button>
                  
                  <Button
                    onClick={handleDeletePayment}
                    variant="outline"
                    disabled={loading}
                    className="flex items-center hover:bg-red-50 border-red-200 text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {loading ? 'Deleting...' : 'Delete Payment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}