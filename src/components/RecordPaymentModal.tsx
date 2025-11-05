'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Save, 
  CreditCard, 
  Calendar, 
  IndianRupee,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { sendPaymentConfirmationWhatsApp } from '@/lib/whatsapp-helpers'

interface Member {
  id: string
  user_id: string
  gym_id: string
  plan_id: string
  start_date: string
  end_date: string
  status: 'active' | 'inactive' | 'expired' | 'suspended'
  custom_fields: {
    full_name?: string
    phone?: string
    email?: string
    dateOfBirth?: string
    gender?: string
    address?: string
    pincode?: string
    emergencyContact?: string
    emergencyPhone?: string
  } | null
  created_at: string
  updated_at: string
  membership_plans?: {
    name: string
    price: number
    duration_days: number
  }
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
      paid_amount?: number
    }>
  } | null
}

interface RecordPaymentModalProps {
  member: Member | null
  isOpen: boolean
  onClose: () => void
  onPaymentRecorded: () => void
}

export default function RecordPaymentModal({ 
  member, 
  isOpen, 
  onClose, 
  onPaymentRecorded 
}: RecordPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  })

  // Auto-fill amount with next installment when modal opens
  useEffect(() => {
    if (member && isOpen) {
      if (member.installment_plan?.enabled) {
        const nextUnpaid = member.installment_plan.installments.find(i => !i.paid)
        if (nextUnpaid) {
          setFormData(prev => ({
            ...prev,
            amount: nextUnpaid.amount.toString()
          }))
        }
      }
    }
  }, [member, isOpen])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }


  const handleSave = async () => {
    if (!member || !formData.amount) return

    setLoading(true)
    try {
      // Insert payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          member_id: member.id,
          gym_id: member.gym_id,
          amount: parseFloat(formData.amount),
          payment_date: formData.payment_date,
          payment_mode: formData.payment_method
        })
        .select()
        .single()

      if (paymentError) {
        console.error('Error recording payment:', paymentError)
        console.error('Error details:', JSON.stringify(paymentError, null, 2))
        alert(`Failed to record payment: ${paymentError.message || 'Please try again.'}`)
        return
      }

      console.log('✅ Payment recorded successfully:', paymentData)

      // Send WhatsApp payment confirmation
      if (member.custom_fields?.phone && paymentData) {
        console.log('📱 Sending WhatsApp payment confirmation...')
        try {
          const whatsappResult = await sendPaymentConfirmationWhatsApp({
            memberName: member.custom_fields?.full_name || 'Member',
            memberPhone: member.custom_fields.phone,
            amount: parseFloat(formData.amount),
            currency: '₹',
            paymentDate: new Date(formData.payment_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            receiptNumber: paymentData.id.slice(0, 8).toUpperCase(),
            paymentMethod: formData.payment_method,
            memberId: member.id,
            paymentId: paymentData.id,
          })

          if (whatsappResult.success) {
            console.log('✅ WhatsApp payment confirmation sent!')
          } else {
            console.warn('⚠️ WhatsApp failed (but payment recorded):', whatsappResult.error)
          }
        } catch (whatsappError) {
          console.warn('⚠️ WhatsApp error (but payment recorded):', whatsappError)
        }
      }

      // Auto-mark installment as paid and adjust future installments if needed
      if (member.installment_plan?.enabled && paymentData) {
        const nextUnpaid = member.installment_plan.installments.find(inst => !inst.paid)
        const paymentAmount = parseFloat(formData.amount)
        
        if (nextUnpaid) {
          const difference = paymentAmount - nextUnpaid.amount
          
          // Mark current installment as paid with actual amount
          let updatedInstallments = member.installment_plan.installments.map(inst => {
            if (inst.number === nextUnpaid.number) {
              return {
                ...inst,
                paid: true,
                paid_date: formData.payment_date,
                payment_id: paymentData.id,
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
                    amount: Math.max(0, inst.amount - difference)
                  }
                }
                return inst
              })
              
              console.log(`✅ Adjusted installment #${nextUnpaidAfterThis.number} by ₹${-difference}`)
            }
          }

          const updatedPlan = {
            ...member.installment_plan,
            installments: updatedInstallments
          }

          await supabase
            .from('members')
            .update({ installment_plan: updatedPlan })
            .eq('id', member.id)

          console.log('✅ Installment marked as paid')
        }
      }

      alert('Payment recorded successfully! 🎉')
      onPaymentRecorded()
      onClose()
      
      // Reset form
      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: ''
      })
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !member) return null

  const suggestedAmount = member.membership_plans?.price || 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Record Payment</h2>
                <p className="text-green-100">
                  For {member.custom_fields?.full_name || 'Member'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Member Info Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Current Plan:</span>
                  <p className="font-semibold">{member.membership_plans?.name || 'No Plan'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Plan Price:</span>
                  <p className="font-semibold text-green-600">₹{member.membership_plans?.price || 0}</p>
                </div>
                <div>
                  <span className="text-gray-600">Current End Date:</span>
                  <p className="font-semibold">{new Date(member.end_date).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className={
                    member.status === 'active' ? 'bg-green-100 text-green-800' :
                    member.status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IndianRupee className="h-5 w-5 mr-2 text-green-600" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="Enter amount"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment_date">Payment Date *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => handleInputChange('payment_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Installment Plan Info - Full Width */}
              {member.installment_plan?.enabled && (() => {
                const plan = member.installment_plan
                const paidInstallments = plan.installments.filter(i => i.paid)
                const nextUnpaid = plan.installments.find(i => !i.paid)
                const paidAmount = paidInstallments.reduce((sum, i) => sum + (i.paid_amount || i.amount), 0)
                const remainingAmount = plan.total_amount - paidAmount
                const progressPercentage = (paidInstallments.length / plan.num_installments) * 100
                
                return (
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 shadow-sm">
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
                            
                            return (
                              <div className={`rounded-lg p-3 border-2 mt-3 ${
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
                                          Paying ₹{Math.abs(difference).toLocaleString('en-IN')} less. Remaining will be added to next installment.
                                        </>
                                      ) : (
                                        <>
                                          Paying ₹{difference.toLocaleString('en-IN')} extra. Will reduce next installment.
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
                      </div>
                    )
                  })()}

              {!member.installment_plan?.enabled && suggestedAmount > 0 && (
                <button
                  type="button"
                  onClick={() => handleInputChange('amount', suggestedAmount.toString())}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Use plan amount: ₹{suggestedAmount}
                </button>
              )}

              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <select
                  id="payment_method"
                  value={formData.payment_method}
                  onChange={(e) => handleInputChange('payment_method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any notes about this payment"
                />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.amount}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}