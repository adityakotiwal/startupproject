'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { useInvalidateQueries } from '@/hooks/useOptimizedData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Dumbbell, IndianRupee, Calendar, Settings, Wrench, Shield, FileText, Plus } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EquipmentExpensePrompt from '@/components/EquipmentExpensePrompt'

// Predefined equipment categories - same pattern as expenses
const EQUIPMENT_CATEGORIES = [
  'Cardio',
  'Strength',
  'Free Weights',
  'Accessories',
  'Other'
]

const EQUIPMENT_STATUS = [
  'Active',
  'Maintenance', 
  'Retired',
  'Broken'
]

export default function AddEquipmentPage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const isClient = useClientOnly()
  const router = useRouter()
  const { invalidateEquipment } = useInvalidateQueries()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    customCategory: '',
    purchase_date: '',
    cost: '',
    status: 'Active',
    maintenance_due: '',
    description: '',
    serial_number: '',
    warranty_expires: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExpensePrompt, setShowExpensePrompt] = useState(false)
  const [addedEquipment, setAddedEquipment] = useState<any>(null)

  // Handle form submission - same pattern as expenses
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!gymId) {
      setError('No gym selected')
      return
    }

    if (!formData.name.trim()) {
      setError('Equipment name is required')
      return
    }

    const finalCategory = formData.category === 'custom' ? formData.customCategory.trim() : formData.category
    if (!finalCategory) {
      setError('Category is required')
      return
    }

    const cost = parseFloat(formData.cost)
    if (isNaN(cost) || cost < 0) {
      setError('Please enter a valid cost amount')
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare the equipment data - same structure as our table
      const equipmentData = {
        gym_id: gymId,
        name: formData.name.trim(),
        category: finalCategory,
        purchase_date: formData.purchase_date || null,
        cost: cost,
        status: formData.status,
        maintenance_due: formData.maintenance_due || null,
        description: formData.description.trim() || null,
        serial_number: formData.serial_number.trim() || null,
        warranty_expires: formData.warranty_expires || null
      }

      console.log('Adding equipment:', equipmentData)

      const { data, error } = await supabase
        .from('equipment')
        .insert([equipmentData])
        .select()

      if (error) {
        console.error('Error adding equipment:', error)
        setError(`Failed to add equipment: ${error.message}`)
        return
      }

      console.log('✅ Equipment added successfully:', data)
      
      // Store the added equipment and show expense prompt
      setAddedEquipment({
        id: data[0].id,
        name: formData.name.trim(),
        cost: cost,
        purchase_date: formData.purchase_date || new Date().toISOString().split('T')[0],
        category: finalCategory,
        serial_number: formData.serial_number.trim(),
        description: formData.description.trim()
      })
      setShowExpensePrompt(true)

    } catch (error) {
      console.error('Unexpected error adding equipment:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  if (gymLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading gym information...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Navigation Breadcrumb */}
            <div className="flex items-center space-x-2 pt-4 text-sm">
              <Link href="/dashboard" className="text-orange-100 hover:text-white transition-colors">
                Dashboard
              </Link>
              <span className="text-orange-300">/</span>
              <Link href="/equipment" className="text-orange-100 hover:text-white transition-colors">
                Equipment
              </Link>
              <span className="text-orange-300">/</span>
              <span className="text-white font-semibold">Add Equipment</span>
            </div>
            
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <Link href="/equipment">
                  <Button variant="outline" size="sm" className="bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-opacity-30">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Add New Equipment</h1>
                    <p className="text-orange-100">Add equipment to your gym inventory</p>
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

            {/* Basic Information */}
            <Card className="mb-6 border-t-4 border-t-orange-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                <CardTitle className="flex items-center text-orange-800">
                  <div className="bg-orange-600 p-2 rounded-lg mr-3">
                    <Dumbbell className="h-5 w-5 text-white" />
                  </div>
                  Equipment Details
                </CardTitle>
                <CardDescription>
                  Basic information about the equipment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center text-gray-700 font-semibold">
                      <Dumbbell className="h-4 w-4 mr-1 text-orange-600" />
                      Equipment Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Treadmill Pro X1"
                      className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="flex items-center text-gray-700 font-semibold">
                      <Settings className="h-4 w-4 mr-1 text-orange-600" />
                      Category *
                    </Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select Category</option>
                      {EQUIPMENT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="custom">Custom Category</option>
                    </select>
                  </div>
                </div>

                {formData.category === 'custom' && (
                  <div>
                    <Label htmlFor="customCategory">Custom Category *</Label>
                    <Input
                      id="customCategory"
                      name="customCategory"
                      value={formData.customCategory}
                      onChange={handleInputChange}
                      placeholder="Enter custom category"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleInputChange}
                    placeholder="e.g., TM2024-001"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {EQUIPMENT_STATUS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="mb-6 border-t-4 border-t-blue-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center text-blue-800">
                  <div className="bg-blue-600 p-2 rounded-lg mr-3">
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                  Financial Details
                </CardTitle>
                <CardDescription>
                  Cost and purchase information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost" className="flex items-center text-gray-700 font-semibold">
                      <IndianRupee className="h-4 w-4 mr-1 text-blue-600" />
                      Purchase Cost *
                    </Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchase_date" className="flex items-center text-gray-700 font-semibold">
                      <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                      Purchase Date
                    </Label>
                    <Input
                      id="purchase_date"
                      name="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Information */}
            <Card className="mb-6 border-t-4 border-t-purple-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center text-purple-800">
                  <div className="bg-purple-600 p-2 rounded-lg mr-3">
                    <Wrench className="h-5 w-5 text-white" />
                  </div>
                  Maintenance & Warranty
                </CardTitle>
                <CardDescription>
                  Tracking and warranty information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maintenance_due" className="flex items-center text-gray-700 font-semibold">
                      <Wrench className="h-4 w-4 mr-1 text-purple-600" />
                      Next Maintenance Due
                    </Label>
                    <Input
                      id="maintenance_due"
                      name="maintenance_due"
                      type="date"
                      value={formData.maintenance_due}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="warranty_expires" className="flex items-center text-gray-700 font-semibold">
                      <Shield className="h-4 w-4 mr-1 text-purple-600" />
                      Warranty Expires
                    </Label>
                    <Input
                      id="warranty_expires"
                      name="warranty_expires"
                      type="date"
                      value={formData.warranty_expires}
                      onChange={handleInputChange}
                      className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="mb-6 border-t-4 border-t-gray-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gray-600 p-2 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Additional Information
                </CardTitle>
                <CardDescription>
                  Optional notes and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Additional notes about the equipment..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link href="/equipment">
                <Button type="button" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white transform hover:scale-105 transition-all duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Equipment...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Add Equipment
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Equipment Expense Prompt */}
        {showExpensePrompt && addedEquipment && gymId && (
          <EquipmentExpensePrompt
            equipment={addedEquipment}
            gymId={gymId}
            isOpen={showExpensePrompt}
            onClose={() => {
              setShowExpensePrompt(false)
              setAddedEquipment(null)
            }}
            onEquipmentInvalidate={invalidateEquipment}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}