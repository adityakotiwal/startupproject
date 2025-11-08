'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { useMembers, useMembershipPlans, useInvalidateQueries } from '@/hooks/useOptimizedData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, Download, Users, Phone, Mail, Dumbbell, Eye, CreditCard, Edit, UserX, RefreshCw } from 'lucide-react'
import ProtectedPage from '@/components/ProtectedPage'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'
import MemberDetailsModal from '@/components/MemberDetailsModal'
import AdvancedFiltersModal from '@/components/AdvancedFiltersModal'
import RecordPaymentModal from '@/components/RecordPaymentModal'
import EditMemberModal from '@/components/EditMemberModal'
import RenewMembershipModal from '@/components/RenewMembershipModal'
import PhotoZoomModal from '@/components/PhotoZoomModal'
import { exportMembersToCSV } from '@/lib/csvExport'

// Member interface - stores member data in custom_fields due to RLS constraints
interface Member {
  id: string
  user_id: string          // Placeholder UUID for member identification
  gym_id: string          // Links to gyms table
  plan_id: string         // Links to membership_plans table
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
  // Joined data from related tables
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
  total_paid?: number  // Total amount paid by member from payments table
}

interface FilterOptions {
  status: string[]
  membershipPlan: string
  joinDateFrom: string
  joinDateTo: string
  expiryDateFrom: string
  expiryDateTo: string
  gender: string
  ageFrom: string
  ageTo: string
  paymentStatus: string
}

export default function MembersPage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const isClient = useClientOnly()
  
  // 🚀 Use React Query for instant cached data
  // Use isPending instead of isLoading - only true when NO data exists (not during background refetch)
  const { data: members = [], isPending: isLoading, error: queryError, refetch } = useMembers(gymId)
  const { data: membershipPlans = [] } = useMembershipPlans(gymId)
  const { invalidateMembers, invalidatePayments } = useInvalidateQueries()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const error = queryError?.message || null
  
  // Refresh callback for modals
  const refreshMembers = async () => {
    console.log('🔄 Refreshing members data...')
    try {
      // Invalidate caches to ensure fresh data fetch
      invalidateMembers()
      invalidatePayments() // Also invalidate payments to update total_paid
      
      // Force refetch to get updated payment data
      const result = await refetch()
      
      if (result.isError) {
        console.error('❌ Error refetching members:', result.error)
      } else {
        console.log('✅ Members data refreshed successfully', result.data?.length, 'members')
      }
    } catch (error) {
      console.error('❌ Error in refreshMembers:', error)
    }
  }
  
  // Modal states
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [showPhotoZoom, setShowPhotoZoom] = useState(false)
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null)
  const [zoomMemberName, setZoomMemberName] = useState('')
  const [exportingCSV, setExportingCSV] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({
    status: [],
    membershipPlan: '',
    joinDateFrom: '',
    joinDateTo: '',
    expiryDateFrom: '',
    expiryDateTo: '',
    gender: '',
    ageFrom: '',
    ageTo: '',
    paymentStatus: ''
  })

  // 🚀 Data is automatically cached and refreshed by React Query!
  // No manual fetching needed - data loads instantly from cache

  // Helper function to calculate age from date of birth
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

  // Filter members based on search term, status, and advanced filters
  const filteredMembers = useMemo(() => {
    const filtered = members.filter(member => {
      // Get member data from custom_fields (stored due to RLS constraints)
      const name = member.custom_fields?.full_name || ''
      const phone = member.custom_fields?.phone || ''
      const email = member.custom_fields?.email || ''
      
      // Basic search filter
      const matchesSearch = searchTerm === '' || 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Basic status filter
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter
      
      // Advanced filters
      const matchesAdvancedStatus = advancedFilters.status.length === 0 || 
        advancedFilters.status.includes(member.status)
      
      const matchesMembershipPlan = !advancedFilters.membershipPlan || 
        member.plan_id === advancedFilters.membershipPlan
      
      // Date filters
      const matchesJoinDateFrom = !advancedFilters.joinDateFrom || 
        new Date(member.start_date) >= new Date(advancedFilters.joinDateFrom)
      
      const matchesJoinDateTo = !advancedFilters.joinDateTo || 
        new Date(member.start_date) <= new Date(advancedFilters.joinDateTo)
      
      const matchesExpiryDateFrom = !advancedFilters.expiryDateFrom || 
        new Date(member.end_date) >= new Date(advancedFilters.expiryDateFrom)
      
      const matchesExpiryDateTo = !advancedFilters.expiryDateTo || 
        new Date(member.end_date) <= new Date(advancedFilters.expiryDateTo)
      
      // Gender filter
      const matchesGender = !advancedFilters.gender || 
        member.custom_fields?.gender?.toLowerCase() === advancedFilters.gender.toLowerCase()
      
      // Age filter
      let matchesAge = true
      if (member.custom_fields?.dateOfBirth && (advancedFilters.ageFrom || advancedFilters.ageTo)) {
        const age = calculateAge(member.custom_fields.dateOfBirth)
        if (advancedFilters.ageFrom && age < parseInt(advancedFilters.ageFrom)) {
          matchesAge = false
        }
        if (advancedFilters.ageTo && age > parseInt(advancedFilters.ageTo)) {
          matchesAge = false
        }
      }
      
      return matchesSearch && 
             matchesStatus && 
             matchesAdvancedStatus &&
             matchesMembershipPlan &&
             matchesJoinDateFrom &&
             matchesJoinDateTo &&
             matchesExpiryDateFrom &&
             matchesExpiryDateTo &&
             matchesGender &&
             matchesAge
    })

    // Sort by joining date (start_date) in descending order - latest members first
    return filtered.sort((a, b) => {
      const dateA = new Date(a.start_date).getTime()
      const dateB = new Date(b.start_date).getTime()
      return dateB - dateA // Descending order
    })
  }, [members, searchTerm, statusFilter, advancedFilters])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-yellow-100 text-yellow-800'
      case 'quit': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    // Format Indian phone numbers
    if (phone.length === 10) {
      return `+91 ${phone.slice(0, 5)}-${phone.slice(5)}`
    }
    return phone
  }

  // Event handlers
  const handleViewMember = (member: Member) => {
    setSelectedMember(member)
    setShowMemberDetails(true)
  }

  const handlePhotoClick = (e: React.MouseEvent, photoUrl: string, memberName: string) => {
    e.stopPropagation() // Prevent row click
    setZoomPhotoUrl(photoUrl)
    setZoomMemberName(memberName)
    setShowPhotoZoom(true)
  }

  const isFullyPaid = (member: Member): boolean => {
    if (!member.installment_plan?.enabled) {
      // For non-installment members, check actual payments
      const planPrice = member.membership_plans?.price || 0
      const totalPaid = member.total_paid || 0
      return totalPaid >= planPrice
    }
    
    // Check if all installments are paid
    const allPaid = member.installment_plan.installments.every(inst => inst.paid)
    return allPaid
  }

  const handleExportCSV = async () => {
    try {
      setExportingCSV(true)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for animation
      exportMembersToCSV(filteredMembers, `gym-members-${currentGym?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`)
    } finally {
      setExportingCSV(false)
    }
  }

  const handleApplyAdvancedFilters = (filters: FilterOptions) => {
    setAdvancedFilters(filters)
  }

  // Manual refresh handler for AppHeader
  const handleRefresh = () => {
    refetch()
    invalidateMembers()
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header with Gradient */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="h-8 w-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Members Management</h1>
                </div>
                <p className="text-blue-100 text-lg">Track, manage, and grow your gym membership with powerful insights</p>
                <div className="flex items-center space-x-6 mt-4 text-sm text-blue-100">
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="h-4 w-4" />
                    <span>Membership Tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment Management</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <Users className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Members Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Members</p>
                  <p className="text-3xl font-bold mt-1">{members.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
              </div>
              <p className="text-blue-100 text-xs">All registered members</p>
            </div>
            
            {/* Active Members Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Members</p>
                  <p className="text-3xl font-bold mt-1">
                    {members.filter(m => m.status.toLowerCase() === 'active').length}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
              </div>
              <p className="text-green-100 text-xs">
                {members.length > 0 ? Math.round((members.filter(m => m.status.toLowerCase() === 'active').length / members.length) * 100) : 0}% of total
              </p>
            </div>
            
            {/* Overdue Card */}
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Overdue</p>
                  <p className="text-3xl font-bold mt-1">
                    {members.filter(m => m.status.toLowerCase() === 'overdue').length}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
              </div>
              <p className="text-yellow-100 text-xs">Needs attention</p>
            </div>
            
            {/* Quit Members Card */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-red-100 text-sm font-medium">Quit</p>
                  <p className="text-3xl font-bold mt-1">
                    {members.filter(m => m.status.toLowerCase() === 'quit').length}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserX className="h-8 w-8" />
                </div>
              </div>
              <p className="text-red-100 text-xs">Inactive members</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Link href="/members/add">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
              >
                <Plus size={20} />
                Add Member
              </button>
            </Link>
            <button 
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} className={exportingCSV ? 'animate-spin' : ''} />
              {exportingCSV ? 'Exporting...' : `Export CSV (${filteredMembers.length})`}
            </button>
            <button 
              onClick={() => setShowAdvancedFilters(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transform hover:scale-105 transition-all duration-200 ${
                Object.values(advancedFilters).some(value => 
                  Array.isArray(value) ? value.length > 0 : value !== ''
                ) 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <Filter size={20} />
              More Filters
              {Object.values(advancedFilters).some(value => 
                Array.isArray(value) ? value.length > 0 : value !== ''
              ) && (
                <span className="bg-purple-800 px-2 py-1 rounded-full text-xs">
                  {Object.values(advancedFilters).filter(value => 
                    Array.isArray(value) ? value.length > 0 : value !== ''
                  ).length}
                </span>
              )}
            </button>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, phone, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="overdue">Overdue</option>
                    <option value="quit">Quit</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          {filteredMembers.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {members.length === 0 ? 'No members yet' : 'No members found'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {members.length === 0 
                      ? 'Get started by adding your first member.'
                      : 'Try adjusting your search or filter criteria.'
                    }
                  </p>
                  {members.length === 0 && (
                    <div className="mt-6">
                      <Link
                        href="/members/add"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Member
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Join Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan End Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quick Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers.map((member, index) => (
                        <tr 
                          key={member.id} 
                          onClick={() => handleViewMember(member)}
                          className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                        >
                          <td className="sticky left-0 z-10 bg-white group-hover:bg-blue-50 px-6 py-4 whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {member.custom_fields?.photo_url ? (
                                  <img
                                    src={member.custom_fields.photo_url}
                                    alt={member.custom_fields?.full_name || 'Member'}
                                    onClick={(e) => handlePhotoClick(e, member.custom_fields?.photo_url || '', member.custom_fields?.full_name || 'Member')}
                                    className="h-10 w-10 rounded-full object-cover border-2 border-blue-500 cursor-pointer hover:border-blue-700 hover:scale-110 transition-all duration-200"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {member.custom_fields?.full_name?.charAt(0).toUpperCase() || 'M'}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {member.custom_fields?.full_name || 'No Name'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {member.membership_plans?.name || 'No Plan'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {member.custom_fields?.phone ? (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                  {formatPhone(member.custom_fields.phone)}
                                </div>
                              ) : (
                                '-'
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.custom_fields?.email ? (
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                  {member.custom_fields.email}
                                </div>
                              ) : (
                                '-'
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(member.start_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              if (member.installment_plan?.enabled) {
                                const plan = member.installment_plan
                                const paidInstallments = plan.installments.filter((i: any) => i.paid)
                                const paidAmount = paidInstallments.reduce((sum: number, i: any) => sum + (i.paid_amount || i.amount), 0)
                                const dueAmount = plan.total_amount - paidAmount
                                const allPaid = paidInstallments.length === plan.num_installments
                                
                                return (
                                  <div className="text-sm">
                                    <div className="text-cyan-600 font-semibold">
                                      Paid: ₹{paidAmount.toLocaleString('en-IN')}
                                    </div>
                                    {allPaid ? (
                                      <div className="text-green-600 font-bold">
                                        Fully Paid
                                      </div>
                                    ) : (
                                      <div className="text-red-600 font-semibold">
                                        Due: ₹{dueAmount.toLocaleString('en-IN')} (Inst. {paidInstallments.length}/{plan.num_installments})
                                      </div>
                                    )}
                                  </div>
                                )
                              } else {
                                // For non-installment members, show actual paid amount from payments table
                                const planPrice = member.membership_plans?.price || 0
                                const totalPaid = member.total_paid || 0
                                const dueAmount = planPrice - totalPaid
                                const isFullyPaid = totalPaid >= planPrice
                                
                                return (
                                  <div className="text-sm">
                                    <div className={`font-semibold ${totalPaid > 0 ? 'text-cyan-600' : 'text-gray-500'}`}>
                                      Paid: ₹{totalPaid.toLocaleString('en-IN')}
                                    </div>
                                    {isFullyPaid ? (
                                      <div className="text-green-600 font-bold">
                                        Fully Paid
                                      </div>
                                    ) : (
                                      <div className="text-red-600 font-semibold">
                                        Due: ₹{dueAmount.toLocaleString('en-IN')}
                                      </div>
                                    )}
                                  </div>
                                )
                              }
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {(() => {
                              const endDate = new Date(member.end_date)
                              const today = new Date()
                              const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                              
                              const isExpired = daysRemaining < 0
                              const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7
                              
                              return (
                                <div>
                                  <div className={`font-semibold ${
                                    isExpired ? 'text-red-600' : 
                                    isExpiringSoon ? 'text-orange-600' : 
                                    'text-gray-900'
                                  }`}>
                                    {formatDate(member.end_date)}
                                  </div>
                                  {isExpired ? (
                                    <div className="text-xs text-red-600 font-medium">
                                      Expired {Math.abs(daysRemaining)} days ago
                                    </div>
                                  ) : isExpiringSoon ? (
                                    <div className="text-xs text-orange-600 font-medium">
                                      Expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500">
                                      {daysRemaining} days remaining
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(member.status)}>
                              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {/* Pay Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedMember(member)
                                  setShowPaymentModal(true)
                                }}
                                className="group hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all duration-200 overflow-hidden"
                              >
                                <CreditCard className="h-4 w-4 flex-shrink-0" />
                                <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                  Pay
                                </span>
                              </Button>
                              
                              {/* Edit Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedMember(member)
                                  setShowEditModal(true)
                                }}
                                className="group hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 overflow-hidden"
                              >
                                <Edit className="h-4 w-4 flex-shrink-0" />
                                <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                  Edit
                                </span>
                              </Button>
                              
                              {/* Renew Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (!isFullyPaid(member)) {
                                    alert(`⚠️ PAYMENT REQUIRED\n\nCannot renew membership for ${member.custom_fields?.full_name || 'this member'}!\n\n❌ Pending installment payments detected.\n\n💰 Please collect full fees before renewing the membership.\n\nGo to 'Pay' button to record payments.`)
                                    return
                                  }
                                  setSelectedMember(member)
                                  setShowRenewModal(true)
                                }}
                                className={`group transition-all duration-200 overflow-hidden ${
                                  isFullyPaid(member) 
                                    ? 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300' 
                                    : 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 opacity-60'
                                }`}
                                title={!isFullyPaid(member) ? 'Click to see payment requirement' : 'Renew membership'}
                              >
                                <RefreshCw className="h-4 w-4 flex-shrink-0" />
                                <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                  Renew
                                </span>
                              </Button>
                              
                              {/* Quit Button - Last */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  if (!isFullyPaid(member)) {
                                    alert(`⚠️ PAYMENT REQUIRED\n\nCannot mark ${member.custom_fields?.full_name || 'this member'} as quit!\n\n❌ Pending installment payments detected.\n\n💰 Please collect full fees before quitting the membership.\n\nGo to 'Pay' button to record payments.`)
                                    return
                                  }
                                  if (confirm(`Mark ${member.custom_fields?.full_name || 'this member'} as quit?\n\nThis will change their status to 'Quit'.`)) {
                                    const { error } = await supabase
                                      .from('members')
                                      .update({ status: 'quit' })
                                      .eq('id', member.id)
                                    
                                    if (!error) {
                                      alert(`✅ ${member.custom_fields?.full_name || 'Member'} marked as quit successfully!`)
                                      refreshMembers()
                                    } else {
                                      alert('Failed to update member status. Please try again.')
                                    }
                                  }
                                }}
                                className={`group transition-all duration-200 overflow-hidden ${
                                  isFullyPaid(member) 
                                    ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-300' 
                                    : 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 opacity-60'
                                }`}
                                title={!isFullyPaid(member) ? 'Click to see payment requirement' : 'Mark member as quit'}
                              >
                                <UserX className="h-4 w-4 flex-shrink-0" />
                                <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                  Quit
                                </span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modals */}
        <MemberDetailsModal
          member={selectedMember}
          isOpen={showMemberDetails}
          onClose={() => {
            setShowMemberDetails(false)
            setSelectedMember(null)
          }}
          membershipPlans={membershipPlans}
          onMemberUpdated={() => {
            refreshMembers() // Refresh members list
          }}
        />

        <AdvancedFiltersModal
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          onApplyFilters={handleApplyAdvancedFilters}
          membershipPlans={membershipPlans}
        />

        {/* Direct Action Modals */}
        <RecordPaymentModal
          member={selectedMember}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedMember(null)
          }}
          onPaymentRecorded={() => {
            refreshMembers() // Refresh members list
            setShowPaymentModal(false)
            setSelectedMember(null)
          }}
        />

        <EditMemberModal
          member={selectedMember}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedMember(null)
          }}
          onMemberUpdated={() => {
            refreshMembers() // Refresh members list
            setShowEditModal(false)
            setSelectedMember(null)
          }}
          membershipPlans={membershipPlans}
        />

        <RenewMembershipModal
          member={selectedMember}
          isOpen={showRenewModal}
          onClose={() => {
            setShowRenewModal(false)
            setSelectedMember(null)
          }}
          onRenewed={() => {
            refreshMembers() // Refresh members list
          }}
          membershipPlans={membershipPlans}
        />

        <PhotoZoomModal
          isOpen={showPhotoZoom}
          onClose={() => setShowPhotoZoom(false)}
          photoUrl={zoomPhotoUrl}
          memberName={zoomMemberName}
        />
      </div>
    </ProtectedPage>
  )
}