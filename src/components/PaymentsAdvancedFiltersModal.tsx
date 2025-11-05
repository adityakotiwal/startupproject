'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Filter, CreditCard, IndianRupee, Calendar, Tag, RotateCcw, Target, Clock } from 'lucide-react'

interface PaymentFilterOptions {
  paymentModes: string[]
  amountFrom: string
  amountTo: string
  dateFrom: string
  dateTo: string
  ageFrom: string
  ageTo: string
}

interface PaymentsAdvancedFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: PaymentFilterOptions) => void
}

export default function PaymentsAdvancedFiltersModal({ 
  isOpen, 
  onClose, 
  onApplyFilters
}: PaymentsAdvancedFiltersModalProps) {
  const [filters, setFilters] = useState<PaymentFilterOptions>({
    paymentModes: [],
    amountFrom: '',
    amountTo: '',
    dateFrom: '',
    dateTo: '',
    ageFrom: '',
    ageTo: ''
  })

  if (!isOpen) return null

  const paymentModes = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Net Banking', 'Cheque', 'Digital Wallet', 'Other']

  const handlePaymentModeFilter = (mode: string) => {
    setFilters(prev => ({
      ...prev,
      paymentModes: prev.paymentModes.includes(mode)
        ? prev.paymentModes.filter(m => m !== mode)
        : [...prev.paymentModes, mode]
    }))
  }

  const handleInputFilter = (field: keyof PaymentFilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleReset = () => {
    setFilters({ paymentModes: [], amountFrom: '', amountTo: '', dateFrom: '', dateTo: '', ageFrom: '', ageTo: '' })
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const getPaymentModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      'Cash': 'from-green-500 to-green-600',
      'Card': 'from-blue-500 to-blue-600',
      'UPI': 'from-purple-500 to-purple-600',
      'Bank Transfer': 'from-indigo-500 to-indigo-600',
      'Net Banking': 'from-cyan-500 to-cyan-600',
      'Cheque': 'from-yellow-500 to-yellow-600',
      'Digital Wallet': 'from-pink-500 to-pink-600',
      'Other': 'from-gray-500 to-gray-600'
    }
    return colors[mode] || 'from-gray-500 to-gray-600'
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.paymentModes.length > 0) count++
    if (filters.amountFrom || filters.amountTo) count++
    if (filters.dateFrom || filters.dateTo) count++
    if (filters.ageFrom || filters.ageTo) count++
    return count
  }

  const applyAmountPreset = (min: string, max: string) => {
    setFilters(prev => ({ ...prev, amountFrom: min, amountTo: max }))
  }

  const applyDatePreset = (days: number) => {
    const today = new Date()
    const fromDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    setFilters(prev => ({
      ...prev,
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Filter className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Advanced Payment Filters</h2>
                <p className="text-green-100">
                  {getActiveFiltersCount()} active filter{getActiveFiltersCount() !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Card className="border-2 border-green-100">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center text-lg">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                Payment Methods ({filters.paymentModes.length} selected)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {paymentModes.map(mode => (
                  <button
                    key={mode}
                    onClick={() => handlePaymentModeFilter(mode)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      filters.paymentModes.includes(mode)
                        ? `bg-gradient-to-r ${getPaymentModeColor(mode)} text-white border-transparent shadow-lg`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center text-lg">
                <IndianRupee className="h-5 w-5 mr-2 text-blue-600" />
                Amount Range
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.amountFrom}
                    onChange={(e) => handleInputFilter('amountFrom', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={filters.amountTo}
                    onChange={(e) => handleInputFilter('amountTo', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '₹0-1K', min: '0', max: '1000' },
                  { label: '₹1K-5K', min: '1000', max: '5000' },
                  { label: '₹5K-10K', min: '5000', max: '10000' },
                  { label: '₹10K+', min: '10000', max: '' }
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => applyAmountPreset(preset.min, preset.max)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleInputFilter('dateFrom', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleInputFilter('dateTo', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Last 7 days', days: 7 },
                  { label: 'Last 30 days', days: 30 },
                  { label: 'Last 90 days', days: 90 }
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => applyDatePreset(preset.days)}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {getActiveFiltersCount() > 0 && (
            <Card className="border-2 border-yellow-100 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-yellow-800">
                  <Target className="h-5 w-5 mr-2" />
                  Active Filters ({getActiveFiltersCount()})
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {filters.paymentModes.length > 0 && (
                  <div><strong>Modes:</strong> {filters.paymentModes.join(', ')}</div>
                )}
                {(filters.amountFrom || filters.amountTo) && (
                  <div><strong>Amount:</strong> ₹{filters.amountFrom || '0'} - ₹{filters.amountTo || '∞'}</div>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <div><strong>Date:</strong> {filters.dateFrom || 'Start'} to {filters.dateTo || 'End'}</div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between items-center pt-6 border-t">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleApply} className="bg-green-600 hover:bg-green-700 text-white">
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
