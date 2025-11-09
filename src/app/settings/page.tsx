'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/contexts/GymContext'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Settings, 
  User, 
  Building2, 
  Bell, 
  Lock, 
  Palette, 
  Database,
  Mail,
  Phone,
  MapPin,
  Save,
  Edit,
  Check,
  X,
  Camera,
  Shield,
  Globe,
  Clock,
  CreditCard,
  Users,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Calendar,
  Plus,
  Award,
  TrendingDown,
  BarChart3
} from 'lucide-react'
import ProtectedPage from '@/components/ProtectedPage'
import { useClientOnly } from '@/hooks/useClientOnly'

interface GymSettings {
  id: string
  name: string
  owner_id: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  timezone?: string
  currency?: string
  operating_hours?: {
    monday?: { open: string; close: string; closed?: boolean }
    tuesday?: { open: string; close: string; closed?: boolean }
    wednesday?: { open: string; close: string; closed?: boolean }
    thursday?: { open: string; close: string; closed?: boolean }
    friday?: { open: string; close: string; closed?: boolean }
    saturday?: { open: string; close: string; closed?: boolean }
    sunday?: { open: string; close: string; closed?: boolean }
  }
  social_media?: {
    instagram?: string
    facebook?: string
    twitter?: string
    youtube?: string
    linkedin?: string
  }
  max_capacity?: number
  amenities?: string[]
  trainer_certifications?: string[]
  created_at: string
}

interface ProfileSettings {
  id: string
  full_name: string
  email?: string
  phone?: string
  avatar_url?: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const isClient = useClientOnly()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Profile settings
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    id: user?.id || '',
    full_name: user?.full_name || user?.name || '',
    email: user?.email || '',
    phone: '',
    avatar_url: ''
  })
  
  // Gym settings
  const [gymSettings, setGymSettings] = useState<GymSettings | null>(null)
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    membershipExpiry: true,
    paymentReminders: true,
    staffUpdates: false,
    equipmentMaintenance: true,
    newMemberJoined: true,
    lowAttendance: false,
    monthlyReports: true
  })

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: '30'
  })

  // Operating hours
  const [showOperatingHours, setShowOperatingHours] = useState(false)
  
  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const availableAmenities = [
    'Air Conditioning', 'Parking', 'Locker Room', 'Shower', 'WiFi', 
    'Sauna', 'Steam Room', 'Juice Bar', 'Cardio Area', 'Free Weights',
    'Personal Training', 'Group Classes', 'Yoga Studio', 'CrossFit',
    'Swimming Pool', 'Spa', 'Massage', 'Nutritionist'
  ]

  // Trainer certifications
  const [certifications, setCertifications] = useState<string[]>([])
  const [newCertification, setNewCertification] = useState('')

  useEffect(() => {
    if (user && gymId) {
      fetchSettings()
    }
  }, [user, gymId])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      
      // Fetch gym settings
      if (gymId) {
        const { data: gymData, error: gymError } = await supabase
          .from('gyms')
          .select('*')
          .eq('id', gymId)
          .single()
        
        if (!gymError && gymData) {
          setGymSettings(gymData)
          
          // Set amenities if available
          if (gymData.amenities) {
            setSelectedAmenities(gymData.amenities)
          }
          
          // Set certifications if available
          if (gymData.trainer_certifications) {
            setCertifications(gymData.trainer_certifications)
          }
        }
      }
      
      // Fetch profile settings
      if (user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!profileError && profileData) {
          setProfileSettings({
            id: profileData.id,
            full_name: profileData.full_name || '',
            email: user.email || '',
            phone: profileData.phone || '',
            avatar_url: profileData.avatar_url || ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileSettings.full_name,
          phone: profileSettings.phone,
          avatar_url: profileSettings.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)
      
      if (error) throw error
      
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGym = async () => {
    if (!gymSettings) return
    
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('gyms')
        .update({
          name: gymSettings.name,
          address: gymSettings.address,
          phone: gymSettings.phone,
          email: gymSettings.email,
          website: gymSettings.website,
          logo_url: gymSettings.logo_url,
          timezone: gymSettings.timezone,
          currency: gymSettings.currency,
          operating_hours: gymSettings.operating_hours,
          social_media: gymSettings.social_media,
          max_capacity: gymSettings.max_capacity,
          amenities: selectedAmenities,
          trainer_certifications: certifications
        })
        .eq('id', gymId)
      
      if (error) throw error
      
      setSuccessMessage('Gym settings updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving gym settings:', error)
      alert('Failed to save gym settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!securitySettings.newPassword || !securitySettings.confirmPassword) {
      alert('Please enter new password and confirm it')
      return
    }
    
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    
    if (securitySettings.newPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }
    
    try {
      setSaving(true)
      
      const { error } = await supabase.auth.updateUser({
        password: securitySettings.newPassword
      })
      
      if (error) throw error
      
      setSuccessMessage('Password changed successfully!')
      setSecuritySettings({
        ...securitySettings,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }
    
    try {
      setSaving(true)
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${gymId}/logo.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('gym-assets')
        .upload(fileName, file, { upsert: true })
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gym-assets')
        .getPublicUrl(fileName)
      
      // Update local state
      if (gymSettings) {
        setGymSettings({ ...gymSettings, logo_url: publicUrl })
      }
      
      // Save to database immediately
      const { error: dbError } = await supabase
        .from('gyms')
        .update({ logo_url: publicUrl })
        .eq('id', gymId)
      
      if (dbError) {
        console.error('Database update error:', dbError)
        throw new Error(`Database update failed: ${dbError.message}`)
      }
      
      setSuccessMessage('Logo uploaded successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      alert(error.message || 'Failed to upload logo')
    } finally {
      setSaving(false)
    }
  }

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }
    
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }
    
    try {
      setSaving(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/avatar.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true })
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName)
      
      // Update local state
      setProfileSettings({ ...profileSettings, avatar_url: publicUrl })
      
      // Save to database immediately
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)
      
      if (dbError) {
        console.error('Database update error:', dbError)
        throw new Error(`Failed to save avatar URL: ${dbError.message}`)
      }
      
      setSuccessMessage('Profile picture uploaded successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Error uploading profile picture:', error)
      alert(error.message || 'Failed to upload profile picture')
    } finally {
      setSaving(false)
    }
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    )
  }

  const addCertification = () => {
    if (newCertification.trim()) {
      setCertifications([...certifications, newCertification.trim()])
      setNewCertification('')
    }
  }

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, color: 'blue' },
    { id: 'gym', name: 'Gym Info', icon: Building2, color: 'purple' },
    { id: 'notifications', name: 'Notifications', icon: Bell, color: 'green' },
    { id: 'security', name: 'Security', icon: Shield, color: 'red' },
    { id: 'preferences', name: 'Preferences', icon: Palette, color: 'orange' }
  ]

  if (!isClient) {
    return (
      <ProtectedPage>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">Loading...</div>
          </main>
        </div>
      </ProtectedPage>
    )
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header */}
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <Settings className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">Settings</h1>
                      <p className="text-slate-300 mt-1">Manage your account and gym preferences</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm">All systems operational</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Last sync: Just now</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="h-16 w-16 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">{successMessage}</span>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="mb-6 bg-white rounded-2xl shadow-lg p-2">
            <div className="flex space-x-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const colorClasses = {
                  blue: isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100',
                  purple: isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100',
                  green: isActive ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100',
                  red: isActive ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100',
                  orange: isActive ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
                }
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${colorClasses[tab.color as keyof typeof colorClasses]}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span>Profile Information</span>
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and how others see you
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Profile Picture */}
                    <div className="md:col-span-2">
                      <Label className="text-sm font-semibold mb-3 block">Profile Picture</Label>
                      <div className="flex items-center space-x-4">
                        {profileSettings.avatar_url ? (
                          <img 
                            src={profileSettings.avatar_url} 
                            alt="Profile" 
                            className="w-20 h-20 rounded-full object-cover shadow-lg border-4 border-white"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-2xl font-bold">
                              {profileSettings.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            id="profile-picture-upload"
                            accept="image/*"
                            onChange={handleProfilePictureUpload}
                            className="hidden"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mb-2"
                            onClick={() => document.getElementById('profile-picture-upload')?.click()}
                            disabled={saving}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            {saving ? 'Uploading...' : 'Upload Photo'}
                          </Button>
                          <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 2MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <Label htmlFor="full_name" className="text-sm font-semibold mb-2 block">
                        Full Name
                      </Label>
                      <Input
                        id="full_name"
                        value={profileSettings.full_name}
                        onChange={(e) => setProfileSettings({ ...profileSettings, full_name: e.target.value })}
                        placeholder="Enter your full name"
                        className="border-gray-300"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold mb-2 block">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileSettings.email}
                        disabled
                        className="border-gray-300 bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <Label htmlFor="phone" className="text-sm font-semibold mb-2 block">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileSettings.phone}
                        onChange={(e) => setProfileSettings({ ...profileSettings, phone: e.target.value })}
                        placeholder="Enter your phone number"
                        className="border-gray-300"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => fetchSettings()}
                        disabled={saving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {saving ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gym Info Tab */}
            {activeTab === 'gym' && gymSettings && (
              <div className="space-y-6">
                {/* Basic Information Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      <span>Basic Information</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your gym's business details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Gym Logo */}
                      <div className="md:col-span-2">
                        <Label className="text-sm font-semibold mb-3 block">Gym Logo</Label>
                        <div className="flex items-center space-x-4">
                          {gymSettings.logo_url ? (
                            <img 
                              src={gymSettings.logo_url} 
                              alt="Gym Logo" 
                              className="w-24 h-24 rounded-lg object-cover shadow-lg border-4 border-white"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                              <Building2 className="h-12 w-12 text-white" />
                            </div>
                          )}
                          <div>
                            <input
                              type="file"
                              id="logo-upload"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mb-2"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                              disabled={saving}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              {saving ? 'Uploading...' : 'Upload Logo'}
                            </Button>
                            <p className="text-xs text-gray-500">Appears on member receipts. JPG or PNG, Max 2MB</p>
                          </div>
                        </div>
                      </div>

                      {/* Gym Name */}
                      <div className="md:col-span-2">
                        <Label htmlFor="gym_name" className="text-sm font-semibold mb-2 block">
                          Gym Name
                        </Label>
                        <Input
                          id="gym_name"
                          value={gymSettings.name}
                          onChange={(e) => setGymSettings({ ...gymSettings, name: e.target.value })}
                          placeholder="Enter gym name"
                          className="border-gray-300 text-lg font-semibold"
                        />
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <Label htmlFor="address" className="text-sm font-semibold mb-2 block">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          Address
                        </Label>
                        <Input
                          id="address"
                          value={gymSettings.address || ''}
                          onChange={(e) => setGymSettings({ ...gymSettings, address: e.target.value })}
                          placeholder="Enter complete gym address"
                          className="border-gray-300"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <Label htmlFor="gym_phone" className="text-sm font-semibold mb-2 block">
                          <Phone className="h-4 w-4 inline mr-1" />
                          Phone Number
                        </Label>
                        <Input
                          id="gym_phone"
                          type="tel"
                          value={gymSettings.phone || ''}
                          onChange={(e) => setGymSettings({ ...gymSettings, phone: e.target.value })}
                          placeholder="Enter gym phone"
                          className="border-gray-300"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <Label htmlFor="gym_email" className="text-sm font-semibold mb-2 block">
                          <Mail className="h-4 w-4 inline mr-1" />
                          Email Address
                        </Label>
                        <Input
                          id="gym_email"
                          type="email"
                          value={gymSettings.email || ''}
                          onChange={(e) => setGymSettings({ ...gymSettings, email: e.target.value })}
                          placeholder="Enter gym email"
                          className="border-gray-300"
                        />
                      </div>

                      {/* Website */}
                      <div>
                        <Label htmlFor="website" className="text-sm font-semibold mb-2 block">
                          <Globe className="h-4 w-4 inline mr-1" />
                          Website
                        </Label>
                        <Input
                          id="website"
                          type="url"
                          value={gymSettings.website || ''}
                          onChange={(e) => setGymSettings({ ...gymSettings, website: e.target.value })}
                          placeholder="https://yourgym.com"
                          className="border-gray-300"
                        />
                      </div>

                      {/* Max Capacity */}
                      <div>
                        <Label htmlFor="max_capacity" className="text-sm font-semibold mb-2 block">
                          <Users className="h-4 w-4 inline mr-1" />
                          Max Capacity
                        </Label>
                        <Input
                          id="max_capacity"
                          type="number"
                          value={gymSettings.max_capacity || ''}
                          onChange={(e) => setGymSettings({ ...gymSettings, max_capacity: parseInt(e.target.value) || 0 })}
                          placeholder="Maximum members allowed"
                          className="border-gray-300"
                        />
                      </div>

                      {/* Timezone */}
                      <div>
                        <Label htmlFor="timezone" className="text-sm font-semibold mb-2 block">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Timezone
                        </Label>
                        <select
                          id="timezone"
                          value={gymSettings.timezone || 'Asia/Kolkata'}
                          onChange={(e) => setGymSettings({ ...gymSettings, timezone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          <option value="America/New_York">America/New York (EST)</option>
                          <option value="Europe/London">Europe/London (GMT)</option>
                          <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        </select>
                      </div>

                      {/* Currency */}
                      <div>
                        <Label htmlFor="currency" className="text-sm font-semibold mb-2 block">
                          <CreditCard className="h-4 w-4 inline mr-1" />
                          Currency
                        </Label>
                        <select
                          id="currency"
                          value={gymSettings.currency || 'INR'}
                          onChange={(e) => setGymSettings({ ...gymSettings, currency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5 text-pink-600" />
                      <span>Social Media Links</span>
                    </CardTitle>
                    <CardDescription>
                      Connect your social media profiles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Instagram */}
                      <div>
                        <Label htmlFor="instagram" className="text-sm font-semibold mb-2 block">
                          📷 Instagram
                        </Label>
                        <Input
                          id="instagram"
                          value={gymSettings.social_media?.instagram || ''}
                          onChange={(e) => setGymSettings({ 
                            ...gymSettings, 
                            social_media: { ...gymSettings.social_media, instagram: e.target.value }
                          })}
                          placeholder="https://instagram.com/yourgym"
                          className="border-gray-300"
                        />
                      </div>

                      {/* Facebook */}
                      <div>
                        <Label htmlFor="facebook" className="text-sm font-semibold mb-2 block">
                          👥 Facebook
                        </Label>
                        <Input
                          id="facebook"
                          value={gymSettings.social_media?.facebook || ''}
                          onChange={(e) => setGymSettings({ 
                            ...gymSettings, 
                            social_media: { ...gymSettings.social_media, facebook: e.target.value }
                          })}
                          placeholder="https://facebook.com/yourgym"
                          className="border-gray-300"
                        />
                      </div>

                      {/* Twitter */}
                      <div>
                        <Label htmlFor="twitter" className="text-sm font-semibold mb-2 block">
                          🐦 Twitter / X
                        </Label>
                        <Input
                          id="twitter"
                          value={gymSettings.social_media?.twitter || ''}
                          onChange={(e) => setGymSettings({ 
                            ...gymSettings, 
                            social_media: { ...gymSettings.social_media, twitter: e.target.value }
                          })}
                          placeholder="https://twitter.com/yourgym"
                          className="border-gray-300"
                        />
                      </div>

                      {/* YouTube */}
                      <div>
                        <Label htmlFor="youtube" className="text-sm font-semibold mb-2 block">
                          📺 YouTube
                        </Label>
                        <Input
                          id="youtube"
                          value={gymSettings.social_media?.youtube || ''}
                          onChange={(e) => setGymSettings({ 
                            ...gymSettings, 
                            social_media: { ...gymSettings.social_media, youtube: e.target.value }
                          })}
                          placeholder="https://youtube.com/@yourgym"
                          className="border-gray-300"
                        />
                      </div>

                      {/* LinkedIn */}
                      <div>
                        <Label htmlFor="linkedin" className="text-sm font-semibold mb-2 block">
                          💼 LinkedIn
                        </Label>
                        <Input
                          id="linkedin"
                          value={gymSettings.social_media?.linkedin || ''}
                          onChange={(e) => setGymSettings({ 
                            ...gymSettings, 
                            social_media: { ...gymSettings.social_media, linkedin: e.target.value }
                          })}
                          placeholder="https://linkedin.com/company/yourgym"
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Operating Hours Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span>Operating Hours</span>
                    </CardTitle>
                    <CardDescription>
                      Set your gym's opening and closing times
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const dayKey = day.toLowerCase() as keyof NonNullable<typeof gymSettings.operating_hours>
                        const hours = gymSettings.operating_hours?.[dayKey]
                        
                        return (
                          <div key={day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-28 font-semibold text-gray-700">{day}</div>
                            <div className="flex items-center space-x-2 flex-1">
                              <Input
                                type="time"
                                value={hours?.open || '06:00'}
                                onChange={(e) => setGymSettings({
                                  ...gymSettings,
                                  operating_hours: {
                                    ...gymSettings.operating_hours,
                                    [dayKey]: { 
                                      ...hours, 
                                      open: e.target.value,
                                      closed: false
                                    }
                                  }
                                })}
                                disabled={hours?.closed}
                                className="border-gray-300 w-32"
                              />
                              <span className="text-gray-500">to</span>
                              <Input
                                type="time"
                                value={hours?.close || '22:00'}
                                onChange={(e) => setGymSettings({
                                  ...gymSettings,
                                  operating_hours: {
                                    ...gymSettings.operating_hours,
                                    [dayKey]: { 
                                      ...hours, 
                                      close: e.target.value,
                                      closed: false
                                    }
                                  }
                                })}
                                disabled={hours?.closed}
                                className="border-gray-300 w-32"
                              />
                            </div>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hours?.closed || false}
                                onChange={(e) => setGymSettings({
                                  ...gymSettings,
                                  operating_hours: {
                                    ...gymSettings.operating_hours,
                                    [dayKey]: { 
                                      open: '06:00',
                                      close: '22:00',
                                      closed: e.target.checked
                                    }
                                  }
                                })}
                                className="w-4 h-4 text-red-600 rounded"
                              />
                              <span className="text-sm text-gray-600">Closed</span>
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Amenities Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      <span>Gym Amenities</span>
                    </CardTitle>
                    <CardDescription>
                      Select all facilities available at your gym
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableAmenities.map((amenity) => (
                        <button
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            selectedAmenities.includes(amenity)
                              ? 'bg-green-100 border-green-500 text-green-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                          }`}
                        >
                          {selectedAmenities.includes(amenity) && (
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                          )}
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Trainer Certifications Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-amber-600" />
                      <span>Trainer Certifications</span>
                    </CardTitle>
                    <CardDescription>
                      List certifications your trainers hold
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Add New Certification */}
                      <div className="flex space-x-2">
                        <Input
                          value={newCertification}
                          onChange={(e) => setNewCertification(e.target.value)}
                          placeholder="e.g., ACE Certified Personal Trainer"
                          className="border-gray-300 flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                        />
                        <Button
                          onClick={addCertification}
                          disabled={!newCertification.trim()}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>

                      {/* List of Certifications */}
                      <div className="space-y-2">
                        {certifications.map((cert, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <span className="font-medium text-gray-700">{cert}</span>
                            <button
                              onClick={() => removeCertification(index)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {certifications.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No certifications added yet. Add your trainers' certifications above.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => fetchSettings()}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveGym}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {saving ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save All Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-green-600" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                  <CardDescription>
                    Choose how and when you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">Email Notifications</p>
                          <p className="text-sm text-gray-500">Receive updates via email</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* SMS Notifications */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">SMS Notifications</p>
                          <p className="text-sm text-gray-500">Receive text messages</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.smsNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Membership Expiry */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">Membership Expiry Alerts</p>
                          <p className="text-sm text-gray-500">Get notified about expiring memberships</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.membershipExpiry}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, membershipExpiry: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Payment Reminders */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">Payment Reminders</p>
                          <p className="text-sm text-gray-500">Reminders for pending payments</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.paymentReminders}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, paymentReminders: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Staff Updates */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">Staff Updates</p>
                          <p className="text-sm text-gray-500">Notifications about staff changes</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.staffUpdates}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, staffUpdates: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Equipment Maintenance */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Settings className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">Equipment Maintenance</p>
                          <p className="text-sm text-gray-500">Alerts for equipment maintenance</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.equipmentMaintenance}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, equipmentMaintenance: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* New Member Joined */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">New Member Joined</p>
                          <p className="text-sm text-gray-500">Get notified when a new member signs up</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.newMemberJoined}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, newMemberJoined: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Low Attendance */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <TrendingDown className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">Low Attendance Alerts</p>
                          <p className="text-sm text-gray-500">Notify when gym attendance is low</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.lowAttendance}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, lowAttendance: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Monthly Reports */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-semibold">Monthly Reports</p>
                          <p className="text-sm text-gray-500">Receive monthly business analytics</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.monthlyReports}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, monthlyReports: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Change Password Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <Lock className="h-5 w-5 text-red-600" />
                      <span>Change Password</span>
                    </CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 max-w-md">
                      {/* Current Password */}
                      <div>
                        <Label htmlFor="current_password" className="text-sm font-semibold mb-2 block">
                          Current Password
                        </Label>
                        <Input
                          id="current_password"
                          type="password"
                          value={securitySettings.currentPassword}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                          className="border-gray-300"
                        />
                      </div>

                      {/* New Password */}
                      <div>
                        <Label htmlFor="new_password" className="text-sm font-semibold mb-2 block">
                          New Password
                        </Label>
                        <Input
                          id="new_password"
                          type="password"
                          value={securitySettings.newPassword}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                          placeholder="Enter new password (min 6 characters)"
                          className="border-gray-300"
                        />
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <Label htmlFor="confirm_password" className="text-sm font-semibold mb-2 block">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={securitySettings.confirmPassword}
                          onChange={(e) => setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                          className="border-gray-300"
                        />
                      </div>

                      {/* Password Requirements */}
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-800 mb-2">Password Requirements:</p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            At least 6 characters long
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Include letters and numbers (recommended)
                          </li>
                        </ul>
                      </div>

                      {/* Change Password Button */}
                      <Button
                        onClick={handleChangePassword}
                        disabled={saving || !securitySettings.newPassword || !securitySettings.confirmPassword}
                        className="bg-red-600 hover:bg-red-700 w-full"
                      >
                        {saving ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Updating Password...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Two-Factor Authentication Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span>Two-Factor Authentication (2FA)</span>
                    </CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-green-100 rounded-full">
                            <Shield className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Protect your account with an additional security layer
                            </p>
                            <div className="mt-3 space-y-1">
                              <p className="text-xs text-gray-600">✓ Prevents unauthorized access</p>
                              <p className="text-xs text-gray-600">✓ Requires authentication code</p>
                              <p className="text-xs text-gray-600">✓ Works with Google Authenticator</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                          securitySettings.twoFactorEnabled 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <Button 
                          size="sm" 
                          className={securitySettings.twoFactorEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                          onClick={() => setSecuritySettings({ ...securitySettings, twoFactorEnabled: !securitySettings.twoFactorEnabled })}
                        >
                          {securitySettings.twoFactorEnabled ? (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Disable 2FA
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Enable 2FA
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Timeout Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span>Session Timeout</span>
                    </CardTitle>
                    <CardDescription>
                      Automatically log out after period of inactivity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="max-w-md">
                      <Label htmlFor="session_timeout" className="text-sm font-semibold mb-2 block">
                        Timeout Duration
                      </Label>
                      <select
                        id="session_timeout"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="never">Never</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        You will be automatically logged out after this period of inactivity
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Sessions Card */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5 text-gray-600" />
                      <span>Active Sessions</span>
                    </CardTitle>
                    <CardDescription>
                      Manage devices where you're currently logged in
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold">Current Device</p>
                            <p className="text-sm text-gray-600">Chrome on macOS</p>
                            <p className="text-xs text-gray-500">Active now • Last activity: Just now</p>
                          </div>
                        </div>
                        <span className="text-xs text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-full">
                          Active
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 text-center py-4">
                        No other active sessions found
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5 text-orange-600" />
                    <span>Display & Preferences</span>
                  </CardTitle>
                  <CardDescription>
                    Customize your experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Language */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">
                        <Globe className="h-4 w-4 inline mr-1" />
                        Language
                      </Label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Date Format
                      </Label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                        <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                        <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                      </select>
                    </div>

                    {/* Currency */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">
                        <CreditCard className="h-4 w-4 inline mr-1" />
                        Currency
                      </Label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    {/* Theme (Future) */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-purple-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Palette className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-semibold">Theme</p>
                            <p className="text-sm text-gray-500">Dark mode coming soon!</p>
                          </div>
                        </div>
                        <span className="text-xs text-purple-600 font-semibold bg-purple-100 px-3 py-1 rounded-full">Coming Soon</span>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedPage>
  )
}
