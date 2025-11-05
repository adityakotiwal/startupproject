'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Filter, Calendar, Users, Briefcase, DollarSign } from 'lucide-react'

interface StaffFilterOptions {
  status: string[]
  role: string
  joinDateFrom: string
  joinDateTo: string
  salaryFrom: string
  salaryTo: string
  experienceFrom: string
  experienceTo: string
}

interface StaffAdvancedFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: StaffFilterOptions) => void
}

export default function StaffAdvancedFiltersModal({ 
  isOpen, 
  onClose, 
  onApplyFilters
}: StaffAdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<StaffFilterOptions>({
    status: [],
    role: '',
    joinDateFrom: '',
    joinDateTo: '',
    salaryFrom: '',
    salaryTo: '',
    experienceFrom: '',
    experienceTo: ''
  })

  const handleStatusChange = (status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      status: checked 
        ? [...prev.status, status]
        : prev.status.filter(s => s !== status)
    }))
  }

  const handleApplyFilters = () => {
    onApplyFilters(filters)
    onClose()
  }

  const handleResetFilters = () => {
    setFilters({
      status: [],
      role: '',
      joinDateFrom: '',
      joinDateTo: '',
      salaryFrom: '',
      salaryTo: '',
      experienceFrom: '',
      experienceTo: ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Filter className="h-6 w-6" />
              <h2 className="text-xl font-bold">Advanced Staff Filters</h2>
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

        <div className="p-6 space-y-6">
          {/* Employment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Employment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {['Active', 'Inactive', 'Terminated'].map((status) => (
                  <label key={status} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => handleStatusChange(status, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{status}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role/Position */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-purple-600" />
                Role/Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="Trainer">Trainer</option>
                <option value="Manager">Manager</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Cleaner">Cleaner</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Nutritionist">Nutritionist</option>
                <option value="Other">Other</option>
              </select>
            </CardContent>
          </Card>

          {/* Date Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Date Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Join Date Range</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div>
                    <Label className="text-xs text-gray-500">From</Label>
                    <Input
                      type="date"
                      value={filters.joinDateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, joinDateFrom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">To</Label>
                    <Input
                      type="date"
                      value={filters.joinDateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, joinDateTo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Salary Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Minimum Salary (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Min salary"
                    value={filters.salaryFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, salaryFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Maximum Salary (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Max salary"
                    value={filters.salaryTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, salaryTo: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience Range */}
          <Card>
            <CardHeader>
              <CardTitle>Experience Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Minimum Experience (months)</Label>
                  <Input
                    type="number"
                    placeholder="Min experience"
                    value={filters.experienceFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, experienceFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Maximum Experience (months)</Label>
                  <Input
                    type="number"
                    placeholder="Max experience"
                    value={filters.experienceTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, experienceTo: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Filter Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFilters(prev => ({ ...prev, status: ['Active'], salaryFrom: '', salaryTo: '' }))}
                  className="text-left justify-start"
                >
                  Active Staff Only
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFilters(prev => ({ ...prev, role: 'Trainer', status: ['Active'] }))}
                  className="text-left justify-start"
                >
                  Active Trainers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFilters(prev => ({ ...prev, salaryFrom: '30000', salaryTo: '' }))}
                  className="text-left justify-start"
                >
                  High Salary (30K+)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFilters(prev => ({ ...prev, experienceFrom: '12', experienceTo: '' }))}
                  className="text-left justify-start"
                >
                  Experienced (1+ years)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="flex justify-between space-x-3">
            <Button variant="outline" onClick={handleResetFilters}>
              Reset All
            </Button>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApplyFilters} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}