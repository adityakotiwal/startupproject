'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { useStaff, useInvalidateQueries } from '@/hooks/useOptimizedData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, Download, Users, Phone, Mail, Briefcase, IndianRupee, Edit, DollarSign, Activity, UserX, History, Wallet } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'
import StaffDetailsModal from '@/components/StaffDetailsModal'
import EditStaffModal from '@/components/EditStaffModal'
import SalaryUpdateModal from '@/components/SalaryUpdateModal'
import StaffActivityModal from '@/components/StaffActivityModal'
import StaffAdvancedFiltersModal from '@/components/StaffAdvancedFiltersModal'
import PhotoZoomModal from '@/components/PhotoZoomModal'
import RecordSalaryPaymentModal from '@/components/RecordSalaryPaymentModal'
import SalaryHistoryModal from '@/components/SalaryHistoryModal'
import AppHeader from '@/components/AppHeader'
import { exportStaffToCSV, exportStaffWithAnalytics } from '@/lib/staffCsvExport'

// Staff interface - using individual columns (Option 2)
interface Staff {
  id: string
  user_id: string          // Placeholder UUID for staff identification
  gym_id: string          // Links to gyms table
  status: 'Active' | 'Inactive' | 'Terminated'
  full_name?: string
  phone?: string
  email?: string
  address?: string
  role?: string
  join_date?: string
  salary?: number
  emergency_contact_name?: string
  emergency_contact_phone?: string
  terminated_date?: string
  photo_url?: string
}

interface StaffFilterOptions {
  status: string[]
  role: string
  joinDateFrom: string
  joinDateTo: string
  salaryFrom: string
  salaryTo: string
  experienceFrom: string
  experienceTo: string
}

export default function StaffPage() {
  // Hooks
  const router = useRouter()
  
  // State management
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const isClient = useClientOnly()
  
  // React Query optimized data fetching
  // Use isPending instead of isLoading - only true when NO data exists (not during background refetch)
  const { data: staff = [], isPending: isLoading, refetch } = useStaff(gymId)
  const { invalidateStaff } = useInvalidateQueries()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [showStaffDetails, setShowStaffDetails] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showPaySalaryModal, setShowPaySalaryModal] = useState(false)
  const [showSalaryHistoryModal, setShowSalaryHistoryModal] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<StaffFilterOptions>({
    status: [],
    role: '',
    joinDateFrom: '',
    joinDateTo: '',
    salaryFrom: '',
    salaryTo: '',
    experienceFrom: '',
    experienceTo: ''
  })
  const [showPhotoZoom, setShowPhotoZoom] = useState(false)
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null)
  const [zoomStaffName, setZoomStaffName] = useState('')
  
  // Refresh callback for modals
  const refreshStaff = () => {
    refetch()
    invalidateStaff()
  }
  
  const loading = isLoading || gymLoading

  // Helper function to calculate experience in months
  const calculateExperienceMonths = (joinDate: string) => {
    const join = new Date(joinDate)
    const today = new Date()
    return (today.getFullYear() - join.getFullYear()) * 12 + (today.getMonth() - join.getMonth())
  }

  // Filter staff based on search term, status, and advanced filters
  const filteredStaff = useMemo(() => {
    return staff.filter(staffMember => {
      // Get staff info from direct columns (Option 2 - individual columns)
      const staffName = staffMember.full_name?.toLowerCase() || ''
      const staffPhone = staffMember.phone?.toLowerCase() || ''
      const staffEmail = staffMember.email?.toLowerCase() || ''
      const staffRole = staffMember.role?.toLowerCase() || ''
      
      // Basic search filter
      const matchesSearch = searchTerm === '' || 
        staffName.includes(searchTerm.toLowerCase()) ||
        staffPhone.includes(searchTerm.toLowerCase()) ||
        staffEmail.includes(searchTerm.toLowerCase()) ||
        staffRole.includes(searchTerm.toLowerCase())
      
      // Basic status filter
      const matchesStatus = statusFilter === 'all' || staffMember.status.toLowerCase() === statusFilter.toLowerCase()
      
      // Advanced filters
      const matchesAdvancedStatus = advancedFilters.status.length === 0 || 
        advancedFilters.status.includes(staffMember.status)
      
      const matchesRole = !advancedFilters.role || 
        staffMember.role === advancedFilters.role
      
      // Date filters
      const matchesJoinDateFrom = !advancedFilters.joinDateFrom || !staffMember.join_date ||
        new Date(staffMember.join_date) >= new Date(advancedFilters.joinDateFrom)
      
      const matchesJoinDateTo = !advancedFilters.joinDateTo || !staffMember.join_date ||
        new Date(staffMember.join_date) <= new Date(advancedFilters.joinDateTo)
      
      // Salary filters
      const matchesSalaryFrom = !advancedFilters.salaryFrom || !staffMember.salary ||
        staffMember.salary >= parseInt(advancedFilters.salaryFrom)
      
      const matchesSalaryTo = !advancedFilters.salaryTo || !staffMember.salary ||
        staffMember.salary <= parseInt(advancedFilters.salaryTo)
      
      // Experience filters
      let matchesExperience = true
      if (staffMember.join_date && (advancedFilters.experienceFrom || advancedFilters.experienceTo)) {
        const experienceMonths = calculateExperienceMonths(staffMember.join_date)
        if (advancedFilters.experienceFrom && experienceMonths < parseInt(advancedFilters.experienceFrom)) {
          matchesExperience = false
        }
        if (advancedFilters.experienceTo && experienceMonths > parseInt(advancedFilters.experienceTo)) {
          matchesExperience = false
        }
      }
      
      return matchesSearch && 
             matchesStatus && 
             matchesAdvancedStatus &&
             matchesRole &&
             matchesJoinDateFrom &&
             matchesJoinDateTo &&
             matchesSalaryFrom &&
             matchesSalaryTo &&
             matchesExperience
    })
  }, [staff, searchTerm, statusFilter, advancedFilters])

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Inactive</Badge>
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Terminated</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>
    }
  }

  // Format phone number
  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    // Format Indian phone numbers
    if (phone.length === 10) {
      return `+91 ${phone.slice(0, 5)}-${phone.slice(5)}`
    }
    return phone
  }

  // Format salary
  const formatSalary = (salary: number | null) => {
    if (!salary) return '-'
    return `₹${salary.toLocaleString('en-IN')}`
  }

  // Event handlers
  const handleViewStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember)
    setShowStaffDetails(true)
  }

  const handlePhotoClick = (e: React.MouseEvent, photoUrl: string, staffName: string) => {
    e.stopPropagation() // Prevent card click
    setZoomPhotoUrl(photoUrl)
    setZoomStaffName(staffName)
    setShowPhotoZoom(true)
  }

  const handleExportCSV = async () => {
    try {
      setExportingCSV(true)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for animation
      exportStaffWithAnalytics(filteredStaff, `gym-staff-${currentGym?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`)
    } finally {
      setExportingCSV(false)
    }
  }

  const handleApplyAdvancedFilters = (filters: StaffFilterOptions) => {
    setAdvancedFilters(filters)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AppHeader 
          onRefresh={refreshStaff}
          isRefreshing={loading}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header with Gradient */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <Briefcase className="h-8 w-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Staff Management</h1>
                </div>
                <p className="text-purple-100 text-lg">Manage, track, and optimize your gym staff with powerful insights</p>
                <div className="flex items-center space-x-6 mt-4 text-sm text-purple-100">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Team Management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="h-4 w-4" />
                    <span>Salary Tracking</span>
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
          
          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 text-red-400">⚠️</div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Staff</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Gym Not Found State */}


          {/* Main Staff Content */}
          {staff && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Total Staff Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Staff</p>
                      <p className="text-3xl font-bold mt-1">{staff.length}</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Users className="h-8 w-8" />
                    </div>
                  </div>
                  <p className="text-blue-100 text-xs">
                    Avg. ₹{staff.length > 0 ? Math.round(staff.reduce((sum, s) => sum + (s.salary || 0), 0) / staff.length).toLocaleString('en-IN') : '0'}
                  </p>
                </div>

                {/* Active Staff Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Active Staff</p>
                      <p className="text-3xl font-bold mt-1">
                        {staff.filter(s => s.status === 'Active').length}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Users className="h-8 w-8" />
                    </div>
                  </div>
                  <p className="text-green-100 text-xs">
                    {staff.length > 0 ? Math.round((staff.filter(s => s.status === 'Active').length / staff.length) * 100) : 0}% active
                  </p>
                </div>

                {/* This Month Joined Card */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">This Month Joined</p>
                      <p className="text-3xl font-bold mt-1">
                        {staff.filter(s => {
                          const joinDate = new Date(s.join_date || '')
                          const currentMonth = new Date().getMonth()
                          const currentYear = new Date().getFullYear()
                          return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear
                        }).length}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Plus className="h-8 w-8" />
                    </div>
                  </div>
                  <p className="text-purple-100 text-xs">Latest: {staff.length > 0 && staff[0]?.join_date ? new Date(staff[0].join_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                </div>

                {/* Total Payroll Card */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Total Payroll</p>
                      <p className="text-3xl font-bold mt-1">
                        ₹{staff.reduce((sum, s) => sum + (s.salary || 0), 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl">
                      <IndianRupee className="h-8 w-8" />
                    </div>
                  </div>
                  <p className="text-orange-100 text-xs">All staff combined</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-6">
                <button 
                  onClick={() => router.push('/staff/add')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
                >
                  <Plus size={20} />
                  Add Staff
                </button>
                <button 
                  onClick={handleExportCSV}
                  disabled={exportingCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={20} className={exportingCSV ? 'animate-spin' : ''} />
                  {exportingCSV ? 'Exporting...' : `Export CSV (${filteredStaff.length})`}
                </button>
                <button 
                  onClick={() => setShowAdvancedFilters(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transform hover:scale-105 transition-all duration-200 ${
                    Object.keys(advancedFilters).length > 0 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  <Filter size={20} />
                  More Filters
                  {Object.keys(advancedFilters).length > 0 && (
                    <span className="bg-purple-800 px-2 py-1 rounded-full text-xs">
                      {Object.keys(advancedFilters).length}
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
                          placeholder="Search staff by name, phone, email, or role..."
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
                        <option value="inactive">Inactive</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Staff List */}
              {filteredStaff.length === 0 ? (
                <Card>
                  <CardContent className="p-12">
                    <div className="text-center">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {staff.length === 0 ? 'No staff members yet' : 'No staff found'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {staff.length === 0 
                          ? 'Get started by adding your first staff member.'
                          : 'Try adjusting your search or filter criteria.'
                        }
                      </p>
                      {staff.length === 0 && (
                        <div className="mt-6">
                          <Link
                            href="/staff/add"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Staff Member
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredStaff.map((staffMember) => (
                    <Card 
                      key={staffMember.id} 
                      className="relative group hover:shadow-2xl hover:scale-105 hover:border-purple-300 transition-all duration-300 cursor-pointer overflow-hidden"
                      onClick={() => handleViewStaff(staffMember)}
                    >
                      {/* Colored background overlay on hover */}
                      <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

                      <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                {staffMember.photo_url ? (
                                  <img
                                    src={staffMember.photo_url}
                                    alt={staffMember.full_name || 'Staff'}
                                    onClick={(e) => handlePhotoClick(e, staffMember.photo_url || '', staffMember.full_name || 'Staff')}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 cursor-pointer hover:border-blue-700 hover:scale-110 transition-all duration-200"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-lg">
                                      {staffMember.full_name?.charAt(0) || '?'}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {staffMember.full_name || 'No Name'}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {staffMember.role || 'No Role'}
                                  </p>
                                </div>
                              </div>
                              {getStatusBadge(staffMember.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {formatPhone(staffMember.phone || null)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {staffMember.email || '-'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <IndianRupee className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {formatSalary(staffMember.salary || null)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 flex justify-between items-center">
                              <div className="text-sm">
                                {staffMember.status === 'Terminated' ? (
                                  <div>
                                    <span className="text-red-600 font-semibold">
                                      Terminated: {staffMember.terminated_date 
                                        ? new Date(staffMember.terminated_date).toLocaleDateString('en-IN')
                                        : 'Date not recorded'
                                      }
                                    </span>
                                    {staffMember.join_date && staffMember.terminated_date && (
                                      <span className="text-gray-600 ml-2">
                                        • Worked for {(() => {
                                          const start = new Date(staffMember.join_date)
                                          const end = new Date(staffMember.terminated_date)
                                          const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                                          
                                          // Less than 7 days - show days
                                          if (totalDays < 7) {
                                            return `${totalDays} day${totalDays !== 1 ? 's' : ''}`
                                          }
                                          
                                          // Less than 30 days - show weeks
                                          if (totalDays < 30) {
                                            const weeks = Math.floor(totalDays / 7)
                                            const remainingDays = totalDays % 7
                                            if (remainingDays > 0) {
                                              return `${weeks} week${weeks !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`
                                            }
                                            return `${weeks} week${weeks !== 1 ? 's' : ''}`
                                          }
                                          
                                          // Less than 365 days - show months
                                          if (totalDays < 365) {
                                            const months = Math.floor(totalDays / 30.44)
                                            return `${months} month${months !== 1 ? 's' : ''}`
                                          }
                                          
                                          // 365+ days - show years and months
                                          const totalMonths = Math.floor(totalDays / 30.44)
                                          const years = Math.floor(totalMonths / 12)
                                          const remainingMonths = totalMonths % 12
                                          
                                          if (remainingMonths > 0) {
                                            return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`
                                          }
                                          return `${years} year${years !== 1 ? 's' : ''}`
                                        })()}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-500">
                                    Joined: {staffMember.join_date 
                                      ? new Date(staffMember.join_date).toLocaleDateString('en-IN')
                                      : 'Not specified'
                                    }
                                  </span>
                                )}
                              </div>
                              
                              {/* Quick Actions */}
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {/* Edit Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedStaff(staffMember)
                                    setShowEditModal(true)
                                  }}
                                  className="group hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 overflow-hidden"
                                >
                                  <Edit className="h-4 w-4 flex-shrink-0" />
                                  <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                    Edit
                                  </span>
                                </Button>

                                {/* Update Salary Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedStaff(staffMember)
                                    setShowSalaryModal(true)
                                  }}
                                  className="group hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all duration-200 overflow-hidden"
                                >
                                  <DollarSign className="h-4 w-4 flex-shrink-0" />
                                  <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                    Salary
                                  </span>
                                </Button>

                                {/* Pay Salary Button - New */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedStaff(staffMember)
                                    setShowPaySalaryModal(true)
                                  }}
                                  className="group hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 transition-all duration-200 overflow-hidden"
                                >
                                  <Wallet className="h-4 w-4 flex-shrink-0" />
                                  <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                    Pay
                                  </span>
                                </Button>

                                {/* Salary History Button - New */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedStaff(staffMember)
                                    setShowSalaryHistoryModal(true)
                                  }}
                                  className="group hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all duration-200 overflow-hidden"
                                >
                                  <History className="h-4 w-4 flex-shrink-0" />
                                  <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                    History
                                  </span>
                                </Button>

                                {/* Activity Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedStaff(staffMember)
                                    setShowActivityModal(true)
                                  }}
                                  className="group hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-all duration-200 overflow-hidden"
                                >
                                  <Activity className="h-4 w-4 flex-shrink-0" />
                                  <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                    Activity
                                  </span>
                                </Button>

                                {/* Terminate Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (confirm(`Mark ${staffMember.full_name || 'this staff member'} as terminated?\n\nThis will change their status to 'Terminated'.`)) {
                                      try {
                                        console.log('Attempting to terminate staff:', staffMember.id)
                                        
                                        const { data, error} = await supabase
                                          .from('staff_details')
                                          .update({ 
                                            status: 'Terminated',
                                            terminated_date: new Date().toISOString().split('T')[0]
                                          })
                                          .eq('user_id', staffMember.user_id)
                                          .select()
                                        
                                        if (error) {
                                          console.error('Termination error:', error)
                                          alert(`❌ Failed to terminate staff member.\n\nError: ${error.message}\n\nPlease check database permissions.`)
                                        } else {
                                          console.log('Termination successful:', data)
                                          
                                          // Send WhatsApp notification if phone number is available
                                          if (staffMember.phone && /^\d{10}$/.test(staffMember.phone.replace(/\D/g, ''))) {
                                            try {
                                              console.log('📱 Sending WhatsApp termination notification...')
                                              
                                              // Get gym name
                                              const { data: gym } = await supabase
                                                .from('gyms')
                                                .select('name')
                                                .eq('id', currentGym?.id)
                                                .single()

                                              const gymName = gym?.name || 'Our Gym'

                                              // Import template function
                                              const { generateStaffTerminationMessage } = await import('@/lib/whatsapp-templates')

                                              // Generate termination message
                                              const message = generateStaffTerminationMessage({
                                                staffName: staffMember.full_name || 'Team Member',
                                                gymName: gymName,
                                                terminationDate: new Date().toLocaleDateString('en-IN', {
                                                  day: 'numeric',
                                                  month: 'long',
                                                  year: 'numeric'
                                                }),
                                                lastWorkingDay: new Date().toLocaleDateString('en-IN', {
                                                  day: 'numeric',
                                                  month: 'long',
                                                  year: 'numeric'
                                                })
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
                                                  to: staffMember.phone.replace(/\D/g, ''),
                                                  message,
                                                  messageType: 'staff_termination',
                                                  metadata: {
                                                    staff_id: staffMember.user_id,
                                                    termination_date: new Date().toISOString().split('T')[0]
                                                  },
                                                }),
                                              })

                                              if (response.ok) {
                                                console.log('✅ WhatsApp termination notification sent successfully!')
                                              } else {
                                                const error = await response.json()
                                                console.error('❌ Failed to send WhatsApp:', error)
                                              }
                                            } catch (whatsappError) {
                                              console.error('❌ WhatsApp notification error (non-critical):', whatsappError)
                                              // Don't block the termination process if WhatsApp fails
                                            }
                                          }

                                          alert(`✅ ${staffMember.full_name || 'Staff member'} marked as terminated successfully!`)
                                          refreshStaff()
                                        }
                                      } catch (err) {
                                        console.error('Unexpected error:', err)
                                        alert('An unexpected error occurred. Please try again.')
                                      }
                                    }
                                  }}
                                  className="group hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 overflow-hidden"
                                >
                                  <UserX className="h-4 w-4 flex-shrink-0" />
                                  <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                    Terminate
                                  </span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedStaff && (
        <StaffDetailsModal
          staff={selectedStaff}
          isOpen={showStaffDetails}
          onClose={() => {
            setShowStaffDetails(false)
            setSelectedStaff(null)
          }}
          onStaffUpdated={() => {
            // Refresh staff list
            refreshStaff()
          }}
        />
      )}

      {selectedStaff && (
        <EditStaffModal
          staff={selectedStaff}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedStaff(null)
          }}
          onStaffUpdated={() => {
            setShowEditModal(false)
            setSelectedStaff(null)
            refreshStaff()
          }}
        />
      )}

      {selectedStaff && (
        <SalaryUpdateModal
          staff={selectedStaff}
          isOpen={showSalaryModal}
          onClose={() => {
            setShowSalaryModal(false)
            setSelectedStaff(null)
          }}
          onSalaryUpdated={() => {
            setShowSalaryModal(false)
            setSelectedStaff(null)
            refreshStaff()
          }}
        />
      )}

      {selectedStaff && (
        <StaffActivityModal
          staff={selectedStaff}
          isOpen={showActivityModal}
          onClose={() => {
            setShowActivityModal(false)
            setSelectedStaff(null)
          }}
        />
      )}

      <StaffAdvancedFiltersModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyAdvancedFilters}
      />

      <PhotoZoomModal
        isOpen={showPhotoZoom}
        onClose={() => setShowPhotoZoom(false)}
        photoUrl={zoomPhotoUrl}
        memberName={zoomStaffName}
      />

      {/* Salary Payment Modal - New */}
      {selectedStaff && showPaySalaryModal && (
        <RecordSalaryPaymentModal
          staff={selectedStaff}
          gymId={gymId || ''}
          onClose={() => {
            setShowPaySalaryModal(false)
            setSelectedStaff(null)
          }}
          onSuccess={() => {
            refreshStaff()
          }}
        />
      )}

      {/* Salary History Modal - New */}
      {selectedStaff && showSalaryHistoryModal && (
        <SalaryHistoryModal
          staff={selectedStaff}
          gymId={gymId || ''}
          onClose={() => {
            setShowSalaryHistoryModal(false)
            setSelectedStaff(null)
          }}
        />
      )}
    </ProtectedRoute>
  )
}