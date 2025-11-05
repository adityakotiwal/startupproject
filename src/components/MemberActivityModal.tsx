'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Activity, 
  Calendar, 
  CreditCard,
  User,
  Edit,
  Clock,
  TrendingUp,
  IndianRupee,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'

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
}

interface Payment {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  status: string
  notes?: string
}

interface ActivityLog {
  id: string
  activity_type: 'payment' | 'membership_change' | 'status_change' | 'profile_update'
  description: string
  created_at: string
  amount?: number
  old_value?: string
  new_value?: string
}

interface MemberActivityModalProps {
  member: Member | null
  isOpen: boolean
  onClose: () => void
}

export default function MemberActivityModal({ 
  member, 
  isOpen, 
  onClose 
}: MemberActivityModalProps) {
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [lastPayment, setLastPayment] = useState<Payment | null>(null)

  useEffect(() => {
    if (member && isOpen) {
      fetchMemberActivity()
    }
  }, [member, isOpen])

  const fetchMemberActivity = async () => {
    if (!member) return
    
    setLoading(true)
    try {
      // Fetch all payments for this member
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', member.id)
        .order('payment_date', { ascending: false })

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError)
      } else {
        setPayments(paymentsData || [])
        
        // Calculate total paid and last payment
        if (paymentsData && paymentsData.length > 0) {
          const total = paymentsData.reduce((sum, payment) => sum + payment.amount, 0)
          setTotalPaid(total)
          setLastPayment(paymentsData[0])
        }
      }

      // Create activity timeline from available data
      const memberActivities: ActivityLog[] = []

      // Add member creation
      memberActivities.push({
        id: 'created',
        activity_type: 'profile_update',
        description: 'Member joined the gym',
        created_at: member.created_at
      })

      // Add payments as activities
      if (paymentsData) {
        paymentsData.forEach(payment => {
          memberActivities.push({
            id: payment.id,
            activity_type: 'payment',
            description: `Payment received via ${payment.payment_method}`,
            created_at: payment.payment_date,
            amount: payment.amount
          })
        })
      }

      // Sort activities by date (newest first)
      memberActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setActivities(memberActivities)
    } catch (error) {
      console.error('Unexpected error fetching member activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="h-4 w-4 text-green-600" />
      case 'membership_change':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'status_change':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'profile_update':
        return <User className="h-4 w-4 text-purple-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getDaysActive = () => {
    const joinDate = new Date(member?.created_at || '')
    const today = new Date()
    const timeDiff = today.getTime() - joinDate.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysDiff
  }

  const getPaymentFrequency = () => {
    if (payments.length === 0) return 'No payments yet'
    if (payments.length === 1) return 'First payment'
    
    const daysActive = getDaysActive()
    const frequency = daysActive / payments.length
    
    if (frequency <= 30) return 'Regular (Monthly)'
    if (frequency <= 90) return 'Quarterly'
    return 'Irregular'
  }

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Member Activity</h2>
                <p className="text-indigo-100">
                  {member.custom_fields?.full_name || 'Member'}'s complete history
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

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading activity...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Stats */}
              <div className="lg:col-span-1 space-y-4">
                {/* Summary Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Days Active</span>
                      <span className="font-bold text-lg">{getDaysActive()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Payments</span>
                      <span className="font-bold text-lg">{payments.length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Paid</span>
                      <span className="font-bold text-lg text-green-600">₹{totalPaid}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Payment Pattern</span>
                      <span className="font-bold text-sm">{getPaymentFrequency()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Last Payment */}
                {lastPayment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                        Last Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Amount</span>
                          <span className="font-bold text-green-600">₹{lastPayment.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Method</span>
                          <span className="capitalize">{lastPayment.payment_method}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Date</span>
                          <span>{new Date(lastPayment.payment_date).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Current Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Membership</span>
                        <Badge className={
                          member.status === 'active' ? 'bg-green-100 text-green-800' :
                          member.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Plan</span>
                        <span className="font-medium">{member.membership_plans?.name || 'No Plan'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expires</span>
                        <span className="font-medium">
                          {new Date(member.end_date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Timeline */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                      Activity Timeline
                    </CardTitle>
                    <CardDescription>
                      Complete history of member activities and transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No activity recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activities.map((activity, index) => (
                          <div key={activity.id} className="flex space-x-4">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center">
                              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                                {getActivityIcon(activity.activity_type)}
                              </div>
                              {index < activities.length - 1 && (
                                <div className="w-px h-12 bg-gray-200 mt-2"></div>
                              )}
                            </div>
                            
                            {/* Activity content */}
                            <div className="flex-1 pb-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {activity.description}
                                    {activity.amount && (
                                      <span className="ml-2 text-green-600 font-bold">
                                        ₹{activity.amount}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(activity.created_at)}
                                  </p>
                                </div>
                                {activity.activity_type === 'payment' && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}