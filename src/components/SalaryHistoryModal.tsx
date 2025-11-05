'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Calendar, IndianRupee, CreditCard, FileText, Download, TrendingUp, TrendingDown, History, Check } from 'lucide-react'

interface Staff {
  id: string
  user_id: string
  full_name?: string
  role?: string
  salary?: number
}

interface SalaryPayment {
  id: string
  amount: number
  payment_date: string
  payment_month: number
  payment_year: number
  payment_mode: string
  transaction_id?: string
  bonus_amount: number
  deduction_amount: number
  deduction_reason?: string
  notes?: string
  status: string
  created_at: string
}

interface SalaryHistoryModalProps {
  staff: Staff
  gymId: string
  onClose: () => void
}

export default function SalaryHistoryModal({ staff, gymId, onClose }: SalaryHistoryModalProps) {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<SalaryPayment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<SalaryPayment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState('all')

  useEffect(() => {
    fetchPaymentHistory()
  }, [staff.id, gymId])

  useEffect(() => {
    filterPayments()
  }, [payments, selectedYear, selectedMonth])

  const fetchPaymentHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('staff_salary_payments')
        .select('*')
        .eq('staff_id', staff.user_id)
        .eq('gym_id', gymId)
        .order('payment_date', { ascending: false })

      if (fetchError) throw fetchError

      setPayments(data || [])
    } catch (err: any) {
      console.error('❌ Error fetching payment history:', err)
      setError(err.message || 'Failed to load payment history')
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]

    if (selectedYear !== 'all') {
      filtered = filtered.filter(p => p.payment_year.toString() === selectedYear)
    }

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(p => p.payment_month.toString() === selectedMonth)
    }

    setFilteredPayments(filtered)
  }

  const calculateTotalPaid = () => {
    return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  const calculateTotalBonus = () => {
    return filteredPayments.reduce((sum, payment) => sum + payment.bonus_amount, 0)
  }

  const calculateTotalDeductions = () => {
    return filteredPayments.reduce((sum, payment) => sum + payment.deduction_amount, 0)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return '💵'
      case 'UPI':
        return '📱'
      case 'Bank Transfer':
        return '🏦'
      case 'Cheque':
        return '📝'
      case 'Card':
        return '💳'
      default:
        return '💰'
    }
  }

  const getPaymentModeColor = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return 'bg-green-100 text-green-800'
      case 'UPI':
        return 'bg-blue-100 text-blue-800'
      case 'Bank Transfer':
        return 'bg-purple-100 text-purple-800'
      case 'Cheque':
        return 'bg-yellow-100 text-yellow-800'
      case 'Card':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Payment Date',
      'Month/Year',
      'Base Amount',
      'Bonus',
      'Deductions',
      'Total Amount',
      'Payment Mode',
      'Transaction ID',
      'Notes'
    ]

    const csvRows = filteredPayments.map(payment => [
      new Date(payment.payment_date).toLocaleDateString('en-IN'),
      `${monthNames[payment.payment_month - 1]} ${payment.payment_year}`,
      payment.amount - payment.bonus_amount + payment.deduction_amount,
      payment.bonus_amount,
      payment.deduction_amount,
      payment.amount,
      payment.payment_mode,
      payment.transaction_id || 'N/A',
      payment.notes || 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${staff.full_name?.replace(/\s+/g, '-')}-salary-history-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get available years from payment data
  const availableYears = Array.from(new Set(payments.map(p => p.payment_year))).sort((a, b) => b - a)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white relative sticky top-0 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <History size={28} />
            Salary Payment History
          </CardTitle>
          <CardDescription className="text-white/90 text-base">
            {staff.full_name} - {staff.role}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-600 mb-1">Total Payments</p>
                <p className="text-2xl font-bold text-blue-900">{filteredPayments.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-600 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-green-900">
                  ₹{calculateTotalPaid().toLocaleString('en-IN')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-4">
                <p className="text-sm text-emerald-600 mb-1">Total Bonus</p>
                <p className="text-2xl font-bold text-emerald-900">
                  ₹{calculateTotalBonus().toLocaleString('en-IN')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <p className="text-sm text-red-600 mb-1">Total Deductions</p>
                <p className="text-2xl font-bold text-red-900">
                  ₹{calculateTotalDeductions().toLocaleString('en-IN')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="all">All Months</option>
                {monthNames.map((month, index) => (
                  <option key={index + 1} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={exportToCSV}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-6"
              disabled={filteredPayments.length === 0}
            >
              <Download size={18} />
              Export CSV
            </Button>
          </div>

          {/* Payment History List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading payment history...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              {error}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <History size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No salary payments recorded yet</p>
              <p className="text-sm text-gray-500 mt-2">Payment history will appear here once recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      {/* Left Section */}
                      <div className="flex-1 min-w-[250px]">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="bg-indigo-100 rounded-full p-2">
                            <Calendar size={20} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg text-gray-900">
                              {monthNames[payment.payment_month - 1]} {payment.payment_year}
                            </p>
                            <p className="text-sm text-gray-500">
                              Paid on {new Date(payment.payment_date).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Base Salary</p>
                            <p className="font-semibold text-gray-900">
                              ₹{(payment.amount - payment.bonus_amount + payment.deduction_amount).toLocaleString('en-IN')}
                            </p>
                          </div>
                          
                          {payment.bonus_amount > 0 && (
                            <div>
                              <p className="text-green-600 flex items-center gap-1">
                                <TrendingUp size={14} />
                                Bonus
                              </p>
                              <p className="font-semibold text-green-700">
                                +₹{payment.bonus_amount.toLocaleString('en-IN')}
                              </p>
                            </div>
                          )}
                          
                          {payment.deduction_amount > 0 && (
                            <div>
                              <p className="text-red-600 flex items-center gap-1">
                                <TrendingDown size={14} />
                                Deduction
                              </p>
                              <p className="font-semibold text-red-700">
                                -₹{payment.deduction_amount.toLocaleString('en-IN')}
                              </p>
                            </div>
                          )}
                        </div>

                        {payment.deduction_reason && (
                          <p className="text-xs text-red-600 mt-2 bg-red-50 px-2 py-1 rounded">
                            Reason: {payment.deduction_reason}
                          </p>
                        )}
                      </div>

                      {/* Right Section */}
                      <div className="text-right">
                        <div className="mb-3">
                          <p className="text-sm text-gray-500 mb-1">Total Paid</p>
                          <p className="text-2xl font-bold text-indigo-600">
                            ₹{payment.amount.toLocaleString('en-IN')}
                          </p>
                        </div>

                        <Badge className={`${getPaymentModeColor(payment.payment_mode)} mb-2`}>
                          <span className="mr-1">{getPaymentModeIcon(payment.payment_mode)}</span>
                          {payment.payment_mode}
                        </Badge>

                        {payment.transaction_id && (
                          <p className="text-xs text-gray-500 mt-2">
                            Ref: {payment.transaction_id}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-1 text-green-600 text-xs">
                          <Check size={14} />
                          <span className="font-medium">Paid</span>
                        </div>
                      </div>
                    </div>

                    {payment.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <FileText size={12} />
                          Notes:
                        </p>
                        <p className="text-sm text-gray-700">{payment.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
