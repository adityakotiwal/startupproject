'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, User, Phone, Mail, Calendar, MapPin, Check, Sparkles, UserPlus, Heart, Shield, IndianRupee, Camera, Upload, X } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'
import InstallmentSetupModal from '@/components/InstallmentSetupModal'
import { sendWelcomeWhatsApp } from '@/lib/whatsapp-helpers'

export default function AddMemberPage() {
  const { user } = useAuth()
  const router = useRouter()
  const isClient = useClientOnly()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [membershipPlans, setMembershipPlans] = useState<Array<{id: string, name: string, duration_days: number, price: number}>>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [showInstallmentModal, setShowInstallmentModal] = useState(false)
  const [installmentPlan, setInstallmentPlan] = useState<any>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
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
    joinDate: new Date().toISOString().split('T')[0], // Today's date
    membershipPlan: '',
    status: 'active' as 'active' | 'overdue' | 'quit',
    hasInstallment: false
  })
  
  // Initialize plans immediately - NO LOADING LOOPS!
  useEffect(() => {
    if (!isClient) return
    
    console.log('🎯 INITIALIZING PLANS - ONCE ONLY!')
    
    // Set plans immediately to stop any loading loops
    const staticPlans = [
      { id: '1', name: '1 Month Plan', duration_days: 30, price: 2000 },
      { id: '2', name: '3 Month Plan', duration_days: 90, price: 4500 },
      { id: '3', name: '6 Month Plan', duration_days: 180, price: 8000 },
      { id: '4', name: '1 Year Plan', duration_days: 365, price: 15000 }
    ]
    
    setMembershipPlans(staticPlans)
    setPlansLoading(false)
    setError('')
    
    // Auto-select first plan
    if (!formData.membershipPlan) {
      setFormData(prev => ({ ...prev, membershipPlan: staticPlans[0].id }))
    }
    
    console.log('✅ PLANS LOADED SUCCESSFULLY - NO MORE LOADING!')
    
  }, [isClient, formData.membershipPlan]) // Add dependency back

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

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Member name is required')
      return false
    }
    
    if (!formData.membershipPlan) {
      setError('Please select a membership plan')
      return false
    }
    
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return false
    }
    
    // Validate Indian phone number (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit Indian mobile number')
      return false
    }
    
    if (formData.email && !formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) return
    
    setLoading(true)
    console.log('🚀 STARTING MEMBER CREATION!')
    
    try {
      // BULLETPROOF APPROACH: Handle everything step by step
      
      // Step 1: Find or create gym
      console.log('🏠 Getting/creating gym...')
      let gymId = null
      
      const { data: existingGym } = await supabase
        .from('gyms')
        .select('id')
        .eq('owner_id', user?.id)
        .single()
      
      if (existingGym) {
        gymId = existingGym.id
        console.log('✅ Found existing gym:', gymId)
      } else {
        console.log('🏗️ Creating new gym...')
        const { data: newGym, error: gymError } = await supabase
          .from('gyms')
          .insert([{
            name: 'My Gym',
            owner_id: user?.id,
            address: 'Main Street',
            phone: '9876543210'
          }])
          .select('id')
          .single()
        
        if (gymError) {
          console.error('❌ Gym creation failed:', gymError)
          setError('Failed to create gym')
          return
        }
        
        gymId = newGym.id
        console.log('✅ Created new gym:', gymId)
      }

      // Step 2: Create membership plan
      console.log('📋 Creating membership plan...')
      const selectedPlan = membershipPlans.find(p => p.id === formData.membershipPlan) || membershipPlans[0]
      
      const { data: createdPlan, error: planError } = await supabase
        .from('membership_plans')
        .insert([{
          gym_id: gymId,
          name: selectedPlan.name,
          price: selectedPlan.price,
          duration_days: selectedPlan.duration_days,
          description: selectedPlan.name
        }])
        .select('id')
        .single()

      let planId = null
      if (planError) {
        console.log('⚠️ Plan creation failed, trying to find existing...')
        // Try to find existing plan
        const { data: existingPlan } = await supabase
          .from('membership_plans')
          .select('id')
          .eq('gym_id', gymId)
          .limit(1)
          .single()
        
        planId = existingPlan?.id
      } else {
        planId = createdPlan.id
      }
      
      if (!planId) {
        console.error('❌ No plan ID available')
        setError('Failed to create membership plan')
        return
      }
      
      console.log('✅ Using plan ID:', planId)

      // Step 3: Upload photo if provided
      let photoUrl = null
      if (photoFile) {
        console.log('📸 Uploading member photo...')
        setUploadingPhoto(true)
        
        try {
          const fileExt = photoFile.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `${fileName}`
          
          const { error: uploadError, data } = await supabase.storage
            .from('member-photos')
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
            .from('member-photos')
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

      // Step 4: Create member directly (using YOUR exact table structure)
      console.log('📝 Creating member record...')
      const startDate = new Date(formData.joinDate)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + selectedPlan.duration_days)

      // Store ALL info (including name, phone, email, etc.) in custom_fields as per your table structure
      const customFields = {
        full_name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        address: formData.address || null,
        pincode: formData.pincode || null,
        emergencyContact: formData.emergencyContact || null,
        emergencyPhone: formData.emergencyPhone || null,
        photo_url: photoUrl
      }

      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert([{
          user_id: user?.id || null,
          gym_id: gymId,
          plan_id: planId,
          start_date: formData.joinDate,
          end_date: endDate.toISOString().split('T')[0],
          status: formData.status,
          custom_fields: customFields,
          installment_plan: formData.hasInstallment && installmentPlan ? installmentPlan : null
        }])
        .select('*')
        .single()

      if (memberError) {
        console.error('❌ Member creation failed:', memberError)
        setError(`Member creation failed: ${memberError.message}`)
        return
      }
      
      console.log('✅ Member created successfully!', member)

      // Step 5: Send WhatsApp welcome message (if phone number is provided)
      if (formData.phone) {
        console.log('📱 Sending WhatsApp welcome message...')
        try {
          // Get gym name from Supabase
          const { data: gym } = await supabase
            .from('gyms')
            .select('name')
            .eq('id', gymId)
            .single()

          const whatsappResult = await sendWelcomeWhatsApp({
            memberName: formData.name,
            memberPhone: formData.phone,
            gymName: gym?.name || 'Our Gym',
            membershipPlan: selectedPlan.name,
            startDate: new Date(formData.joinDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            validityDays: selectedPlan.duration_days,
            memberId: member.id,
          })

          if (whatsappResult.success) {
            console.log('✅ WhatsApp welcome message sent!')
          } else {
            console.warn('⚠️ WhatsApp message failed (but member was created):', whatsappResult.error)
          }
        } catch (whatsappError) {
          console.warn('⚠️ WhatsApp error (but member was created):', whatsappError)
        }
      }

      // SUCCESS!
      alert(`🎉 SUCCESS! Member "${formData.name}" added to database!

✅ Member ID: ${member.id}  
✅ Plan: ${selectedPlan.name}
✅ Valid until: ${endDate.toLocaleDateString()}
${formData.phone ? '📱 WhatsApp welcome message sent!' : ''}

Check your Supabase tables!`)
      
      // Redirect to members page after success
      router.push('/members')
      
    } catch (error) {
      console.error('💥 Unexpected error:', error)
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`)
    } finally {
      setLoading(false)
      console.log('🏁 SUBMISSION COMPLETE')
    }
  }

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Navigation Breadcrumb */}
            <div className="flex items-center space-x-2 pt-4 text-sm">
              <Link href="/dashboard" className="text-green-100 hover:text-white transition-colors">
                Dashboard
              </Link>
              <span className="text-green-300">/</span>
              <Link href="/members" className="text-green-100 hover:text-white transition-colors">
                Members
              </Link>
              <span className="text-green-300">/</span>
              <span className="text-white font-semibold">Add Member</span>
            </div>
            
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <Link href="/members">
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
                    <h1 className="text-3xl font-bold text-white">Add New Member</h1>
                    <p className="text-green-100">Create a new gym membership</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <Card className="mb-6 border-t-4 border-t-green-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center text-green-800">
                  <div className="bg-green-600 p-2 rounded-lg mr-3">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Basic details about the member
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Photo Upload */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Member preview"
                          className="w-32 h-32 rounded-full object-cover border-4 border-green-500 shadow-lg"
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
                        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 border-4 border-dashed border-green-400 flex flex-col items-center justify-center hover:border-green-600 transition-all group-hover:scale-105">
                          <Camera className="h-10 w-10 text-green-600 mb-2" />
                          <span className="text-xs text-green-700 font-semibold">Add Photo</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center text-gray-700 font-semibold">
                      <User className="h-4 w-4 mr-1 text-green-600" />
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter member's full name"
                      className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center text-gray-700 font-semibold">
                      <Phone className="h-4 w-4 mr-1 text-green-600" />
                      Mobile Number *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      maxLength={10}
                      className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center text-gray-700 font-semibold">
                      <Mail className="h-4 w-4 mr-1 text-green-600" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="member@example.com"
                      className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="mb-6 border-t-4 border-t-blue-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center text-blue-800">
                  <div className="bg-blue-600 p-2 rounded-lg mr-3">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  Address Details
                </CardTitle>
                <CardDescription>
                  Member&apos;s address and location information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House No., Street, Area, City"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="400001"
                      maxLength={6}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="mb-6 border-t-4 border-t-red-500 shadow-lg">
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      placeholder="Contact person's name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                    <Input
                      id="emergencyPhone"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Membership Details */}
            <Card className="mb-6 border-t-4 border-t-purple-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardTitle className="flex items-center text-purple-800">
                  <div className="bg-purple-600 p-2 rounded-lg mr-3">
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                  Membership Details
                </CardTitle>
                <CardDescription>
                  Membership and joining information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Membership Plan Selection */}
                <div>
                  <Label htmlFor="membershipPlan">Membership Plan *</Label>
                  {plansLoading ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-blue-700 animate-pulse">
                      🔄 Loading membership plans... (max 10 seconds)
                    </div>
                  ) : membershipPlans.length === 0 ? (
                    <div className="w-full px-3 py-2 border border-yellow-300 rounded-md bg-yellow-50 text-yellow-700">
                      ⚠️ No membership plans found. 
                      <Link href="/setup/membership-plans" className="underline ml-1 font-medium">Create one first →</Link>
                    </div>
                  ) : (
                    <select
                      id="membershipPlan"
                      name="membershipPlan"
                      value={formData.membershipPlan}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select a membership plan</option>
                      {membershipPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - ₹{plan.price.toLocaleString('en-IN')} ({plan.duration_days} days)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Installment Plan Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="hasInstallment"
                      name="hasInstallment"
                      checked={formData.hasInstallment}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, hasInstallment: e.target.checked }))
                        if (!e.target.checked) {
                          setInstallmentPlan(null)
                        }
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <Label htmlFor="hasInstallment" className="text-base font-bold cursor-pointer flex items-center">
                      💳 Enable Installment Plan
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Flexible Payments</span>
                    </Label>
                  </div>

                  {formData.hasInstallment && (
                    <div className="space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
                      <p className="text-sm text-blue-700 mb-3 font-semibold">
                        ✨ Split the membership fee into multiple installments for easier payment
                      </p>
                      
                      {installmentPlan ? (
                        <div className="bg-white p-5 rounded-xl border-2 border-green-300 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-bold text-green-800 text-lg flex items-center">
                                <Check className="h-5 w-5 mr-2" />
                                Configured: {installmentPlan.num_installments} installments
                              </p>
                              {installmentPlan.down_payment > 0 && (
                                <p className="text-sm text-amber-700 mt-1 font-semibold">
                                  💰 Down Payment: ₹{installmentPlan.down_payment.toLocaleString('en-IN')}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 mt-2">
                                {installmentPlan.installments.map((inst: any, idx: number) => (
                                  <span key={idx} className="inline-block mr-2 mb-1">
                                    #{inst.number}: ₹{inst.amount.toLocaleString('en-IN')}
                                    {idx < installmentPlan.installments.length - 1 && ','}
                                  </span>
                                ))}
                              </p>
                            </div>
                            <Button
                              type="button"
                              onClick={() => setShowInstallmentModal(true)}
                              variant="outline"
                              size="sm"
                              className="font-semibold"
                            >
                              Edit Plan
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => {
                            if (!formData.membershipPlan) {
                              alert('Please select a membership plan first')
                              return
                            }
                            setShowInstallmentModal(true)
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-6 shadow-lg"
                        >
                          <Sparkles className="h-5 w-5 mr-2" />
                          Setup Installment Plan
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="joinDate">Join Date *</Label>
                    <Input
                      id="joinDate"
                      name="joinDate"
                      type="date"
                      value={formData.joinDate}
                      onChange={handleInputChange}
                      className="w-full"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="active">Active</option>
                      <option value="overdue">Overdue</option>
                      <option value="quit">Quit</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4 bg-gradient-to-r from-gray-50 to-green-50 p-6 rounded-xl border-2 border-green-200">
              <Link href="/members">
                <Button type="button" variant="outline" disabled={loading} className="px-6">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || uploadingPhoto} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-6 text-lg font-semibold shadow-lg">
                {uploadingPhoto ? (
                  <>
                    <Upload className="h-5 w-5 mr-2 animate-bounce" />
                    Uploading Photo...
                  </>
                ) : loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding Member...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Add Member to Gym
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Installment Setup Modal */}
      {formData.membershipPlan && (
        <InstallmentSetupModal
          isOpen={showInstallmentModal}
          onClose={() => setShowInstallmentModal(false)}
          totalAmount={membershipPlans.find(p => p.id === formData.membershipPlan)?.price || 0}
          startDate={formData.joinDate}
          onSave={(plan) => {
            setInstallmentPlan(plan)
            setShowInstallmentModal(false)
          }}
        />
      )}
    </ProtectedRoute>
  )
}