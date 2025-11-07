'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Wrench, 
  Calendar, 
  IndianRupee,
  Settings,
  Save,
  Package,
  Tag
} from 'lucide-react'

interface Equipment {
  id: string
  gym_id: string
  name: string
  category: string
  purchase_date: string
  cost: number
  status: 'Active' | 'Maintenance' | 'Retired' | 'Broken'
  maintenance_due: string
  description: string
  serial_number: string
  warranty_expires: string
  created_at: string
}

interface EditEquipmentModalProps {
  equipment: Equipment | null
  isOpen: boolean
  onClose: () => void
  onEquipmentUpdated: () => void
}

export default function EditEquipmentModal({ 
  equipment, 
  isOpen, 
  onClose, 
  onEquipmentUpdated 
}: EditEquipmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    status: 'Active' as 'Active' | 'Maintenance' | 'Retired' | 'Broken',
    cost: '',
    purchase_date: '',
    maintenance_due: '',
    warranty_expires: '',
    serial_number: '',
    description: ''
  })

  // Populate form when equipment changes
  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        category: equipment.category || '',
        status: equipment.status || 'Active',
        cost: equipment.cost?.toString() || '',
        purchase_date: equipment.purchase_date || '',
        maintenance_due: equipment.maintenance_due || '',
        warranty_expires: equipment.warranty_expires || '',
        serial_number: equipment.serial_number || '',
        description: equipment.description || ''
      })
    }
  }, [equipment])

  if (!isOpen || !equipment) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          name: formData.name,
          category: formData.category,
          status: formData.status,
          cost: parseFloat(formData.cost) || 0,
          purchase_date: formData.purchase_date || null,
          maintenance_due: formData.maintenance_due || null,
          warranty_expires: formData.warranty_expires || null,
          serial_number: formData.serial_number || null,
          description: formData.description || null
        })
        .eq('id', equipment.id)

      if (error) throw error

      onEquipmentUpdated()
      alert('Equipment updated successfully!')
    } catch (error) {
      console.error('Error updating equipment:', error)
      alert('Error updating equipment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header - Gradient like Maintenance/Warranty Modal */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Edit Equipment</h2>
                <p className="text-blue-100">Update equipment information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 bg-white">
            {/* Current Equipment Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Current Equipment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Equipment:</span>
                  <p className="font-medium">{equipment.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-medium">{equipment.status}</p>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <p className="font-medium">{equipment.category}</p>
                </div>
                <div>
                  <span className="text-gray-600">Cost:</span>
                  <p className="font-medium">₹{equipment.cost?.toLocaleString('en-IN') || '0'}</p>
                </div>
              </div>
            </div>

            {/* Equipment Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Equipment Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter equipment name"
                required
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

          {/* Category and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select category</option>
                <option value="cardio">Cardio</option>
                <option value="strength">Strength</option>
                <option value="free weights">Free Weights</option>
                <option value="accessories">Accessories</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Broken">Broken</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          {/* Cost and Serial Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cost (₹)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="0"
                  className="pl-10 focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Serial Number
              </label>
              <Input
                value={formData.serial_number}
                onChange={(e) => handleInputChange('serial_number', e.target.value)}
                placeholder="Enter serial number"
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Purchase Date
              </label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Maintenance Due
              </label>
              <Input
                type="date"
                value={formData.maintenance_due}
                onChange={(e) => handleInputChange('maintenance_due', e.target.value)}
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Warranty Expires
              </label>
              <Input
                type="date"
                value={formData.warranty_expires}
                onChange={(e) => handleInputChange('warranty_expires', e.target.value)}
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter equipment description..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Equipment
                </>
              )}
            </Button>
          </div>
        </div>
        </form>
      </div>
    </div>
  )
}