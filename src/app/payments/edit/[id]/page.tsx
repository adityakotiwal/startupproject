'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Receipt, 
  Save, 
  ArrowLeft,
  IndianRupee,
  Calendar,
  CreditCard,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import { useGymContext } from '@/hooks/useGymContext'

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

interface Member {
  id: string
  custom_fields: {
    full_name?: string
    phone?: string
    email?: string
  } | null
}

export default function EditPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const paymentId = params.id as string
  const { currentGym, gymId } = useGymContext()
  const isClient = useClientOnly()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_date: '',
    payment_mode: 'Cash',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const paymentModes = [
    'Cash',
    'Card',
    'UPI',
    'Bank Transfer',
    'Net Banking',
    'Cheque',
    'Digital Wallet',
    'Other'
  ]

  useEffect(() => {
    if (paymentId && gymId) {
      fetchPayment()
      fetchMembers()
    }
  }, [paymentId, gymId])

  const fetchPayment = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          members:member_id (
            id,
            custom_fields
          )
        `)
        .eq('id', paymentId)
        .eq('gym_id', gymId)
        .single()

      if (error) {
        console.error('Error fetching payment:', error)
        alert('Payment not found or access denied.')
        router.push('/payments')
        return
      }

      if (data) {
        setPayment(data)
        setFormData({
          member_id: data.member_id,
          amount: data.amount.toString(),
          payment_date: data.payment_date,
          payment_mode: data.payment_mode,
          notes: data.notes || ''
        })
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error loading payment. Redirecting to payments page.')
      router.push('/payments')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, custom_fields')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching members:', error)
        return
      }

      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.member_id) {
      newErrors.member_id = 'Please select a member'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0'
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment date is required'
    }

    // Check if payment date is not in the future
    const paymentDate = new Date(formData.payment_date)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Set to end of today
    
    if (paymentDate > today) {
      newErrors.payment_date = 'Payment date cannot be in the future'
    }

    if (!formData.payment_mode) {
      newErrors.payment_mode = 'Please select a payment mode'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const updateData = {
        member_id: formData.member_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_mode: formData.payment_mode,
        notes: formData.notes.trim() || null
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .eq('gym_id', gymId) // Extra security check

      if (error) {
        console.error('Error updating payment:', error)
        alert('Error updating payment. Please try again.')
      } else {
        alert('Payment updated successfully!')
        router.push('/payments')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating payment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getPaymentModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      'Cash': '#10B981',
      'Card': '#3B82F6',
      'UPI': '#8B5CF6',
      'Bank Transfer': '#6366F1',
      'Net Banking': '#06B6D4',
      'Cheque': '#F59E0B',
      'Digital Wallet': '#EC4899',
      'Other': '#6B7280'
    }
    return colors[mode] || '#6B7280'
  }

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  if (!isClient) return null

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading payment...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!payment) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Not Found</h2>
            <p className="text-gray-600 mb-6">The payment you're looking for doesn't exist or you don't have access to it.</p>
            <Link href="/payments">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payments
              </Button>
            </Link>
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
                <Link href="/dashboard" className="flex items-center space-x-2 text-green-600 hover:text-green-800">
                  <Receipt className="h-8 w-8" />
                  <span className="text-2xl font-bold">GymSync Pro</span>
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {currentGym?.name || 'Loading gym...'}
                </span>
                <Link href="/payments">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Payments
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header with Gradient */}
          <div className="relative mb-8 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700"></div>
            <div className="relative px-8 py-12 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                      <Edit className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Edit Payment</h1>
                  </div>
                  <p className="text-green-100 text-lg font-medium">
                    Update payment details for {payment.members?.custom_fields?.full_name || 'Unknown Member'}
                  </p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-200" />
                      <span className="text-green-100 text-sm">Amount: {formatAmount(payment.amount)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-green-200" />
                      <span className="text-green-100 text-sm">Date: {new Date(payment.payment_date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                    <Receipt className="h-16 w-16 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center text-xl">
                  <User className="h-6 w-6 mr-2 text-green-600" />
                  Member Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="member_id" className="text-sm font-medium text-gray-700">
                      Select Member *
                    </Label>
                    <select
                      id="member_id"
                      value={formData.member_id}
                      onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select a member</option>
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.custom_fields?.full_name || 'Unknown Member'} 
                          {member.custom_fields?.phone && ` - ${member.custom_fields.phone}`}
                        </option>
                      ))}
                    </select>
                    {errors.member_id && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.member_id}
                      </p>
                    )}
                  </div>
                  
                  {/* Current member info display */}
                  {payment.members && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Current Member Information</h4>
                      <div className="text-sm text-blue-800">
                        <p><strong>Name:</strong> {payment.members.custom_fields?.full_name || 'Unknown'}</p>
                        {payment.members.custom_fields?.phone && (
                          <p><strong>Phone:</strong> {payment.members.custom_fields.phone}</p>
                        )}
                        {payment.members.custom_fields?.email && (
                          <p><strong>Email:</strong> {payment.members.custom_fields.email}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center text-xl">
                  <IndianRupee className="h-6 w-6 mr-2 text-blue-600" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                      Amount (₹) *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Enter amount"
                      className="mt-1"
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="payment_date" className="text-sm font-medium text-gray-700">
                      Payment Date *
                    </Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="mt-1"
                    />
                    {errors.payment_date && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.payment_date}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Payment Mode *
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {paymentModes.map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_mode: mode })}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                          formData.payment_mode === mode
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <CreditCard className="h-4 w-4 mx-auto mb-1" />
                        {mode}
                      </button>
                    ))}
                  </div>
                  {errors.payment_mode && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.payment_mode}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center text-xl">
                  <FileText className="h-6 w-6 mr-2 text-purple-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </Label>
                  <textarea
                    id="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any additional notes about this payment..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center pt-6">
              <Link href="/payments">
                <Button type="button" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}