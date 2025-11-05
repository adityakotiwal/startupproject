'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  Save, 
  ArrowLeft,
  Plus,
  X,
  IndianRupee,
  Calendar,
  Users,
  Star,
  Settings,
  Target,
  CheckCircle,
  Loader2,
  Zap,
  Sparkles,
  Gift,
  Rocket
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function AddMembershipPlanPage() {
  const router = useRouter()
  
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_months: '1',
    duration_type: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime',
    features: [''],
    status: 'Active' as 'Active' | 'Inactive' | 'Discontinued',
    is_popular: false,
    max_members: '',
    color_theme: '#3B82F6'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price greater than 0'
    }

    if (!formData.duration_months || parseInt(formData.duration_months) <= 0) {
      newErrors.duration_months = 'Please enter a valid duration greater than 0'
    }

    const validFeatures = formData.features.filter(f => f.trim())
    if (validFeatures.length === 0) {
      newErrors.features = 'At least one feature is required'
    }

    if (formData.max_members && parseInt(formData.max_members) <= 0) {
      newErrors.max_members = 'Member limit must be greater than 0 if specified'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const validFeatures = formData.features.filter(f => f.trim())
      
      const insertData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        duration_months: parseInt(formData.duration_months),
        duration_type: formData.duration_type,
        features: validFeatures,
        status: formData.status,
        is_popular: formData.is_popular,
        max_members: formData.max_members ? parseInt(formData.max_members) : 0,
        color_theme: formData.color_theme
      }

      const { error } = await supabase
        .from('membership_plans')
        .insert([insertData])

      if (error) {
        console.error('Error creating plan:', error)
        alert('Error creating membership plan. Please try again.')
      } else {
        alert('Membership plan created successfully!')
        router.push('/membership-plans')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating membership plan. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation Breadcrumb */}
          <div className="flex items-center space-x-2 pt-4 text-sm">
            <Link href="/dashboard" className="text-purple-100 hover:text-white transition-colors">
              Dashboard
            </Link>
            <span className="text-purple-300">/</span>
            <Link href="/membership-plans" className="text-purple-100 hover:text-white transition-colors">
              Membership Plans
            </Link>
            <span className="text-purple-300">/</span>
            <span className="text-white font-semibold">Add Plan</span>
          </div>
          
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/membership-plans">
                <Button variant="outline" size="sm" className="bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-opacity-30">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Create New Membership Plan</h1>
                  <p className="text-purple-100">Build the perfect plan for your members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 📝 BASIC INFORMATION CARD */}
        <Card className="border-2 border-purple-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center text-xl">
              <Settings className="h-6 w-6 mr-2 text-purple-600" />
              Basic Plan Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Premium Gold Plan"
                  className={`${errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-purple-500 focus:border-purple-500'}`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what makes this plan special and what benefits members will get..."
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.description 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                }`}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
          </CardContent>
        </Card>

        {/* 💰 PRICING & DURATION MAGIC */}
        <Card className="border-2 border-green-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center text-xl">
              <IndianRupee className="h-6 w-6 mr-2 text-green-600" />
              Pricing & Duration Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className={`${errors.price ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration Value *
                </label>
                <Input
                  type="number"
                  value={formData.duration_months}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_months: e.target.value }))}
                  placeholder="1"
                  min="1"
                  disabled={formData.duration_type === 'lifetime'}
                  className={`${errors.duration_months ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                />
                {errors.duration_months && <p className="text-red-500 text-sm mt-1">{errors.duration_months}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration Type *
                </label>
                <select
                  value={formData.duration_type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    duration_type: e.target.value as any,
                    duration_months: e.target.value === 'lifetime' ? '1' : prev.duration_months
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Limit (Optional)
                </label>
                <Input
                  type="number"
                  value={formData.max_members}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_members: e.target.value }))}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  className={`${errors.max_members ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                />
                {errors.max_members && <p className="text-red-500 text-sm mt-1">{errors.max_members}</p>}
                <p className="text-gray-500 text-sm mt-1">
                  Maximum number of members who can subscribe to this plan
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Color Theme
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color_theme}
                    onChange={(e) => setFormData(prev => ({ ...prev, color_theme: e.target.value }))}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.color_theme}
                    onChange={(e) => setFormData(prev => ({ ...prev, color_theme: e.target.value }))}
                    placeholder="#3B82F6"
                    className="focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Choose a color that represents your plan's personality
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🎯 FEATURES BUILDER */}
        <Card className="border-2 border-blue-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center text-xl">
              <Target className="h-6 w-6 mr-2 text-blue-600" />
              Plan Features ({formData.features.filter(f => f.trim()).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <Zap className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <Input
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder="Enter a powerful feature (e.g., 24/7 gym access)"
                  className="flex-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.features.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFeature(index)}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <div className="flex items-center justify-between pt-4 border-t border-blue-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
                className="flex items-center border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Feature
              </Button>
              {errors.features && <p className="text-red-500 text-sm">{errors.features}</p>}
            </div>
          </CardContent>
        </Card>

        {/* ⭐ POPULARITY SETTINGS */}
        <Card className="border-2 border-yellow-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardTitle className="flex items-center text-xl">
              <Star className="h-6 w-6 mr-2 text-yellow-600" />
              Plan Popularity Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <input
                type="checkbox"
                id="is_popular"
                checked={formData.is_popular}
                onChange={(e) => setFormData(prev => ({ ...prev, is_popular: e.target.checked }))}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <label htmlFor="is_popular" className="flex items-center text-sm font-medium text-gray-700">
                <Star className="h-4 w-4 mr-2 text-yellow-500" />
                Mark as Popular Plan
              </label>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              Popular plans are highlighted with special badges and appear at the top of the list to attract more customers
            </p>
          </CardContent>
        </Card>

        {/* 🚀 ACTION BUTTONS */}
        <div className="flex space-x-4 pt-6 border-t-2 border-gradient-to-r from-purple-200 to-blue-200">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white text-lg py-3 shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Creating Plan...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Create Membership Plan
              </>
            )}
          </Button>
          <Link href="/membership-plans">
            <Button type="button" variant="outline" className="flex-1 text-lg py-3 border-2 hover:bg-gray-50">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
        </div>
      </div>
  )
}