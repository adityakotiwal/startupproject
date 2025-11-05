'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  CreditCard, 
  Receipt, 
  User, 
  IndianRupee,
  Search,
  Calendar,
  DollarSign,
  Smartphone,
  Building2,
  CheckCircle,
  AlertTriangle,
  Eye,
  Calculator,
  Target,
  Star,
  Award,
  TrendingUp,
  BarChart3,
  Clock,
  FileText,
  Users,
  Zap
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'

// 🔥 ENHANCED MEMBER INTERFACE FOR PAYMENTS 🔥
interface Member {
  id: string
  custom_fields: {
    full_name?: string
    phone?: string
    email?: string
  } | null
  membership_plans?: {
    name: string
    price: number
  }
  total_paid?: number
  payment_count?: number
  last_payment_date?: string
  installment_plan?: {
    enabled: boolean
    total_amount: number
    num_installments: number
    down_payment?: number
    installments: Array<{
      number: number
      amount: number
      due_date: string
      paid: boolean
      paid_date: string | null
      payment_id: string | null
    }>
  } | null
}

export default function RecordPaymentPage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isClient = useClientOnly()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showMemberPreview, setShowMemberPreview] = useState(false)
  
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // 🎯 PRE-POPULATE FROM URL PARAMS (for duplicate payment feature)
  useEffect(() => {
    const memberId = searchParams.get('member_id')
    const amount = searchParams.get('amount')
    const paymentMode = searchParams.get('payment_mode')
    const notes = searchParams.get('notes')
    
    if (memberId) {
      setFormData(prev => ({
        ...prev,
        memberId,
        amount: amount || prev.amount,
        paymentMethod: paymentMode || prev.paymentMethod,
        notes: notes || prev.notes
      }))
    }
  }, [searchParams])

  // 💪 ENHANCED MEMBER LOADING WITH PAYMENT ANALYTICS
  useEffect(() => {
    if (!isClient || !user || gymLoading || !gymId) {
      setMembersLoading(false)
      return
    }
    
    console.log('🚀 LOADING ENHANCED MEMBER DATA WITH PAYMENT ANALYTICS:', gymId)
    
    const loadMembersWithAnalytics = async () => {
      try {
        setMembersLoading(true)
        setError('')

        // Load members with payment analytics
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select(`
            id,
            custom_fields,
            installment_plan,
            membership_plans (
              name,
              price
            )
          `)
          .eq('gym_id', gymId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (membersError) throw membersError

        // Get payment analytics for each member
        const membersWithAnalytics = await Promise.all(
          (membersData || []).map(async (member) => {
            const { data: payments } = await supabase
              .from('payments')
              .select('amount, payment_date')
              .eq('gym_id', gymId)
              .eq('member_id', member.id)
              .order('payment_date', { ascending: false })

            const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
            const paymentCount = payments?.length || 0
            const lastPaymentDate = payments?.[0]?.payment_date

            return {
              ...member,
              membership_plans: Array.isArray(member.membership_plans) 
                ? member.membership_plans[0] 
                : member.membership_plans,
              total_paid: totalPaid,
              payment_count: paymentCount,
              last_payment_date: lastPaymentDate
            } as Member
          })
        )

        setMembers(membersWithAnalytics)
        console.log('✅ Enhanced members loaded with analytics:', membersWithAnalytics.length)

      } catch (error) {
        console.error('❌ Error loading enhanced members:', error)
        setError('Failed to load members')
      } finally {
        setMembersLoading(false)
      }
    }

    loadMembersWithAnalytics()
  }, [isClient, user, gymId, gymLoading])

  // 🔥 ENHANCED FORM SUBMISSION WITH VALIDATION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.memberId || !formData.amount) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Enhanced validation
      if (!gymId) {
        setError('No gym found. Please complete gym setup first.')
        return
      }

      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid positive amount')
        return
      }

      if (amount > 100000) {
        setError('Amount cannot exceed ₹1,00,000. Please contact admin for larger payments.')
        return
      }

      // Prepare enhanced payment data
      const paymentData = {
        gym_id: gymId,
        member_id: formData.memberId,
        amount: amount,
        payment_date: new Date(formData.paymentDate).toISOString(),
        payment_mode: formData.paymentMethod,
        notes: formData.notes || null
      }

      console.log('💾 Recording enhanced payment:', paymentData)

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([paymentData])
        .select('*')
        .single()

      if (paymentError) {
        console.error('❌ Payment creation error:', paymentError)
        setError(`Failed to record payment: ${paymentError.message}`)
        return
      }

      console.log('✅ Payment recorded successfully:', payment)

      // Auto-mark installment as paid and adjust future installments if needed
      if (selectedMember?.installment_plan?.enabled && payment) {
        const nextUnpaid = selectedMember.installment_plan.installments.find(inst => !inst.paid)
        const paymentAmount = parseFloat(formData.amount)
        
        if (nextUnpaid) {
          const difference = paymentAmount - nextUnpaid.amount
          
          // Mark current installment as paid with actual amount
          let updatedInstallments = selectedMember.installment_plan.installments.map(inst => {
            if (inst.number === nextUnpaid.number) {
              return {
                ...inst,
                paid: true,
                paid_date: formData.paymentDate,
                payment_id: payment.id,
                paid_amount: paymentAmount // Store actual amount paid
              }
            }
            return inst
          })

          // If there's a difference, adjust the next unpaid installment
          if (Math.abs(difference) > 0.5) {
            const nextUnpaidAfterThis = updatedInstallments.find(
              inst => !inst.paid && inst.number > nextUnpaid.number
            )
            
            if (nextUnpaidAfterThis) {
              updatedInstallments = updatedInstallments.map(inst => {
                if (inst.number === nextUnpaidAfterThis.number) {
                  return {
                    ...inst,
                    amount: Math.max(0, inst.amount - difference) // Subtract extra or add shortfall
                  }
                }
                return inst
              })
              
              console.log(`✅ Adjusted installment #${nextUnpaidAfterThis.number} by ₹${-difference}`)
            }
          }

          const updatedPlan = {
            ...selectedMember.installment_plan,
            installments: updatedInstallments
          }

          await supabase
            .from('members')
            .update({ installment_plan: updatedPlan })
            .eq('id', selectedMember.id)

          console.log('✅ Installment marked as paid')
        }
      }

      // Enhanced success notification
      const memberName = selectedMember?.custom_fields?.full_name || 'Member'
      
      // Success with analytics
      alert(`🎉 PAYMENT RECORDED SUCCESSFULLY! 

💰 Amount: ₹${amount.toLocaleString('en-IN')}
👤 Member: ${memberName}
💳 Method: ${formData.paymentMethod.toUpperCase()}
📅 Date: ${new Date(formData.paymentDate).toLocaleDateString('en-IN')}
📊 Total Paid by Member: ₹${((selectedMember?.total_paid || 0) + amount).toLocaleString('en-IN')}

Payment has been successfully added to the system! 🚀`)

      // Navigate back to payments
      router.push('/payments')

    } catch (error) {
      console.error('❌ Submission error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // 🎯 MEMBER SELECTION HANDLER
  const handleMemberSelect = (member: Member) => {
    setFormData(prev => ({ ...prev, memberId: member.id }))
    setSelectedMember(member)
    setShowMemberPreview(true)
    setMemberSearch('')
    
    // Auto-suggest amount based on installment plan or membership plan
    if (!formData.amount) {
      if (member.installment_plan?.enabled) {
        const nextUnpaid = member.installment_plan.installments.find(inst => !inst.paid)
        if (nextUnpaid) {
          setFormData(prev => ({ ...prev, amount: nextUnpaid.amount.toString() }))
        }
      } else if (member.membership_plans?.price) {
        setFormData(prev => ({ ...prev, amount: member.membership_plans!.price.toString() }))
      }
    }
  }

  // 💳 PAYMENT METHOD CONFIGURATIONS
  const paymentMethods = [
    { 
      id: 'cash', 
      label: 'Cash', 
      icon: DollarSign, 
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Physical cash payment'
    },
    { 
      id: 'card', 
      label: 'Card', 
      icon: CreditCard, 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Credit/Debit card'
    },
    { 
      id: 'upi', 
      label: 'UPI', 
      icon: Smartphone, 
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'UPI payment'
    },
    { 
      id: 'bank_transfer', 
      label: 'Bank Transfer', 
      icon: Building2, 
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      description: 'Direct bank transfer'
    },
    { 
      id: 'cheque', 
      label: 'Cheque', 
      icon: FileText, 
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      description: 'Cheque payment'
    },
    { 
      id: 'online', 
      label: 'Online', 
      icon: Target, 
      color: 'bg-pink-100 text-pink-800 border-pink-200',
      description: 'Online payment gateway'
    }
  ]

  // 🔍 FILTER MEMBERS BASED ON SEARCH
  const filteredMembers = members.filter(member => {
    const searchLower = memberSearch.toLowerCase()
    const name = member.custom_fields?.full_name?.toLowerCase() || ''
    const phone = member.custom_fields?.phone?.toLowerCase() || ''
    const email = member.custom_fields?.email?.toLowerCase() || ''
    return name.includes(searchLower) || phone.includes(searchLower) || email.includes(searchLower)
  })

  // 📊 CALCULATE FORM ANALYTICS
  const formAnalytics = {
    isValidAmount: formData.amount && parseFloat(formData.amount) > 0,
    suggestedAmount: selectedMember?.membership_plans?.price || 0,
    memberPaymentHistory: selectedMember?.payment_count || 0,
    lastPaymentDays: selectedMember?.last_payment_date 
      ? Math.floor((new Date().getTime() - new Date(selectedMember.last_payment_date).getTime()) / (1000 * 60 * 60 * 24))
      : null
  }

  // 🎨 RENDER FUNCTIONS
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

  if (loading && user && !gymLoading && !error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Recording payment...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Navigation Breadcrumb */}
            <div className="flex items-center space-x-2 pt-4 text-sm">
              <Link href="/dashboard" className="text-green-100 hover:text-white transition-colors">
                Dashboard
              </Link>
              <span className="text-green-300">/</span>
              <Link href="/payments" className="text-green-100 hover:text-white transition-colors">
                Payments
              </Link>
              <span className="text-green-300">/</span>
              <span className="text-white font-semibold">Record Payment</span>
            </div>
            
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <Link href="/payments">
                  <Button variant="outline" size="sm" className="bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-opacity-30">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Record Payment</h1>
                    <p className="text-green-100">Process member payment transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ❌ ERROR DISPLAY */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 👥 ENHANCED MEMBER SELECTION */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center text-blue-800">
                  <Users className="h-6 w-6 mr-3" />
                  Select Member
                  <Badge className="ml-3 bg-blue-100 text-blue-700">
                    {members.length} Active Members
                  </Badge>
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Choose the member for this payment transaction
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                
                {/* Member Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search members by name, phone, or email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-10 border-blue-200 focus:border-blue-500 text-lg"
                  />
                </div>

                {/* Selected Member Preview */}
                {selectedMember && showMemberPreview && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {selectedMember.custom_fields?.full_name || 'Unknown Member'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedMember.custom_fields?.phone} • {selectedMember.membership_plans?.name || 'No Plan'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Total Paid</div>
                        <div className="font-semibold text-green-600">
                          ₹{(selectedMember.total_paid || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {selectedMember.payment_count} payments
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Member Selection List */}
                {memberSearch && (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {membersLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-500">Loading members...</p>
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No members found matching your search</p>
                      </div>
                    ) : (
                      filteredMembers.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => handleMemberSelect(member)}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member.custom_fields?.full_name || 'Unknown'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.custom_fields?.phone} • {member.membership_plans?.name || 'No Plan'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-green-600">
                                ₹{(member.total_paid || 0).toLocaleString('en-IN')}
                              </div>
                              <div className="text-xs text-gray-400">
                                {member.payment_count} payments
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 💰 ENHANCED PAYMENT DETAILS */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                <CardTitle className="flex items-center text-emerald-800">
                  <IndianRupee className="h-6 w-6 mr-3" />
                  Payment Details
                  {formAnalytics.isValidAmount && (
                    <Badge className="ml-3 bg-emerald-100 text-emerald-700">
                      Valid Amount
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Amount Input with Smart Suggestions */}
                <div>
                  <Label htmlFor="amount" className="text-base font-medium text-gray-700">
                    Payment Amount *
                  </Label>
                  <div className="mt-2 relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="pl-8 text-lg font-medium border-emerald-200 focus:border-emerald-500"
                      required
                    />
                  </div>
                  
                  {/* Installment Plan Info */}
                  {selectedMember?.installment_plan?.enabled && (() => {
                    const plan = selectedMember.installment_plan
                    const paidInstallments = plan.installments.filter(i => i.paid)
                    const nextUnpaid = plan.installments.find(i => !i.paid)
                    const paidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0)
                    const remainingAmount = plan.total_amount - paidAmount
                    const progressPercentage = (paidInstallments.length / plan.num_installments) * 100
                    
                    return (
                      <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="bg-blue-600 p-2 rounded-lg">
                              <IndianRupee className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-blue-800 text-sm">Installment Plan Active</p>
                              <p className="text-xs text-blue-600">
                                {paidInstallments.length}/{plan.num_installments} Paid ({Math.round(progressPercentage)}%)
                              </p>
                            </div>
                          </div>
                          {plan.down_payment && plan.down_payment > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-bold">
                              💰 Down Payment
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Amount Summary */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-white rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-600 font-semibold">Total</p>
                            <p className="text-sm font-bold text-gray-800">₹{plan.total_amount.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                            <p className="text-xs text-green-700 font-semibold">Paid</p>
                            <p className="text-sm font-bold text-green-600">₹{paidAmount.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-200">
                            <p className="text-xs text-orange-700 font-semibold">Remaining</p>
                            <p className="text-sm font-bold text-orange-600">₹{remainingAmount.toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Next Installment */}
                        {nextUnpaid && (
                          <div className="bg-white rounded-lg p-3 border-2 border-blue-200">
                            <p className="text-xs text-gray-600 font-semibold mb-1">Next Payment Due:</p>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-blue-700">
                                  Installment #{nextUnpaid.number}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Due: {new Date(nextUnpaid.due_date).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                              <p className="text-lg font-bold text-blue-600">
                                ₹{nextUnpaid.amount.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Smart Payment Amount Warning */}
                        {nextUnpaid && formData.amount && (() => {
                          const enteredAmount = parseFloat(formData.amount)
                          const difference = enteredAmount - nextUnpaid.amount
                          
                          if (Math.abs(difference) > 0.5) {
                            const isLess = difference < 0
                            const isMore = difference > 0
                            
                            return (
                              <div className={`rounded-lg p-3 border-2 ${
                                isLess ? 'bg-amber-50 border-amber-300' : 'bg-purple-50 border-purple-300'
                              }`}>
                                <div className="flex items-start space-x-2">
                                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                                    isLess ? 'text-amber-600' : 'text-purple-600'
                                  }`} />
                                  <div className="flex-1">
                                    <p className={`font-bold text-sm ${
                                      isLess ? 'text-amber-800' : 'text-purple-800'
                                    }`}>
                                      {isLess ? '⚠️ Partial Payment' : '💡 Extra Payment'}
                                    </p>
                                    <p className="text-xs text-gray-700 mt-1">
                                      {isLess ? (
                                        <>
                                          You're paying <span className="font-bold">₹{Math.abs(difference).toLocaleString('en-IN')} less</span> than installment #{nextUnpaid.number}.
                                          <br />
                                          <span className="text-amber-700 font-semibold">
                                            ✓ This installment will be marked as paid
                                            <br />
                                            ✓ Remaining ₹{Math.abs(difference).toLocaleString('en-IN')} will be added to next installment
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          You're paying <span className="font-bold">₹{difference.toLocaleString('en-IN')} extra</span>.
                                          <br />
                                          <span className="text-purple-700 font-semibold">
                                            ✓ This installment will be marked as paid
                                            <br />
                                            ✓ Extra ₹{difference.toLocaleString('en-IN')} will reduce next installment
                                          </span>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        })()}

                        {paidInstallments.length === plan.num_installments && (
                          <div className="bg-green-50 rounded-lg p-3 border-2 border-green-300 flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <p className="text-sm font-bold text-green-800">
                              🎉 All installments paid!
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Smart Suggestions for non-installment members */}
                  {!selectedMember?.installment_plan?.enabled && formAnalytics.suggestedAmount > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, amount: formAnalytics.suggestedAmount.toString() }))}
                        className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
                      >
                        Membership: ₹{formAnalytics.suggestedAmount.toLocaleString()}
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Method Selection */}
                <div>
                  <Label className="text-base font-medium text-gray-700 mb-3 block">
                    Payment Method *
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {paymentMethods.map((method) => {
                      const IconComponent = method.icon
                      const isSelected = formData.paymentMethod === method.id
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                          className={`${method.color} ${isSelected ? 'ring-2 ring-emerald-500 scale-105' : ''} 
                                    border rounded-xl p-4 text-left transition-all hover:scale-105`}
                        >
                          <div className="flex items-center space-x-3">
                            <IconComponent className="h-5 w-5" />
                            <div>
                              <div className="font-medium text-sm">{method.label}</div>
                              <div className="text-xs opacity-75">{method.description}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 mt-2 text-emerald-600" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Payment Date */}
                <div>
                  <Label htmlFor="paymentDate" className="text-base font-medium text-gray-700">
                    Payment Date *
                  </Label>
                  <div className="mt-2 relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                      className="pl-10 border-emerald-200 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-base font-medium text-gray-700">
                    Payment Notes (Optional)
                  </Label>
                  <div className="mt-2 relative">
                    <FileText className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                    <textarea
                      id="notes"
                      placeholder="Add any notes about this payment..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full pl-10 pt-3 pb-3 pr-3 border border-emerald-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 📊 PAYMENT PREVIEW */}
            {formData.amount && selectedMember && (
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                  <CardTitle className="flex items-center text-purple-800">
                    <Eye className="h-6 w-6 mr-3" />
                    Payment Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Member:</span>
                        <span className="font-medium">{selectedMember.custom_fields?.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-bold text-emerald-600 text-lg">
                          ₹{parseFloat(formData.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium capitalize">{formData.paymentMethod.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {new Date(formData.paymentDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Previous Total:</span>
                        <span className="font-medium">
                          ₹{(selectedMember.total_paid || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">New Total:</span>
                        <span className="font-bold text-blue-600 text-lg">
                          ₹{((selectedMember.total_paid || 0) + parseFloat(formData.amount)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Count:</span>
                        <span className="font-medium">{(selectedMember.payment_count || 0) + 1}</span>
                      </div>
                      {formAnalytics.lastPaymentDays !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Payment:</span>
                          <span className="font-medium">{formAnalytics.lastPaymentDays} days ago</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 🚀 ENHANCED SUBMIT BUTTON */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/payments')}
                className="px-8 py-3 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.memberId || !formData.amount}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recording...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Record Payment
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