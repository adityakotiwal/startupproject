'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/contexts/GymContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Calendar, IndianRupee, User, Users, Briefcase } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'

// Staff interface matching the table structure
interface Staff {
  id: string
  user_id: string
  gym_id: string
  status: 'Active' | 'Inactive' | 'Terminated'
  employment_details: {
    full_name?: string
    phone?: string
    email?: string
    address?: string
    role?: string
    join_date?: string
    salary?: number
    emergency_contact_name?: string
    emergency_contact_phone?: string
  } | null
  created_at: string
  updated_at?: string
}

export default function StaffDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const isClient = useClientOnly()
  
  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const staffId = params?.id as string

  useEffect(() => {
    if (!isClient || !user || gymLoading || !gymId || !staffId) {
      return
    }

    fetchStaffDetails()
  }, [isClient, user, gymId, gymLoading, staffId])

  const fetchStaffDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching staff details for ID:', staffId, 'Gym:', gymId)

      // Fetch staff details - SECURE BY GYM_ID
      const { data, error } = await supabase
        .from('staff_details')
        .select('*')
        .eq('id', staffId)
        .eq('gym_id', gymId) // Ensure staff belongs to current gym
        .single()

      if (error) {
        console.error('Error fetching staff details:', error)
        if (error.code === 'PGRST116') {
          setError('Staff member not found or you do not have permission to view this record.')
        } else {
          setError('Failed to load staff details.')
        }
        return
      }

      console.log('✅ Staff details loaded:', data)
      setStaff(data)

    } catch (error) {
      console.error('Unexpected error:', error)
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: 'Active' | 'Inactive' | 'Terminated') => {
    if (!staff) return

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('staff_details')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', staff.id)
        .eq('gym_id', gymId) // Ensure we're updating the right gym's staff

      if (error) {
        console.error('Error updating status:', error)
        alert('Failed to update staff status')
        return
      }

      // Update local state
      setStaff(prev => prev ? { ...prev, status: newStatus } : null)
      console.log('✅ Staff status updated to:', newStatus)

    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!staff) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${staff.employment_details?.full_name || 'this staff member'}? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeleteLoading(true)

      const { error } = await supabase
        .from('staff_details')
        .delete()
        .eq('id', staff.id)
        .eq('gym_id', gymId) // Ensure we're deleting from the right gym

      if (error) {
        console.error('Error deleting staff:', error)
        alert('Failed to delete staff member')
        return
      }

      console.log('✅ Staff member deleted')
      router.push('/staff')

    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred')
    } finally {
      setDeleteLoading(false)
    }
  }

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

  if (!isClient) {
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading staff details...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !staff) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Staff Member Not Found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error || 'The staff member you are looking for does not exist or you do not have permission to view it.'}
              </p>
              <div className="mt-6">
                <Link
                  href="/staff"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Staff
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Navigation */}
            <div className="flex justify-between items-center py-4 border-b border-gray-100">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                    <Briefcase className="h-6 w-6" />
                    <span className="font-bold text-lg">GymSync Pro</span>
                  </Link>
                </div>
                
                {/* Navigation Menu */}
                <nav className="hidden md:flex space-x-8">
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link href="/members" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Members
                  </Link>
                  <Link href="/staff" className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium">
                    Staff
                  </Link>
                  <Link href="/payments" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Payments
                  </Link>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {currentGym?.name || 'Loading gym...'}
                </span>
              </div>
            </div>

            {/* Page Header */}
            <div className="py-6">
              <div className="flex items-center space-x-4 mb-4">
                <Link 
                  href="/staff"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Staff</span>
                </Link>
              </div>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-2xl">
                      {staff.employment_details?.full_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {staff.employment_details?.full_name || 'No Name'}
                    </h1>
                    <div className="flex items-center space-x-3 mt-2">
                      <p className="text-gray-600 text-lg">
                        {staff.employment_details?.role || 'No Role'}
                      </p>
                      {getStatusBadge(staff.status)}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex items-center space-x-2"
                    onClick={() => router.push(`/staff/${staff.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="text-gray-900">{formatPhone(staff.employment_details?.phone || null)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-900">{staff.employment_details?.email || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Address</p>
                      <p className="text-gray-900">{staff.employment_details?.address || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Employment Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Role</p>
                        <p className="text-gray-900">{staff.employment_details?.role || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Join Date</p>
                        <p className="text-gray-900">
                          {staff.employment_details?.join_date 
                            ? new Date(staff.employment_details.join_date).toLocaleDateString('en-IN')
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <IndianRupee className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Salary</p>
                        <p className="text-gray-900">{formatSalary(staff.employment_details?.salary || null)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Emergency Contact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contact Name</p>
                        <p className="text-gray-900">{staff.employment_details?.emergency_contact_name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Contact Phone</p>
                        <p className="text-gray-900">{formatPhone(staff.employment_details?.emergency_contact_phone || null)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Status Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Status Management</CardTitle>
                  <CardDescription>Update staff member status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Current Status</p>
                    {getStatusBadge(staff.status)}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Change Status</p>
                    <div className="space-y-2">
                      {['Active', 'Inactive', 'Terminated'].map((status) => (
                        <Button
                          key={status}
                          variant={staff.status === status ? "default" : "outline"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleStatusUpdate(status as 'Active' | 'Inactive' | 'Terminated')}
                          disabled={staff.status === status || loading}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Staff ID</p>
                    <p className="text-xs text-gray-500 font-mono">{staff.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Added On</p>
                    <p className="text-sm text-gray-900">
                      {new Date(staff.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {staff.updated_at && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Updated</p>
                      <p className="text-sm text-gray-900">
                        {new Date(staff.updated_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>Irreversible and destructive actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Staff Member
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}