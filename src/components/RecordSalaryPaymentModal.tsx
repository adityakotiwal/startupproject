'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, IndianRupee, Calendar, CreditCard, FileText, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface Staff {
  id: string
  user_id: string
  full_name?: string
  phone?: string
  email?: string
  role?: string
  salary?: number
  status: 'Active' | 'Inactive' | 'Terminated'
}

interface RecordSalaryPaymentModalProps {
  staff: Staff
  gymId: string
  onClose: () => void
  onSuccess: () => void
}

export default function RecordSalaryPaymentModal({ staff, gymId, onClose, onSuccess }: RecordSalaryPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get current month and year
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  // Form state
  const [formData, setFormData] = useState({
    amount: staff.salary?.toString() || '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMonth: currentMonth.toString(),
    paymentYear: currentYear.toString(),
    paymentMode: 'Cash',
    transactionId: '',
    bonusAmount: '',
    deductionAmount: '',
    deductionReason: '',
    notes: ''
  })

  // Check if salary for this month/year already paid
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  const [existingPayment, setExistingPayment] = useState<any>(null)

  useEffect(() => {
    checkExistingPayment()
  }, [formData.paymentMonth, formData.paymentYear])

  const checkExistingPayment = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_salary_payments')
        .select('*')
        .eq('staff_id', staff.user_id)
        .eq('gym_id', gymId)
        .eq('payment_month', parseInt(formData.paymentMonth))
        .eq('payment_year', parseInt(formData.paymentYear))
        .eq('status', 'Paid')
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        setAlreadyPaid(true)
        setExistingPayment(data)
      } else {
        setAlreadyPaid(false)
        setExistingPayment(null)
      }
    } catch (err) {
      console.error('Error checking existing payment:', err)
    }
  }

  const calculateTotalAmount = () => {
    const baseAmount = parseFloat(formData.amount) || 0
    const bonus = parseFloat(formData.bonusAmount) || 0
    const deduction = parseFloat(formData.deductionAmount) || 0
    return baseAmount + bonus - deduction
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const baseAmount = parseFloat(formData.amount)
      const bonusAmount = parseFloat(formData.bonusAmount) || 0
      const deductionAmount = parseFloat(formData.deductionAmount) || 0
      const totalAmount = calculateTotalAmount()

      if (isNaN(baseAmount) || baseAmount <= 0) {
        setError('Please enter a valid salary amount')
        setLoading(false)
        return
      }

      if (totalAmount <= 0) {
        setError('Total amount after deductions cannot be zero or negative')
        setLoading(false)
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Insert salary payment record
      const { data, error: insertError } = await supabase
        .from('staff_salary_payments')
        .insert({
          staff_id: staff.user_id,
          gym_id: gymId,
          amount: totalAmount,
          payment_date: formData.paymentDate,
          payment_month: parseInt(formData.paymentMonth),
          payment_year: parseInt(formData.paymentYear),
          payment_mode: formData.paymentMode,
          transaction_id: formData.transactionId || null,
          bonus_amount: bonusAmount,
          deduction_amount: deductionAmount,
          deduction_reason: formData.deductionReason || null,
          notes: formData.notes || null,
          status: 'Paid',
          paid_by: user.id
        })
        .select()
        .single()

      if (insertError) throw insertError

      console.log('✅ Salary payment recorded successfully')

      // Send WhatsApp notification if phone number is available
      if (staff.phone && /^\d{10}$/.test(staff.phone.replace(/\D/g, ''))) {
        try {
          console.log('📱 Sending WhatsApp salary payment notification...')
          
          // Get gym name
          const { data: gym } = await supabase
            .from('gyms')
            .select('name')
            .eq('id', gymId)
            .single()

          const gymName = gym?.name || 'Our Gym'

          // Import template function
          const { generateSalaryPaidNotification } = await import('@/lib/whatsapp-templates')

          // Generate salary paid message
          const message = generateSalaryPaidNotification({
            staffName: staff.full_name || 'Team Member',
            gymName: gymName,
            month: monthNames[parseInt(formData.paymentMonth) - 1],
            year: parseInt(formData.paymentYear),
            amount: totalAmount,
            paymentDate: new Date(formData.paymentDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            paymentMode: formData.paymentMode
          })

          // Get session token
          const { data: { session } } = await supabase.auth.getSession()
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }
          
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
          }

          // Send WhatsApp message
          const response = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              to: staff.phone.replace(/\D/g, ''),
              message,
              messageType: 'staff_salary_paid',
              metadata: {
                staff_id: staff.user_id,
                payment_month: formData.paymentMonth,
                payment_year: formData.paymentYear,
                amount: totalAmount
              },
            }),
          })

          if (response.ok) {
            console.log('✅ WhatsApp salary notification sent successfully!')
          } else {
            const error = await response.json()
            console.error('❌ Failed to send WhatsApp:', error)
          }
        } catch (whatsappError) {
          console.error('❌ WhatsApp notification error (non-critical):', whatsappError)
          // Don't block the payment process if WhatsApp fails
        }
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('❌ Error recording salary payment:', err)
      setError(err.message || 'Failed to record salary payment')
    } finally {
      setLoading(false)
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <DollarSign size={28} />
            Record Salary Payment
          </CardTitle>
          <CardDescription className="text-white/90 text-base">
            For {staff.full_name || 'Staff Member'}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* Staff Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Staff Name</p>
                <p className="font-semibold text-gray-900">{staff.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-semibold text-gray-900">{staff.role || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Salary</p>
                <p className="font-semibold text-gray-900">₹{staff.salary?.toLocaleString('en-IN') || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {staff.status}
                </span>
              </div>
            </div>
          </div>

          {/* Already Paid Warning */}
          {alreadyPaid && existingPayment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 mt-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-yellow-800">Salary Already Paid</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Salary for {monthNames[existingPayment.payment_month - 1]} {existingPayment.payment_year} has already been paid on {new Date(existingPayment.payment_date).toLocaleDateString('en-IN')}.
                    Amount: ₹{existingPayment.amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-yellow-600 mt-2">
                    You can still record another payment if needed (e.g., bonus, arrears, etc.)
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMonth" className="flex items-center gap-2 text-gray-900 font-semibold">
                  <Calendar size={16} />
                  Payment Month *
                </Label>
                <select
                  id="paymentMonth"
                  value={formData.paymentMonth}
                  onChange={(e) => setFormData({ ...formData, paymentMonth: e.target.value })}
                  className="w-full mt-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  required
                >
                  {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="paymentYear" className="flex items-center gap-2 text-gray-900 font-semibold">
                  <Calendar size={16} />
                  Payment Year *
                </Label>
                <select
                  id="paymentYear"
                  value={formData.paymentYear}
                  onChange={(e) => setFormData({ ...formData, paymentYear: e.target.value })}
                  className="w-full mt-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Base Amount and Payment Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="flex items-center gap-2 text-gray-900 font-semibold">
                  <IndianRupee size={16} />
                  Base Salary Amount *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-2 border-2 text-gray-900"
                  required
                />
              </div>

              <div>
                <Label htmlFor="paymentDate" className="flex items-center gap-2 text-gray-900 font-semibold">
                  <Calendar size={16} />
                  Payment Date *
                </Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="mt-2 border-2 text-gray-900"
                  required
                />
              </div>
            </div>

            {/* Bonus and Deduction */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bonusAmount" className="flex items-center gap-2 text-green-700 font-semibold">
                  <TrendingUp size={16} />
                  Bonus Amount
                </Label>
                <Input
                  id="bonusAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.bonusAmount}
                  onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                  className="mt-2 border-2 border-green-300 focus:ring-green-500 text-gray-900"
                />
                <p className="text-xs text-green-600 mt-1 font-medium">Add bonus/incentive amount</p>
              </div>

              <div>
                <Label htmlFor="deductionAmount" className="flex items-center gap-2 text-red-700 font-semibold">
                  <TrendingDown size={16} />
                  Deduction Amount
                </Label>
                <Input
                  id="deductionAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.deductionAmount}
                  onChange={(e) => setFormData({ ...formData, deductionAmount: e.target.value })}
                  className="mt-2 border-2 border-red-300 focus:ring-red-500 text-gray-900"
                />
                <p className="text-xs text-red-600 mt-1 font-medium">Any deductions (advance, penalties, etc.)</p>
              </div>
            </div>

            {/* Deduction Reason */}
            {formData.deductionAmount && parseFloat(formData.deductionAmount) > 0 && (
              <div>
                <Label htmlFor="deductionReason" className="text-gray-900 font-semibold">Deduction Reason</Label>
                <Input
                  id="deductionReason"
                  type="text"
                  placeholder="e.g., Advance taken, Late arrival penalty"
                  value={formData.deductionReason}
                  onChange={(e) => setFormData({ ...formData, deductionReason: e.target.value })}
                  className="mt-2 border-2 text-gray-900"
                />
              </div>
            )}

            {/* Total Amount Display */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">Total Payment Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{calculateTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Base Salary:</span>
                  <span>₹{(parseFloat(formData.amount) || 0).toLocaleString('en-IN')}</span>
                </div>
                {formData.bonusAmount && parseFloat(formData.bonusAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>+ Bonus:</span>
                    <span>₹{parseFloat(formData.bonusAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {formData.deductionAmount && parseFloat(formData.deductionAmount) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>- Deduction:</span>
                    <span>₹{parseFloat(formData.deductionAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Mode */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMode" className="flex items-center gap-2 text-gray-900 font-semibold">
                  <CreditCard size={16} />
                  Payment Mode *
                </Label>
                <select
                  id="paymentMode"
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  className="w-full mt-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="transactionId" className="text-gray-900 font-semibold">Transaction/Reference ID</Label>
                <Input
                  id="transactionId"
                  type="text"
                  placeholder="Optional"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  className="mt-2 border-2 text-gray-900"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="flex items-center gap-2 text-gray-900 font-semibold">
                <FileText size={16} />
                Notes (Optional)
              </Label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Any additional notes or comments..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full mt-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none text-gray-900"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Recording...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <DollarSign size={20} />
                    Record Payment
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
