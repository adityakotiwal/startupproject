'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  RefreshCw, 
  Calendar,
  IndianRupee,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { generateMembershipUpgrade } from '@/lib/whatsapp-templates'

interface Member {
  id: string
  gym_id: string
  custom_fields: {
    full_name?: string
    phone?: string
  } | null
  membership_plans?: {
    name: string
    price: number
    duration_days: number
  }
  installment_plan?: {
    enabled: boolean
    num_installments: number
    down_payment?: number
  } | null
  end_date: string
}

interface MembershipPlan {
  id: string
  name: string
  price: number
  duration_days: number
}

interface RenewMembershipModalProps {
  member: Member | null
  isOpen: boolean
  onClose: () => void
  onRenewed: () => void
  membershipPlans: MembershipPlan[]
}

export default function RenewMembershipModal({ 
  member, 
  isOpen, 
  onClose, 
  onRenewed,
  membershipPlans 
}: RenewMembershipModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [enableInstallments, setEnableInstallments] = useState(false)
  const [numInstallments, setNumInstallments] = useState(3)
  const [downPayment, setDownPayment] = useState(0)

  useEffect(() => {
    if (member && isOpen) {
      // Pre-select current plan
      const currentPlan = membershipPlans.find(p => p.name === member.membership_plans?.name)
      if (currentPlan) {
        setSelectedPlanId(currentPlan.id)
      }
      
      // Pre-fill installment settings if member has installment plan
      if (member.installment_plan?.enabled) {
        setEnableInstallments(true)
        setNumInstallments(member.installment_plan.num_installments)
        setDownPayment(member.installment_plan.down_payment || 0)
      } else {
        setEnableInstallments(false)
        setNumInstallments(3)
        setDownPayment(0)
      }
    }
  }, [member, isOpen, membershipPlans])

  const selectedPlan = membershipPlans.find(p => p.id === selectedPlanId)
  const planPrice = selectedPlan?.price || 0
  const remainingAmount = planPrice - downPayment
  const installmentAmount = enableInstallments 
    ? Math.round(remainingAmount / (downPayment > 0 ? numInstallments - 1 : numInstallments))
    : 0

  const handleRenew = async () => {
    if (!member || !selectedPlan) return

    setLoading(true)
    try {
      // Calculate new dates
      const today = new Date()
      const currentEndDate = new Date(member.end_date)
      const startDate = currentEndDate > today ? currentEndDate : today
      const newEndDate = new Date(startDate)
      newEndDate.setDate(newEndDate.getDate() + selectedPlan.duration_days)
      
      // Prepare update data
      const updateData: any = {
        plan_id: selectedPlan.id,
        start_date: today.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0],
        status: 'active'
      }
      
      // Create installment plan if enabled
      if (enableInstallments) {
        const newInstallments = []
        const startDate = new Date()
        
        // Add down payment if exists
        if (downPayment > 0) {
          newInstallments.push({
            number: 1,
            amount: downPayment,
            due_date: startDate.toISOString().split('T')[0],
            paid: false,
            paid_date: null,
            payment_id: null,
            paid_amount: null
          })
        }
        
        // Add regular installments
        for (let i = (downPayment > 0 ? 1 : 0); i < numInstallments; i++) {
          const dueDate = new Date(startDate)
          dueDate.setMonth(dueDate.getMonth() + (downPayment > 0 ? i : i + 1))
          
          newInstallments.push({
            number: i + 1,
            amount: installmentAmount,
            due_date: dueDate.toISOString().split('T')[0],
            paid: false,
            paid_date: null,
            payment_id: null,
            paid_amount: null
          })
        }
        
        updateData.installment_plan = {
          enabled: true,
          total_amount: planPrice,
          num_installments: numInstallments,
          down_payment: downPayment,
          installments: newInstallments
        }
      } else {
        updateData.installment_plan = null
      }
      
      // Update member
      const { error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', member.id)
      
      if (error) {
        console.error('Renewal error:', error)
        alert('Failed to renew membership. Please try again.')
      } else {
        // Send WhatsApp renewal confirmation
        if (member.custom_fields?.phone) {
          console.log('📱 Sending WhatsApp renewal confirmation...')
          try {
            // Get gym name
            const { data: gym } = await supabase
              .from('gyms')
              .select('name')
              .eq('id', member.gym_id)
              .single()

            const message = generateMembershipUpgrade({
              memberName: member.custom_fields?.full_name || 'Member',
              gymName: gym?.name || 'Our Gym',
              newPlan: selectedPlan.name,
              startDate: new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }),
              endDate: newEndDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            })

            const { data: { session } } = await supabase.auth.getSession()
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            }
            
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`
            }

            const whatsappResponse = await fetch('/api/whatsapp/send', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                to: member.custom_fields.phone,
                message,
                messageType: 'renewal',
                metadata: {
                  member_id: member.id,
                  old_plan: member.membership_plans?.name,
                  new_plan: selectedPlan.name,
                },
              }),
            })

            if (whatsappResponse.ok) {
              console.log('✅ WhatsApp renewal confirmation sent!')
            }
          } catch (whatsappError) {
            console.warn('⚠️ WhatsApp error (but renewal completed):', whatsappError)
          }
        }

        alert(`🎉 Membership Renewed Successfully!\n\n` +
          `Member: ${member.custom_fields?.full_name || 'Member'}\n` +
          `New Plan: ${selectedPlan.name}\n` +
          `Duration: ${selectedPlan.duration_days} days\n` +
          `Amount: ₹${planPrice.toLocaleString('en-IN')}\n` +
          `New End: ${newEndDate.toLocaleDateString('en-IN')}\n` +
          (enableInstallments ? `Installments: ${numInstallments} payments` : 'Payment: Full amount') +
          (member.custom_fields?.phone ? '\n📱 WhatsApp confirmation sent!' : ''))
        
        onRenewed()
        onClose()
      }
    } catch (error) {
      console.error('Error renewing membership:', error)
      alert('An error occurred while renewing membership.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Renew Membership</h2>
                <p className="text-purple-100">
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
          {/* Current Plan Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Current Plan:</span>
                  <p className="font-semibold">{member.membership_plans?.name || 'No Plan'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Expires:</span>
                  <p className="font-semibold">{new Date(member.end_date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Select New Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Select Membership Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {membershipPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPlanId === plan.id
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      {selectedPlanId === plan.id && (
                        <CheckCircle className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-purple-600">
                        ₹{plan.price.toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {plan.duration_days} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Installment Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <IndianRupee className="h-5 w-5 mr-2 text-green-600" />
                Payment Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Installments Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">Enable Installment Plan</p>
                  <p className="text-sm text-gray-600">Split payment into multiple installments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableInstallments}
                    onChange={(e) => setEnableInstallments(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Installment Settings */}
              {enableInstallments && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numInstallments">Number of Installments</Label>
                      <select
                        id="numInstallments"
                        value={numInstallments}
                        onChange={(e) => setNumInstallments(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={2}>2 Installments</option>
                        <option value={3}>3 Installments</option>
                        <option value={4}>4 Installments</option>
                        <option value={6}>6 Installments</option>
                        <option value={12}>12 Installments</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="downPayment">Down Payment (Optional)</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="downPayment"
                          type="number"
                          value={downPayment || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value)
                            setDownPayment(Math.max(0, Math.min(planPrice, value)))
                          }}
                          placeholder="0"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Installment Preview */}
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Payment Breakdown:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold">₹{planPrice.toLocaleString('en-IN')}</span>
                      </div>
                      {downPayment > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-amber-600 font-semibold">💰 Down Payment:</span>
                            <span className="font-bold text-amber-600">₹{downPayment.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Remaining:</span>
                            <span className="font-bold">₹{remainingAmount.toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-purple-600 font-semibold">Each Installment:</span>
                        <span className="font-bold text-purple-600">₹{installmentAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {downPayment > 0 ? `Down payment + ${numInstallments - 1} monthly installments` : `${numInstallments} monthly installments`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Payment Preview */}
              {!enableInstallments && selectedPlan && (
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Full Payment</p>
                      <p className="text-xs text-gray-600">One-time payment</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{planPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              )}
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
              onClick={handleRenew} 
              disabled={loading || !selectedPlanId}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <RefreshCw className="h-4 w-4 mr-2" />
              Renew Membership
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
