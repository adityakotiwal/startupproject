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
  MapPin,
  Briefcase,
  Heart,
  Loader2,
  Edit
} from 'lucide-react'

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
}

interface EditStaffModalProps {
  staff: Staff | null
  isOpen: boolean
  onClose: () => void
  onStaffUpdated: () => void
}

export default function EditStaffModal({ 
  staff, 
  isOpen, 
  onClose, 
  onStaffUpdated
}: EditStaffModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    role: '',
    join_date: '',
    salary: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Terminated'
  })

  useEffect(() => {
    if (staff && isOpen) {
      setFormData({
        full_name: staff.full_name || '',
        phone: staff.phone || '',
        email: staff.email || '',
        address: staff.address || '',
        role: staff.role || '',
        join_date: staff.join_date || '',
        salary: staff.salary ? staff.salary.toString() : '',
        emergency_contact_name: staff.emergency_contact_name || '',
        emergency_contact_phone: staff.emergency_contact_phone || '',
        status: staff.status
      })
    }
  }, [staff, isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!staff) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('staff_details')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          role: formData.role,
          join_date: formData.join_date || null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          status: formData.status
        })
        .eq('user_id', staff.user_id)

      if (error) {
        console.error('Error updating staff:', error)
        alert('Failed to update staff member. Please try again.')
      } else {
        // Check if role changed to send WhatsApp notification
        const roleChanged = staff.role !== formData.role
        
        if (roleChanged && formData.phone && /^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
          try {
            console.log('📱 Sending WhatsApp role change notification...')
            
            // Get gym name
            const { data: gym } = await supabase
              .from('gyms')
              .select('name')
              .eq('id', staff.gym_id)
              .single()

            const gymName = gym?.name || 'Our Gym'

            // Import template function
            const { generateStaffRoleChangeNotification } = await import('@/lib/whatsapp-templates')

            // Generate role change message
            const message = generateStaffRoleChangeNotification({
              staffName: formData.full_name,
              gymName: gymName,
              oldRole: staff.role || 'N/A',
              newRole: formData.role,
              effectiveDate: new Date().toLocaleDateString('en-IN', {
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
                to: formData.phone.replace(/\D/g, ''),
                message,
                messageType: 'staff_role_change',
                metadata: {
                  staff_id: staff.user_id,
                  old_role: staff.role,
                  new_role: formData.role
                },
              }),
            })

            if (response.ok) {
              console.log('✅ WhatsApp role change notification sent successfully!')
            } else {
              const error = await response.json()
              console.error('❌ Failed to send WhatsApp:', error)
            }
          } catch (whatsappError) {
            console.error('❌ WhatsApp notification error (non-critical):', whatsappError)
            // Don't block the edit process if WhatsApp fails
          }
        }

        alert('Staff member updated successfully! 🎉')
        onStaffUpdated()
        onClose()
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !staff) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Edit className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Edit Staff Member</h2>
                <p className="text-blue-100">Update staff information and employment details</p>
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

                <div>
                  <Label htmlFor="role">Role/Position</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    <option value="Trainer">Trainer</option>
                    <option value="Manager">Manager</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Nutritionist">Nutritionist</option>
                    <option value="Other">Other</option>
                  </select>
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

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter full address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Employment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-purple-600" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="join_date">Join Date</Label>
                  <Input
                    id="join_date"
                    type="date"
                    value={formData.join_date}
                    onChange={(e) => handleInputChange('join_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="salary">Monthly Salary (₹)</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => handleInputChange('salary', e.target.value)}
                    placeholder="Enter monthly salary"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Employment Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Terminated">Terminated</option>
                  </select>
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
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    placeholder="Enter emergency contact name"
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    placeholder="Enter emergency contact phone"
                  />
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
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
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