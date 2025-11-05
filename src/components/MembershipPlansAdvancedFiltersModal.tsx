'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Filter, 
  Crown,
  IndianRupee,
  Calendar,
  Users,
  Settings,
  RotateCcw,
  Star,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react'

interface MembershipPlanFilterOptions {
  status: string[]
  durationType: string[]
  priceFrom: string
  priceTo: string
  isPopular: boolean | null
  hasMaxMembers: boolean | null
  featuresCountFrom: string
  featuresCountTo: string
  ageFrom: string
  ageTo: string
  memberCountFrom: string
  memberCountTo: string
}

interface MembershipPlansAdvancedFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: MembershipPlanFilterOptions) => void
}

export default function MembershipPlansAdvancedFiltersModal({ 
  isOpen, 
  onClose, 
  onApplyFilters
}: MembershipPlansAdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<MembershipPlanFilterOptions>({
    status: [],
    durationType: [],
    priceFrom: '',
    priceTo: '',
    isPopular: null,
    hasMaxMembers: null,
    featuresCountFrom: '',
    featuresCountTo: '',
    ageFrom: '',
    ageTo: '',
    memberCountFrom: '',
    memberCountTo: ''
  })

  if (!isOpen) return null

  const handleArrayFilter = (field: keyof Pick<MembershipPlanFilterOptions, 'status' | 'durationType'>, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const handleInputFilter = (field: keyof MembershipPlanFilterOptions, value: string | boolean | null) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFilters({
      status: [],
      durationType: [],
      priceFrom: '',
      priceTo: '',
      isPopular: null,
      hasMaxMembers: null,
      featuresCountFrom: '',
      featuresCountTo: '',
      ageFrom: '',
      ageTo: '',
      memberCountFrom: '',
      memberCountTo: ''
    })
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.durationType.length > 0) count++
    if (filters.priceFrom || filters.priceTo) count++
    if (filters.isPopular !== null) count++
    if (filters.hasMaxMembers !== null) count++
    if (filters.featuresCountFrom || filters.featuresCountTo) count++
    if (filters.ageFrom || filters.ageTo) count++
    if (filters.memberCountFrom || filters.memberCountTo) count++
    return count
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* 🎨 HEADER */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Filter className="h-7 w-7" />
              <div>
                <h2 className="text-xl font-bold">Advanced Plan Filters</h2>
                <p className="text-purple-100">Filter membership plans by multiple criteria</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getActiveFiltersCount() > 0 && (
                <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                  {getActiveFiltersCount()} active
                </div>
              )}
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* 🔧 FILTERS CONTENT */}
        <div className="p-6 space-y-6">
          {/* Status and Duration Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Status */}
            <Card className="border-2 border-gray-100 hover:border-purple-200 transition-colors">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <span>Plan Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {['Active', 'Inactive', 'Discontinued'].map((status) => (
                    <label key={status} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status)}
                        onChange={() => handleArrayFilter('status', status)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-700 group-hover:text-purple-600 transition-colors">
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Duration Type */}
            <Card className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Duration Type</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {['daily', 'weekly', 'monthly', 'yearly', 'lifetime'].map((type) => (
                    <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.durationType.includes(type)}
                        onChange={() => handleArrayFilter('durationType', type)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 group-hover:text-blue-600 transition-colors capitalize">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Range */}
          <Card className="border-2 border-gray-100 hover:border-green-200 transition-colors">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg flex items-center space-x-2">
                <IndianRupee className="h-5 w-5 text-green-600" />
                <span>Price Range</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Price (₹)
                  </label>
                  <Input
                    type="number"
                    value={filters.priceFrom}
                    onChange={(e) => handleInputFilter('priceFrom', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Price (₹)
                  </label>
                  <Input
                    type="number"
                    value={filters.priceTo}
                    onChange={(e) => handleInputFilter('priceTo', e.target.value)}
                    placeholder="No limit"
                    min="0"
                    className="focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Characteristics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popularity */}
            <Card className="border-2 border-gray-100 hover:border-yellow-200 transition-colors">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span>Plan Popularity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="popularity"
                      checked={filters.isPopular === null}
                      onChange={() => handleInputFilter('isPopular', null)}
                      className="text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-gray-700 group-hover:text-yellow-600 transition-colors">
                      All Plans
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="popularity"
                      checked={filters.isPopular === true}
                      onChange={() => handleInputFilter('isPopular', true)}
                      className="text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-gray-700 group-hover:text-yellow-600 transition-colors">
                      Popular Plans Only
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="popularity"
                      checked={filters.isPopular === false}
                      onChange={() => handleInputFilter('isPopular', false)}
                      className="text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-gray-700 group-hover:text-yellow-600 transition-colors">
                      Non-Popular Plans
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Member Limits */}
            <Card className="border-2 border-gray-100 hover:border-indigo-200 transition-colors">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span>Member Limits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="memberLimit"
                      checked={filters.hasMaxMembers === null}
                      onChange={() => handleInputFilter('hasMaxMembers', null)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700 group-hover:text-indigo-600 transition-colors">
                      All Plans
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="memberLimit"
                      checked={filters.hasMaxMembers === true}
                      onChange={() => handleInputFilter('hasMaxMembers', true)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700 group-hover:text-indigo-600 transition-colors">
                      Limited Member Plans
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="memberLimit"
                      checked={filters.hasMaxMembers === false}
                      onChange={() => handleInputFilter('hasMaxMembers', false)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700 group-hover:text-indigo-600 transition-colors">
                      Unlimited Plans
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Ranges */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Features Count */}
            <Card className="border-2 border-gray-100 hover:border-orange-200 transition-colors">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <span>Features Count</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Features
                    </label>
                    <Input
                      type="number"
                      value={filters.featuresCountFrom}
                      onChange={(e) => handleInputFilter('featuresCountFrom', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Features
                    </label>
                    <Input
                      type="number"
                      value={filters.featuresCountTo}
                      onChange={(e) => handleInputFilter('featuresCountTo', e.target.value)}
                      placeholder="No limit"
                      min="0"
                      className="focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Age */}
            <Card className="border-2 border-gray-100 hover:border-pink-200 transition-colors">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-pink-600" />
                  <span>Plan Age (Months)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Age
                    </label>
                    <Input
                      type="number"
                      value={filters.ageFrom}
                      onChange={(e) => handleInputFilter('ageFrom', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Age
                    </label>
                    <Input
                      type="number"
                      value={filters.ageTo}
                      onChange={(e) => handleInputFilter('ageTo', e.target.value)}
                      placeholder="No limit"
                      min="0"
                      className="focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Member Count Range */}
          <Card className="border-2 border-gray-100 hover:border-teal-200 transition-colors">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                <span>Current Member Count</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Members
                  </label>
                  <Input
                    type="number"
                    value={filters.memberCountFrom}
                    onChange={(e) => handleInputFilter('memberCountFrom', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Members
                  </label>
                  <Input
                    type="number"
                    value={filters.memberCountTo}
                    onChange={(e) => handleInputFilter('memberCountTo', e.target.value)}
                    placeholder="No limit"
                    min="0"
                    className="focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 🚀 ACTION BUTTONS */}
          <div className="flex space-x-4 pt-6 border-t">
            <Button
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters ({getActiveFiltersCount()})
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}