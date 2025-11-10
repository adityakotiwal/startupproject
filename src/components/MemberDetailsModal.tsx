'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Activity,
  AlertCircle,
  Edit,
  Dumbbell,
  Clock,
  IndianRupee,
  Users,
  Heart
} from 'lucide-react'
import EditMemberModal from './EditMemberModal'
import RecordPaymentModal from './RecordPaymentModal'
import MemberActivityModal from './MemberActivityModal'
import InstallmentDisplay from './InstallmentDisplay'
import PhotoZoomModal from './PhotoZoomModal'
import AssignedWorkoutPlans from './AssignedWorkoutPlans'

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
    photo_url?: string
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
    }>
  } | null
}

interface Payment {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  status: string
  notes?: string
}

interface MemberDetailsModalProps {
  member: Member | null
  isOpen: boolean
  onClose: () => void
  membershipPlans: Array<{ id: string; name: string; price: number; duration_days: number }>
  onMemberUpdated: () => void
}

export default function MemberDetailsModal({ 
  member, 
  isOpen, 
  onClose, 
  membershipPlans, 
  onMemberUpdated 
}: MemberDetailsModalProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  
  // Modal states for the action buttons
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showPhotoZoom, setShowPhotoZoom] = useState(false)

  useEffect(() => {
    if (member && isOpen) {
      fetchMemberPayments()
    }
  }, [member, isOpen])

  const fetchMemberPayments = async () => {
    if (!member) return
    
    setLoadingPayments(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', member.id)
        .order('payment_date', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error fetching payments:', error)
      } else {
        setPayments(data || [])
      }
    } catch (error) {
      console.error('Unexpected error fetching payments:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  if (!isOpen || !member) return null

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  const getDaysRemaining = () => {
    const endDate = new Date(member.end_date)
    const today = new Date()
    const timeDiff = endDate.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysDiff
  }

  const daysRemaining = getDaysRemaining()
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0
  const isExpired = daysRemaining < 0

  // Handle modal callbacks
  const handleMemberUpdated = () => {
    onMemberUpdated()
    fetchMemberPayments() // Refresh payments after update
  }

  const handlePaymentRecorded = () => {
    onMemberUpdated()
    fetchMemberPayments() // Refresh payments after new payment
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              {member.custom_fields?.photo_url ? (
                <img
                  src={member.custom_fields.photo_url}
                  alt={member.custom_fields?.full_name || 'Member'}
                  onClick={() => setShowPhotoZoom(true)}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer hover:scale-110 hover:shadow-2xl transition-all duration-200"
                />
              ) : (
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                  {(member.custom_fields?.full_name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {member.custom_fields?.full_name || 'Unknown Member'}
                </h2>
                <p className="text-blue-100">
                  Member since {formatDate(member.start_date)}
                </p>
                <div className="mt-2">
                  <Badge className={`${getStatusColor(member.status)} text-xs`}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </Badge>
                </div>
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

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900 font-medium">
                      {member.custom_fields?.full_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-gray-900">
                      {member.custom_fields?.gender || 'Not provided'}
                    </p>
                  </div>
                </div>

                {member.custom_fields?.dateOfBirth && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-gray-900">
                        {formatDate(member.custom_fields.dateOfBirth)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Age</label>
                      <p className="text-gray-900">
                        {calculateAge(member.custom_fields.dateOfBirth)} years
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {member.custom_fields?.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-900">{member.custom_fields.phone}</span>
                    </div>
                  )}
                  
                  {member.custom_fields?.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-900">{member.custom_fields.email}</span>
                    </div>
                  )}
                  
                  {member.custom_fields?.address && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                      <div>
                        <p className="text-gray-900">{member.custom_fields.address}</p>
                        {member.custom_fields.pincode && (
                          <p className="text-sm text-gray-500">PIN: {member.custom_fields.pincode}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(member.custom_fields?.emergencyContact || member.custom_fields?.emergencyPhone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-600" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {member.custom_fields?.emergencyContact && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Person</label>
                      <p className="text-gray-900">{member.custom_fields.emergencyContact}</p>
                    </div>
                  )}
                  {member.custom_fields?.emergencyPhone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-900">{member.custom_fields.emergencyPhone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                  Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading payments...</p>
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="font-medium text-gray-900">₹{payment.amount}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(payment.payment_date)} • {payment.payment_method}
                          </p>
                        </div>
                        <Badge 
                          className={
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No payments recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Assigned Workout Plans */}
            <AssignedWorkoutPlans memberId={member.id} />
          </div>

          {/* Membership Details Sidebar */}
          <div className="space-y-6">
            {/* Membership Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Dumbbell className="h-5 w-5 mr-2 text-purple-600" />
                  Membership Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Plan</label>
                  <p className="text-lg font-bold text-gray-900">
                    {member.membership_plans?.name || 'No Plan'}
                  </p>
                </div>
                
                {member.membership_plans && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Monthly Fee</span>
                      <span className="font-medium">₹{member.membership_plans.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Duration</span>
                      <span className="font-medium">{member.membership_plans.duration_days} days</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Membership Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-gray-900">{formatDate(member.start_date)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <p className="text-gray-900">{formatDate(member.end_date)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Days Remaining</label>
                  <div className="flex items-center space-x-2">
                    {isExpired ? (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="font-bold">Expired {Math.abs(daysRemaining)} days ago</span>
                      </div>
                    ) : isExpiringSoon ? (
                      <div className="flex items-center text-orange-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="font-bold">{daysRemaining} days left</span>
                      </div>
                    ) : (
                      <span className="text-green-600 font-bold">{daysRemaining} days</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Installment Plan */}
            {member.installment_plan && member.installment_plan.enabled && (
              <InstallmentDisplay installmentPlan={member.installment_plan} />
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors" 
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Member
                </Button>
                <Button 
                  className="w-full hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors" 
                  variant="outline"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
                <Button 
                  className="w-full hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors" 
                  variant="outline"
                  onClick={() => setShowActivityModal(true)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Activity
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Modals */}
        <EditMemberModal
          member={member}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onMemberUpdated={handleMemberUpdated}
          membershipPlans={membershipPlans}
        />

        <RecordPaymentModal
          member={member}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentRecorded={handlePaymentRecorded}
        />

        <MemberActivityModal
          member={member}
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
        />

        <PhotoZoomModal
          isOpen={showPhotoZoom}
          onClose={() => setShowPhotoZoom(false)}
          photoUrl={member.custom_fields?.photo_url || null}
          memberName={member.custom_fields?.full_name || 'Member'}
        />
      </div>
    </div>
  )
}