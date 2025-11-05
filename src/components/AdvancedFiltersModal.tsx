'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Filter, Calendar, Users, CreditCard } from 'lucide-react'

interface FilterOptions {
  status: string[]
  membershipPlan: string
  joinDateFrom: string
  joinDateTo: string
  expiryDateFrom: string
  expiryDateTo: string
  gender: string
  ageFrom: string
  ageTo: string
  paymentStatus: string
}

interface AdvancedFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: FilterOptions) => void
  membershipPlans: Array<{ id: string; name: string }>
}

export default function AdvancedFiltersModal({ 
  isOpen, 
  onClose, 
  onApplyFilters,
  membershipPlans 
}: AdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    membershipPlan: '',
    joinDateFrom: '',
    joinDateTo: '',
    expiryDateFrom: '',
    expiryDateTo: '',
    gender: '',
    ageFrom: '',
    ageTo: '',
    paymentStatus: ''
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
      membershipPlan: '',
      joinDateFrom: '',
      joinDateTo: '',
      expiryDateFrom: '',
      expiryDateTo: '',
      gender: '',
      ageFrom: '',
      ageTo: '',
      paymentStatus: ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Filter className="h-6 w-6" />
              <h2 className="text-xl font-bold">Advanced Filters</h2>
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
          {/* Member Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Member Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {['active', 'inactive', 'expired', 'suspended'].map((status) => (
                  <label key={status} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => handleStatusChange(status, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="capitalize text-sm font-medium">{status}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Membership Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                Membership Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={filters.membershipPlan}
                onChange={(e) => setFilters(prev => ({ ...prev, membershipPlan: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Plans</option>
                {membershipPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
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

              <div>
                <Label className="text-sm font-medium text-gray-700">Expiry Date Range</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div>
                    <Label className="text-xs text-gray-500">From</Label>
                    <Input
                      type="date"
                      value={filters.expiryDateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, expiryDateFrom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">To</Label>
                    <Input
                      type="date"
                      value={filters.expiryDateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, expiryDateTo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card>
            <CardHeader>
              <CardTitle>Demographics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Gender</Label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Age Range</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div>
                    <Label className="text-xs text-gray-500">From</Label>
                    <Input
                      type="number"
                      placeholder="Min age"
                      value={filters.ageFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, ageFrom: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">To</Label>
                    <Input
                      type="number"
                      placeholder="Max age"
                      value={filters.ageTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, ageTo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Payment Status</option>
                <option value="up-to-date">Up to Date</option>
                <option value="overdue">Overdue</option>
                <option value="never-paid">Never Paid</option>
              </select>
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
              <Button onClick={handleApplyFilters} className="bg-gradient-to-r from-purple-600 to-blue-600">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}