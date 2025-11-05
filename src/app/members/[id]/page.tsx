'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit2, Save, X, User, Phone, Mail, Calendar, MapPin, Trash2 } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'

interface Member {
  id: string
  name: string
  phone: string
  email: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  join_date: string
  status: 'active' | 'overdue' | 'quit'
  custom_fields: {
    pincode?: string
    emergencyContact?: string
    emergencyPhone?: string
  } | null
  created_at: string
  updated_at: string
}

export default function MemberDetailsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const isClient = useClientOnly()
  
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    pincode: '',
    emergencyContact: '',
    emergencyPhone: '',
    status: 'active' as 'active' | 'overdue' | 'quit'
  })

  const fetchMember = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching member:', error)
        setError('Member not found')
      } else {
        setMember(data)
        // Initialize form data
        setFormData({
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          dateOfBirth: data.date_of_birth || '',
          gender: data.gender || '',
          address: data.address || '',
          pincode: data.custom_fields?.pincode || '',
          emergencyContact: data.custom_fields?.emergencyContact || '',
          emergencyPhone: data.custom_fields?.emergencyPhone || '',
          status: data.status
        })
      }
    } catch (error) {
      console.error('Error in fetchMember:', error)
      setError('Failed to load member details')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchMember()
    }
  }, [params.id, fetchMember])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    
    try {
      // Clean phone number
      const cleanPhone = formData.phone.replace(/\D/g, '')
      
      const updateData = {
        name: formData.name.trim(),
        phone: cleanPhone,
        email: formData.email.trim() || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        address: formData.address.trim() || null,
        status: formData.status,
        custom_fields: {
          pincode: formData.pincode || null,
          emergencyContact: formData.emergencyContact || null,
          emergencyPhone: formData.emergencyPhone || null,
        }
      }

      const { error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', params.id)

      if (error) {
        console.error('Error updating member:', error)
        setError('Failed to update member')
      } else {
        setEditing(false)
        fetchMember() // Refresh data
      }
    } catch (error) {
      console.error('Error in handleSave:', error)
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', params.id)

      if (error) {
        console.error('Error deleting member:', error)
        setError('Failed to delete member')
      } else {
        router.push('/members')
      }
    } catch (error) {
      console.error('Error in handleDelete:', error)
      setError('An unexpected error occurred')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const formatPhone = (phone: string) => {
    if (phone.length === 10) {
      return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
    }
    return phone
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-yellow-100 text-yellow-800'
      case 'quit': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isClient || loading) {
    return <div>Loading...</div>
  }

  if (error && !member) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Link href="/members">
                <Button>Back to Members</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  if (!member) return null

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <Link href="/members">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Members
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
                  <p className="text-gray-600">Member since {formatDate(member.join_date)}</p>
                </div>
                <Badge className={getStatusColor(member.status)}>
                  {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {editing ? (
                  <>
                    <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} size="sm">
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      onClick={handleDelete} 
                      disabled={deleting}
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      {deleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  {editing ? (
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{member.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Mobile Number</Label>
                  {editing ? (
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      maxLength={10}
                      required
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{formatPhone(member.phone)}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  {editing ? (
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{member.email || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  {editing ? (
                    <Input
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {member.date_of_birth ? formatDate(member.date_of_birth) : 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Gender</Label>
                  {editing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  {editing ? (
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="active">Active</option>
                      <option value="overdue">Overdue</option>
                      <option value="quit">Quit</option>
                    </select>
                  ) : (
                    <Badge className={getStatusColor(member.status)}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Address Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Address</Label>
                {editing ? (
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House No., Street, Area, City"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{member.address || 'Not provided'}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Pincode</Label>
                  {editing ? (
                    <Input
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="400001"
                      maxLength={6}
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {member.custom_fields?.pincode || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Emergency Contact Name</Label>
                  {editing ? (
                    <Input
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      placeholder="Contact person's name"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {member.custom_fields?.emergencyContact || 'Not provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Emergency Phone</Label>
                  {editing ? (
                    <Input
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {member.custom_fields?.emergencyPhone ? 
                        formatPhone(member.custom_fields.emergencyPhone) : 
                        'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Membership Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Join Date</span>
                  <span className="text-gray-900">{formatDate(member.join_date)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Member Since</span>
                  <span className="text-gray-900">
                    {Math.floor((new Date().getTime() - new Date(member.join_date).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Last Updated</span>
                  <span className="text-gray-900">{formatDate(member.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}