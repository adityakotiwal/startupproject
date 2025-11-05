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
  Briefcase, 
  IndianRupee,
  Heart,
  Clock,
  Edit,
  DollarSign,
  Activity,
  Award,
  Building
} from 'lucide-react'
import EditStaffModal from './EditStaffModal'
import SalaryUpdateModal from './SalaryUpdateModal'
import StaffActivityModal from './StaffActivityModal'
import PhotoZoomModal from './PhotoZoomModal'

interface Staff {
  id: string
  user_id: string
  gym_id: string
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
  photo_url?: string
}

interface StaffDetailsModalProps {
  staff: Staff | null
  isOpen: boolean
  onClose: () => void
  onStaffUpdated: () => void
}

export default function StaffDetailsModal({ 
  staff, 
  isOpen, 
  onClose, 
  onStaffUpdated 
}: StaffDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  
  // Modal states for action buttons
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showPhotoZoom, setShowPhotoZoom] = useState(false)

  // Handle modal callbacks
  const handleStaffUpdated = () => {
    onStaffUpdated()
  }

  const handleSalaryUpdated = () => {
    onStaffUpdated()
  }

  if (!isOpen || !staff) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatSalary = (salary: number) => {
    return `₹${salary.toLocaleString('en-IN')}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'terminated': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const calculateExperience = () => {
    if (!staff.join_date) return 'Unknown'
    
    const joinDate = new Date(staff.join_date)
    const today = new Date()
    const monthsDiff = (today.getFullYear() - joinDate.getFullYear()) * 12 + 
                       (today.getMonth() - joinDate.getMonth())
    
    if (monthsDiff < 1) return 'Less than 1 month'
    if (monthsDiff < 12) return `${monthsDiff} month${monthsDiff > 1 ? 's' : ''}`
    
    const years = Math.floor(monthsDiff / 12)
    const remainingMonths = monthsDiff % 12
    
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`
    } else {
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              {staff.photo_url ? (
                <img
                  src={staff.photo_url}
                  alt={staff.full_name || 'Staff'}
                  onClick={() => setShowPhotoZoom(true)}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer hover:scale-110 hover:shadow-2xl transition-all duration-200"
                />
              ) : (
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                  {(staff.full_name || 'S').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {staff.full_name || 'Staff Member'}
                </h2>
                <p className="text-indigo-100">
                  {staff.role || 'Staff'} • {staff.join_date ? `Joined ${formatDate(staff.join_date)}` : 'Join date not specified'}
                </p>
                <div className="mt-2">
                  <Badge className={`${getStatusColor(staff.status)} text-xs`}>
                    {staff.status}
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
                      {staff.full_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <p className="text-gray-900">
                      {staff.role || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {staff.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-900">{staff.phone}</span>
                    </div>
                  )}
                  
                  {staff.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-900">{staff.email}</span>
                    </div>
                  )}
                  
                  {staff.address && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                      <span className="text-gray-900">{staff.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(staff.emergency_contact_name || staff.emergency_contact_phone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-600" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {staff.emergency_contact_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Person</label>
                      <p className="text-gray-900">{staff.emergency_contact_name}</p>
                    </div>
                  )}
                  {staff.emergency_contact_phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-900">{staff.emergency_contact_phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Employment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  Employment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.role || 'Staff Position'}</p>
                        <p className="text-sm text-gray-500">
                          Started {staff.join_date ? formatDate(staff.join_date) : 'Date not specified'}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Current
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employment Details Sidebar */}
          <div className="space-y-6">
            {/* Employment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  Employment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(staff.status)}>
                      {staff.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Experience</label>
                  <p className="text-gray-900 font-medium">{calculateExperience()}</p>
                </div>

                {staff.join_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Join Date</label>
                    <p className="text-gray-900">{formatDate(staff.join_date)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Salary Information */}
            {staff.salary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <IndianRupee className="h-5 w-5 mr-2 text-green-600" />
                    Salary Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Salary</label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatSalary(staff.salary)}
                    </p>
                    <p className="text-sm text-gray-500">per month</p>
                  </div>
                </CardContent>
              </Card>
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
                  Edit Staff
                </Button>
                <Button 
                  className="w-full hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors" 
                  variant="outline"
                  onClick={() => setShowSalaryModal(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Update Salary
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
        <EditStaffModal
          staff={staff}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onStaffUpdated={handleStaffUpdated}
        />

        <SalaryUpdateModal
          staff={staff}
          isOpen={showSalaryModal}
          onClose={() => setShowSalaryModal(false)}
          onSalaryUpdated={handleSalaryUpdated}
        />

        <StaffActivityModal
          staff={staff}
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
        />

        <PhotoZoomModal
          isOpen={showPhotoZoom}
          onClose={() => setShowPhotoZoom(false)}
          photoUrl={staff.photo_url || null}
          memberName={staff.full_name || 'Staff Member'}
        />
      </div>
    </div>
  )
}