'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Filter, 
  Calendar,
  IndianRupee,
  Settings,
  RotateCcw
} from 'lucide-react'

interface EquipmentFilterOptions {
  status: string[]
  category: string[]
  costFrom: string
  costTo: string
  purchaseDateFrom: string
  purchaseDateTo: string
  maintenanceDueFrom: string
  maintenanceDueTo: string
  warrantyStatus: string[]
  maintenanceStatus: string[]
  ageFrom: string
  ageTo: string
}

interface EquipmentAdvancedFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: EquipmentFilterOptions) => void
}

export default function EquipmentAdvancedFiltersModal({ 
  isOpen, 
  onClose, 
  onApplyFilters
}: EquipmentAdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<EquipmentFilterOptions>({
    status: [],
    category: [],
    costFrom: '',
    costTo: '',
    purchaseDateFrom: '',
    purchaseDateTo: '',
    maintenanceDueFrom: '',
    maintenanceDueTo: '',
    warrantyStatus: [],
    maintenanceStatus: [],
    ageFrom: '',
    ageTo: ''
  })

  if (!isOpen) return null

  const handleArrayFilter = (field: keyof Pick<EquipmentFilterOptions, 'status' | 'category' | 'warrantyStatus' | 'maintenanceStatus'>, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const handleInputFilter = (field: keyof EquipmentFilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFilters({
      status: [],
      category: [],
      costFrom: '',
      costTo: '',
      purchaseDateFrom: '',
      purchaseDateTo: '',
      maintenanceDueFrom: '',
      maintenanceDueTo: '',
      warrantyStatus: [],
      maintenanceStatus: [],
      ageFrom: '',
      ageTo: ''
    })
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Filter className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Advanced Equipment Filters</h2>
              <p className="text-sm text-gray-500">Filter equipment by multiple criteria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Active', 'Maintenance', 'Broken', 'Retired'].map((status) => (
                  <label key={status} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => handleArrayFilter('status', status)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipment Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Cardio', 'Strength', 'Free Weights', 'Accessories', 'Other'].map((category) => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category)}
                      onChange={() => handleArrayFilter('category', category)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <IndianRupee className="h-5 w-5" />
                <span>Cost Range</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Cost (₹)
                  </label>
                  <Input
                    type="number"
                    value={filters.costFrom}
                    onChange={(e) => handleInputFilter('costFrom', e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Cost (₹)
                  </label>
                  <Input
                    type="number"
                    value={filters.costTo}
                    onChange={(e) => handleInputFilter('costTo', e.target.value)}
                    placeholder="No limit"
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purchase Date Range */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Purchase Date Range</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={filters.purchaseDateFrom}
                    onChange={(e) => handleInputFilter('purchaseDateFrom', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={filters.purchaseDateTo}
                    onChange={(e) => handleInputFilter('purchaseDateTo', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Due Range */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Maintenance Due Range</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={filters.maintenanceDueFrom}
                    onChange={(e) => handleInputFilter('maintenanceDueFrom', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={filters.maintenanceDueTo}
                    onChange={(e) => handleInputFilter('maintenanceDueTo', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warranty and Maintenance Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Warranty Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Warranty Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Active', 'Expired', 'Expiring Soon'].map((status) => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.warrantyStatus.includes(status)}
                        onChange={() => handleArrayFilter('warrantyStatus', status)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maintenance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Up to Date', 'Due Soon', 'Overdue'].map((status) => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.maintenanceStatus.includes(status)}
                        onChange={() => handleArrayFilter('maintenanceStatus', status)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equipment Age Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipment Age (Years)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Age (Years)
                  </label>
                  <Input
                    type="number"
                    value={filters.ageFrom}
                    onChange={(e) => handleInputFilter('ageFrom', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Age (Years)
                  </label>
                  <Input
                    type="number"
                    value={filters.ageTo}
                    onChange={(e) => handleInputFilter('ageTo', e.target.value)}
                    placeholder="No limit"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleApply}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}