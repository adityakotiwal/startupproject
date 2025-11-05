'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Save, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin,
  Heart,
  Loader2,
  Edit
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
    photo_url?: string | null
  } | null
  created_at: string
  updated_at: string
  membership_plans?: {
    name: string
    price: number
    duration_days: number
  }
}

interface EditMemberModalProps {
  member: Member | null
  isOpen: boolean
  onClose: () => void
  onMemberUpdated: () => void
  membershipPlans: Array<{ id: string; name: string; price: number; duration_days: number }>
}

export default function EditMemberModal({ 
  member, 
  isOpen, 
  onClose, 
  onMemberUpdated,
  membershipPlans 
}: EditMemberModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    pincode: '',
    emergencyContact: '',
    emergencyPhone: '',
    plan_id: '',
    status: 'active' as 'active' | 'inactive' | 'expired' | 'suspended'
  })

  useEffect(() => {
    if (member && isOpen) {
      setFormData({
        full_name: member.custom_fields?.full_name || '',
        phone: member.custom_fields?.phone || '',
        email: member.custom_fields?.email || '',
        dateOfBirth: member.custom_fields?.dateOfBirth || '',
        gender: member.custom_fields?.gender || '',
        address: member.custom_fields?.address || '',
        pincode: member.custom_fields?.pincode || '',
        emergencyContact: member.custom_fields?.emergencyContact || '',
        emergencyPhone: member.custom_fields?.emergencyPhone || '',
        plan_id: member.plan_id,
        status: member.status
      })
    }
  }, [member, isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!member) return

    setLoading(true)
    try {
      console.log('Updating member:', member.id)
      console.log('Form data:', formData)
      
      // Preserve existing photo_url from custom_fields
      const existingPhotoUrl = member.custom_fields?.photo_url || null
      
      const { error } = await supabase
        .from('members')
        .update({
          custom_fields: {
            full_name: formData.full_name,
            phone: formData.phone,
            email: formData.email,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            address: formData.address,
            pincode: formData.pincode,
            emergencyContact: formData.emergencyContact,
            emergencyPhone: formData.emergencyPhone,
            photo_url: existingPhotoUrl  // Preserve the photo URL
          },
          plan_id: formData.plan_id,
          status: formData.status
        })
        .eq('id', member.id)

      if (error) {
        console.error('Error updating member:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        alert(`Failed to update member: ${error.message || 'Please try again.'}`)
        return
      }
      
      console.log('✅ Member updated successfully')
      alert('Member updated successfully! 🎉')
      onMemberUpdated()
      onClose()
    } catch (error: any) {
      console.error('Unexpected error:', error)
      alert(`An unexpected error occurred: ${error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Edit className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Edit Member</h2>
                <p className="text-green-100">Update member information</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-green-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter full address"
                  />
                </div>

                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    placeholder="Enter pincode"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Enter emergency contact name"
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    placeholder="Enter emergency contact phone"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Membership Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Membership Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan_id">Membership Plan</Label>
                    <select
                      id="plan_id"
                      value={formData.plan_id}
                      onChange={(e) => handleInputChange('plan_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Membership Plan</option>
                      {membershipPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - ₹{plan.price} ({plan.duration_days} days)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="status">Member Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="expired">Expired</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !formData.full_name}
              className="bg-gradient-to-r from-green-600 to-blue-600"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}