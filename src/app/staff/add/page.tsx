'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/contexts/GymContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Briefcase, User, Phone, Mail, MapPin, IndianRupee, Calendar, UserPlus, Shield, Camera, Upload, X } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'

interface StaffFormData {
  full_name: string
  phone: string
  mobile_number: string
  email: string
  date_of_birth: string
  gender: string
  email_address: string
  permanent_address: string
  current_address: string
  address: string
  role: string
  join_date: string
  salary: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  aadhaar_number: string
  pan_number: string
  father_name: string
  bank_name: string
  account_holder_name: string
  account_number: string
  ifsc_code: string
  police_verification_number: string
  police_verification_date: string
  police_station_name: string
  date_of_joining: string
  work_hours: string
  payment_type: string
  course_name: string
  institute_name: string
  year_of_completion: string
}

export default function AddStaffPage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const router = useRouter()
  const isClient = useClientOnly()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  const [formData, setFormData] = useState<StaffFormData>({
    full_name: '',
    phone: '',
    mobile_number: '',
    email: '',
    date_of_birth: '',
    gender: '',
    email_address: '',
    permanent_address: '',
    current_address: '',
    address: '',
    role: '',
    join_date: new Date().toISOString().split('T')[0],
    salary: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    aadhaar_number: '',
    pan_number: '',
    father_name: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    police_verification_number: '',
    police_verification_date: '',
    police_station_name: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    work_hours: '',
    payment_type: 'Fixed',
    course_name: '',
    institute_name: '',
    year_of_completion: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      
      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name || !formData.phone || !formData.role) {
      setError('Please fill in all required fields (Name, Phone, Role)')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Use secure gym ID from context
      if (!gymId) {
        setError('No gym found. Please complete gym setup first.')
        return
      }

      // Validate phone number
      if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        setError('Please enter a valid 10-digit phone number')
        return
      }

      // Validate salary
      if (formData.salary && (isNaN(Number(formData.salary)) || Number(formData.salary) < 0)) {
        setError('Please enter a valid salary amount')
        return
      }

      // Generate a UUID for user_id (staff members are not auth users)
      const userId = crypto.randomUUID()

      // Upload photo if provided
      let photoUrl = null
      if (photoFile) {
        console.log('📸 Uploading staff photo...')
        setUploadingPhoto(true)
        
        try {
          const fileExt = photoFile.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `${fileName}`
          
          const { error: uploadError, data } = await supabase.storage
            .from('staff-photos')
            .upload(filePath, photoFile, {
              cacheControl: '3600',
              upsert: false
            })
          
          if (uploadError) {
            console.error('❌ Photo upload failed:', uploadError)
            setError(`Photo upload failed: ${uploadError.message}`)
            setUploadingPhoto(false)
            return
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('staff-photos')
            .getPublicUrl(filePath)
          
          photoUrl = publicUrl
          console.log('✅ Photo uploaded:', photoUrl)
        } catch (error) {
          console.error('❌ Photo upload error:', error)
          setError('Failed to upload photo')
          setUploadingPhoto(false)
          return
        } finally {
          setUploadingPhoto(false)
        }
      }

      // Prepare staff data - using individual columns
      const staffData = {
        user_id: userId,
        gym_id: gymId,
        status: 'Active' as const,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        mobile_number: formData.mobile_number.trim() || null,
        email: formData.email.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        email_address: formData.email_address.trim() || null,
        permanent_address: formData.permanent_address.trim() || null,
        current_address: formData.current_address.trim() || null,
        address: formData.address.trim() || null,
        role: formData.role.trim(),
        join_date: formData.join_date,
        date_of_joining: formData.date_of_joining,
        salary: formData.salary ? Number(formData.salary) : null,
        work_hours: formData.work_hours.trim() || null,
        payment_type: formData.payment_type || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        emergency_contact_relationship: formData.emergency_contact_relationship.trim() || null,
        aadhaar_number: formData.aadhaar_number.trim() || null,
        pan_number: formData.pan_number.trim() || null,
        father_name: formData.father_name.trim() || null,
        bank_name: formData.bank_name.trim() || null,
        account_holder_name: formData.account_holder_name.trim() || null,
        account_number: formData.account_number.trim() || null,
        ifsc_code: formData.ifsc_code.trim() || null,
        police_verification_number: formData.police_verification_number.trim() || null,
        police_verification_date: formData.police_verification_date || null,
        police_station_name: formData.police_station_name.trim() || null,
        course_name: formData.course_name.trim() || null,
        institute_name: formData.institute_name.trim() || null,
        year_of_completion: formData.year_of_completion.trim() || null,
        photo_url: photoUrl
      }

      console.log('💾 Creating staff member:', staffData)

      // Create staff record
      const { data: staff, error: staffError } = await supabase
        .from('staff_details')
        .insert([staffData])
        .select('*')
        .single()

      if (staffError) {
        console.error('Staff creation error:', staffError)
        
        // Provide more specific error messages
        if (staffError.message.includes('duplicate')) {
          setError('A staff member with this information already exists')
        } else if (staffError.message.includes('gym_id')) {
          setError('Invalid gym. Please refresh and try again')
        } else {
          setError(`Failed to add staff member: ${staffError.message}`)
        }
        return
      }

      console.log('✅ Staff member created successfully:', staff)

      // Send WhatsApp welcome message if phone number is available
      if (formData.phone && /^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        try {
          console.log('📱 Sending WhatsApp welcome message to staff...')
          
          // Get gym name
          const { data: gym } = await supabase
            .from('gyms')
            .select('name')
            .eq('id', gymId)
            .single()

          const gymName = gym?.name || 'Our Gym'

          // Import template function
          const { generateStaffWelcomeMessage } = await import('@/lib/whatsapp-templates')

          // Generate welcome message
          const message = generateStaffWelcomeMessage({
            staffName: formData.full_name,
            gymName: gymName,
            role: formData.role,
            joinDate: new Date(formData.join_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            salary: formData.salary ? Number(formData.salary) : undefined
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
              messageType: 'staff_welcome',
              metadata: {
                staff_id: staff.user_id,
                role: formData.role,
                join_date: formData.join_date
              },
            }),
          })

          if (response.ok) {
            console.log('✅ WhatsApp welcome message sent successfully!')
          } else {
            const error = await response.json()
            console.error('❌ Failed to send WhatsApp:', error)
          }
        } catch (whatsappError) {
          console.error('❌ WhatsApp notification error (non-critical):', whatsappError)
          // Don't block the staff creation process if WhatsApp fails
        }
      }

      // Navigate back to staff list
      router.push('/staff')

    } catch (error) {
      console.error('Unexpected error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Navigation Breadcrumb */}
            <div className="flex items-center space-x-2 pt-4 text-sm">
              <Link href="/dashboard" className="text-blue-100 hover:text-white transition-colors">
                Dashboard
              </Link>
              <span className="text-blue-300">/</span>
              <Link href="/staff" className="text-blue-100 hover:text-white transition-colors">
                Staff
              </Link>
              <span className="text-blue-300">/</span>
              <span className="text-white font-semibold">Add Staff</span>
            </div>
            
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <Link href="/staff">
                  <Button variant="outline" size="sm" className="bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-opacity-30">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Add New Staff Member</h1>
                    <p className="text-blue-100">Create a new staff record</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 text-red-400">⚠️</div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Add Staff Form */}
          <Card className="border-t-4 border-t-blue-500 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center text-blue-800">
                <div className="bg-blue-600 p-2 rounded-lg mr-3">
                  <User className="h-5 w-5 text-white" />
                </div>
                Personal Information
              </CardTitle>
              <CardDescription>
                Basic details about the staff member
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Photo Upload */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Staff preview"
                          className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer group">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border-4 border-dashed border-blue-400 flex flex-col items-center justify-center hover:border-blue-600 transition-all group-hover:scale-105">
                          <Camera className="h-10 w-10 text-blue-600 mb-2" />
                          <span className="text-xs text-blue-700 font-semibold">Add Photo</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      Full Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit phone number"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="staff@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">
                      Role/Position *
                    </Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="Manager">Manager</option>
                      <option value="Trainer">Trainer</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Cleaner">Cleaner</option>
                      <option value="Security">Security</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Nutritionist">Nutritionist</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile_number">
                      Mobile Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="mobile_number"
                        name="mobile_number"
                        type="tel"
                        value={formData.mobile_number}
                        onChange={handleInputChange}
                        placeholder="Alternate mobile number"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">
                      Date of Birth
                    </Label>
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">
                      Gender
                    </Label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_address">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email_address"
                        name="email_address"
                        type="email"
                        value={formData.email_address}
                        onChange={handleInputChange}
                        placeholder="staff@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permanent_address">
                      Permanent Address
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="permanent_address"
                        name="permanent_address"
                        type="text"
                        value={formData.permanent_address}
                        onChange={handleInputChange}
                        placeholder="Permanent address"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current_address">
                      Current Address
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="current_address"
                        name="current_address"
                        type="text"
                        value={formData.current_address}
                        onChange={handleInputChange}
                        placeholder="Current address"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Full address"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Employment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="join_date">
                      Join Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="join_date"
                        name="join_date"
                        type="date"
                        value={formData.join_date}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salary">
                      Monthly Salary (₹)
                    </Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="salary"
                        name="salary"
                        type="number"
                        value={formData.salary}
                        onChange={handleInputChange}
                        placeholder="25000"
                        className="pl-10"
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="work_hours">
                      Work Hours / Shift Timing
                    </Label>
                    <Input
                      id="work_hours"
                      name="work_hours"
                      type="text"
                      value={formData.work_hours}
                      onChange={handleInputChange}
                      placeholder="e.g., 9 AM - 6 PM"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_type">
                      Payment Type
                    </Label>
                    <select
                      id="payment_type"
                      name="payment_type"
                      value={formData.payment_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Fixed">Fixed</option>
                      <option value="Hourly">Hourly</option>
                      <option value="Commission">Commission</option>
                    </select>
                  </div>
                </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Card */}
          <Card className="border-t-4 border-t-red-500 shadow-lg mt-6">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
              <CardTitle className="flex items-center text-red-800">
                <div className="bg-red-600 p-2 rounded-lg mr-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                Emergency Contact
              </CardTitle>
              <CardDescription>
                Emergency contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_name">
                        Emergency Contact Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="emergency_contact_name"
                          name="emergency_contact_name"
                          type="text"
                          value={formData.emergency_contact_name}
                          onChange={handleInputChange}
                          placeholder="Contact person name"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_phone">
                        Emergency Contact Phone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="emergency_contact_phone"
                          name="emergency_contact_phone"
                          type="tel"
                          value={formData.emergency_contact_phone}
                          onChange={handleInputChange}
                          placeholder="Emergency contact number"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_relationship">
                        Relationship
                      </Label>
                      <Input
                        id="emergency_contact_relationship"
                        name="emergency_contact_relationship"
                        type="text"
                        value={formData.emergency_contact_relationship}
                        onChange={handleInputChange}
                        placeholder="e.g., Father, Mother, Spouse"
                      />
                    </div>
                  </div>
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card className="border-t-4 border-t-yellow-500 shadow-lg mt-6">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
              <CardTitle className="flex items-center text-yellow-800">
                <div className="bg-yellow-600 p-2 rounded-lg mr-3">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                Documents & Identity
              </CardTitle>
              <CardDescription>
                Identity proof and bank details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Identity Proof */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Identity Proof</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                      <Input
                        id="aadhaar_number"
                        name="aadhaar_number"
                        type="text"
                        value={formData.aadhaar_number}
                        onChange={handleInputChange}
                        placeholder="12-digit Aadhaar number"
                        maxLength={12}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pan_number">PAN Number</Label>
                      <Input
                        id="pan_number"
                        name="pan_number"
                        type="text"
                        value={formData.pan_number}
                        onChange={handleInputChange}
                        placeholder="PAN number"
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="father_name">Father's Name (as per PAN)</Label>
                      <Input
                        id="father_name"
                        name="father_name"
                        type="text"
                        value={formData.father_name}
                        onChange={handleInputChange}
                        placeholder="Father's full name"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        name="bank_name"
                        type="text"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        placeholder="Bank name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_holder_name">Account Holder Name</Label>
                      <Input
                        id="account_holder_name"
                        name="account_holder_name"
                        type="text"
                        value={formData.account_holder_name}
                        onChange={handleInputChange}
                        placeholder="Account holder name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        name="account_number"
                        type="text"
                        value={formData.account_number}
                        onChange={handleInputChange}
                        placeholder="Bank account number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifsc_code">IFSC Code</Label>
                      <Input
                        id="ifsc_code"
                        name="ifsc_code"
                        type="text"
                        value={formData.ifsc_code}
                        onChange={handleInputChange}
                        placeholder="IFSC code"
                        maxLength={11}
                      />
                    </div>
                  </div>
                </div>

                {/* Police Verification */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Police Verification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="police_verification_number">Verification Number / ID</Label>
                      <Input
                        id="police_verification_number"
                        name="police_verification_number"
                        type="text"
                        value={formData.police_verification_number}
                        onChange={handleInputChange}
                        placeholder="Verification number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="police_verification_date">Date of Issue</Label>
                      <Input
                        id="police_verification_date"
                        name="police_verification_date"
                        type="date"
                        value={formData.police_verification_date}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="police_station_name">Police Station Name</Label>
                      <Input
                        id="police_station_name"
                        name="police_station_name"
                        type="text"
                        value={formData.police_station_name}
                        onChange={handleInputChange}
                        placeholder="Police station name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Qualification Card (for trainers) */}
          <Card className="border-t-4 border-t-purple-500 shadow-lg mt-6">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardTitle className="flex items-center text-purple-800">
                <div className="bg-purple-600 p-2 rounded-lg mr-3">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                Qualification (if a trainer)
              </CardTitle>
              <CardDescription>
                Training certifications and qualifications
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="course_name">Course Name</Label>
                  <Input
                    id="course_name"
                    name="course_name"
                    type="text"
                    value={formData.course_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Certified Personal Trainer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institute_name">Institute Name</Label>
                  <Input
                    id="institute_name"
                    name="institute_name"
                    type="text"
                    value={formData.institute_name}
                    onChange={handleInputChange}
                    placeholder="Institute/Organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year_of_completion">Year of Completion</Label>
                  <Input
                    id="year_of_completion"
                    name="year_of_completion"
                    type="text"
                    value={formData.year_of_completion}
                    onChange={handleInputChange}
                    placeholder="e.g., 2023"
                    maxLength={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border-2 border-blue-200 mt-6">
            <Link href="/staff">
              <Button type="button" variant="outline" disabled={loading} className="px-6">
                Cancel
              </Button>
            </Link>
            <Button 
              onClick={handleSubmit}
              disabled={loading || uploadingPhoto} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-6 text-lg font-semibold shadow-lg"
            >
              {uploadingPhoto ? (
                <>
                  <Upload className="h-5 w-5 mr-2 animate-bounce" />
                  Uploading Photo...
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Adding Staff...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Add Staff Member
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}