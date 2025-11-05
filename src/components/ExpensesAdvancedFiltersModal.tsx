'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, 
  Filter, 
  Receipt,
  IndianRupee,
  Calendar,
  Tag,
  Settings,
  RotateCcw,
  TrendingUp,
  Target,
  BarChart3,
  DollarSign,
  Clock
} from 'lucide-react'

interface ExpenseFilterOptions {
  categories: string[]
  amountFrom: string
  amountTo: string
  dateFrom: string
  dateTo: string
  ageFrom: string
  ageTo: string
  descriptionKeywords: string[]
}

interface ExpensesAdvancedFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: ExpenseFilterOptions) => void
}

export default function ExpensesAdvancedFiltersModal({ 
  isOpen, 
  onClose, 
  onApplyFilters
}: ExpensesAdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<ExpenseFilterOptions>({
    categories: [],
    amountFrom: '',
    amountTo: '',
    dateFrom: '',
    dateTo: '',
    ageFrom: '',
    ageTo: '',
    descriptionKeywords: []
  })

  if (!isOpen) return null

  const expenseCategories = [
    'Equipment',
    'Utilities', 
    'Salaries',
    'Maintenance',
    'Rent',
    'Marketing',
    'Insurance',
    'Supplies',
    'Technology',
    'Other'
  ]

  const handleCategoryFilter = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(cat => cat !== category)
        : [...prev.categories, category]
    }))
  }

  const handleInputFilter = (field: keyof ExpenseFilterOptions, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFilters({
      categories: [],
      amountFrom: '',
      amountTo: '',
      dateFrom: '',
      dateTo: '',
      ageFrom: '',
      ageTo: '',
      descriptionKeywords: []
    })
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Equipment': 'from-blue-500 to-blue-600',
      'Utilities': 'from-green-500 to-green-600',
      'Salaries': 'from-purple-500 to-purple-600',
      'Maintenance': 'from-yellow-500 to-yellow-600',
      'Rent': 'from-red-500 to-red-600',
      'Marketing': 'from-pink-500 to-pink-600',
      'Insurance': 'from-indigo-500 to-indigo-600',
      'Supplies': 'from-teal-500 to-teal-600',
      'Technology': 'from-cyan-500 to-cyan-600',
      'Other': 'from-gray-500 to-gray-600'
    }
    return colors[category] || 'from-gray-500 to-gray-600'
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.amountFrom || filters.amountTo) count++
    if (filters.dateFrom || filters.dateTo) count++
    if (filters.ageFrom || filters.ageTo) count++
    if (filters.descriptionKeywords.length > 0) count++
    return count
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 🎨 HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Filter className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Advanced Expense Filters</h2>
                <p className="text-blue-100">
                  {getActiveFiltersCount()} active filter{getActiveFiltersCount() !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 🏷️ CATEGORY FILTERS */}
          <Card className="border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center text-lg">
                <Tag className="h-5 w-5 mr-2 text-blue-600" />
                Expense Categories ({filters.categories.length} selected)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {expenseCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryFilter(category)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      filters.categories.includes(category)
                        ? `bg-gradient-to-r ${getCategoryColor(category)} text-white border-transparent shadow-lg scale-105`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium">{category}</div>
                  </button>
                ))}
              </div>
              {filters.categories.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> {filters.categories.join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 💰 AMOUNT RANGE */}
          <Card className="border-2 border-green-100">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center text-lg">
                <IndianRupee className="h-5 w-5 mr-2 text-green-600" />
                Amount Range
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Amount (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.amountFrom}
                    onChange={(e) => handleInputFilter('amountFrom', e.target.value)}
                    className="focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Amount (₹)
                  </label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={filters.amountTo}
                    onChange={(e) => handleInputFilter('amountTo', e.target.value)}
                    className="focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: '₹0-1K', min: '0', max: '1000' },
                  { label: '₹1K-5K', min: '1000', max: '5000' },
                  { label: '₹5K-10K', min: '5000', max: '10000' },
                  { label: '₹10K+', min: '10000', max: '' }
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => setFilters(prev => ({ ...prev, amountFrom: preset.min, amountTo: preset.max }))}
                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {(filters.amountFrom || filters.amountTo) && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Range:</strong> ₹{filters.amountFrom || '0'} - ₹{filters.amountTo || '∞'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 📅 DATE RANGE */}
          <Card className="border-2 border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center text-lg">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Date Range
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleInputFilter('dateFrom', e.target.value)}
                    className="focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleInputFilter('dateTo', e.target.value)}
                    className="focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: 'Last 7 days', days: 7 },
                  { label: 'Last 30 days', days: 30 },
                  { label: 'Last 90 days', days: 90 }
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      const today = new Date()
                      const fromDate = new Date(today.getTime() - preset.days * 24 * 60 * 60 * 1000)
                      setFilters(prev => ({
                        ...prev,
                        dateFrom: fromDate.toISOString().split('T')[0],
                        dateTo: today.toISOString().split('T')[0]
                      }))
                    }}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {(filters.dateFrom || filters.dateTo) && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Period:</strong> {filters.dateFrom || 'Beginning'} to {filters.dateTo || 'Now'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ⏰ EXPENSE AGE */}
          <Card className="border-2 border-orange-100">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="flex items-center text-lg">
                <Clock className="h-5 w-5 mr-2 text-orange-600" />
                Expense Age (Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Age (Days)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.ageFrom}
                    onChange={(e) => handleInputFilter('ageFrom', e.target.value)}
                    className="focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Age (Days)
                  </label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={filters.ageTo}
                    onChange={(e) => handleInputFilter('ageTo', e.target.value)}
                    className="focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              
              {/* Quick Age Presets */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Last 7 days', max: '7' },
                    { label: 'Last 30 days', max: '30' },
                    { label: 'Last 90 days', max: '90' },
                    { label: 'This year', max: '365' }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, ageFrom: '0', ageTo: preset.max }))
                      }}
                      className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {(filters.ageFrom || filters.ageTo) && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Age Range:</strong> {filters.ageFrom || '0'} - {filters.ageTo || '∞'} days old
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 🎯 FILTER SUMMARY */}
          {getActiveFiltersCount() > 0 && (
            <Card className="border-2 border-yellow-100 bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-yellow-800">
                  <Target className="h-5 w-5 mr-2" />
                  Active Filters Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2 text-sm">
                  {filters.categories.length > 0 && (
                    <div><strong>Categories:</strong> {filters.categories.join(', ')}</div>
                  )}
                  {(filters.amountFrom || filters.amountTo) && (
                    <div><strong>Amount:</strong> ₹{filters.amountFrom || '0'} - ₹{filters.amountTo || '∞'}</div>
                  )}
                  {(filters.dateFrom || filters.dateTo) && (
                    <div><strong>Date:</strong> {filters.dateFrom || 'Beginning'} to {filters.dateTo || 'Now'}</div>
                  )}
                  {(filters.ageFrom || filters.ageTo) && (
                    <div><strong>Age:</strong> {filters.ageFrom || '0'} - {filters.ageTo || '∞'} days</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 🚀 ACTION BUTTONS */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters ({getActiveFiltersCount()})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}