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
  Save
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Equipment</h2>
              <p className="text-sm text-gray-500">Update equipment information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Equipment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter equipment name"
              required
            />
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost (₹)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="0"
                  className="pl-10"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number
              </label>
              <Input
                value={formData.serial_number}
                onChange={(e) => handleInputChange('serial_number', e.target.value)}
                placeholder="Enter serial number"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date
              </label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleInputChange('purchase_date', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maintenance Due
              </label>
              <Input
                type="date"
                value={formData.maintenance_due}
                onChange={(e) => handleInputChange('maintenance_due', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warranty Expires
              </label>
              <Input
                type="date"
                value={formData.warranty_expires}
                onChange={(e) => handleInputChange('warranty_expires', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Updating...' : 'Update Equipment'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}