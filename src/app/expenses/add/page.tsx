'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/contexts/GymContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  Receipt, 
  IndianRupee, 
  Calendar, 
  Tag, 
  FileText,
  Loader2,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Sparkles,
  Plus,
  Settings,
  Rocket
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'

interface ExpenseFormData {
  category: string
  description: string
  amount: string
  expense_date: string
}

const PREDEFINED_CATEGORIES = [
  'Equipment',
  'Utilities', 
  'Maintenance',
  'Staff',
  'Rent',
  'Marketing',
  'Insurance',
  'Supplies',
  'Technology',
  'Other'
]

export default function AddExpensePage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const router = useRouter()
  const isClient = useClientOnly()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Equipment': '#3B82F6',
      'Utilities': '#10B981',
      'Maintenance': '#F59E0B',
      'Staff': '#8B5CF6',
      'Rent': '#EF4444',
      'Marketing': '#EC4899',
      'Insurance': '#6366F1',
      'Supplies': '#14B8A6',
      'Technology': '#06B6D4',
      'Other': '#6B7280'
    }
    return colors[category] || '#6B7280'
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0'
    }

    if (!formData.expense_date) {
      newErrors.expense_date = 'Expense date is required'
    }

    const expenseDate = new Date(formData.expense_date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    if (expenseDate > today) {
      newErrors.expense_date = 'Expense date cannot be in the future'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError('')

      if (!gymId) {
        setError('No gym found. Please complete gym setup first.')
        return
      }

      const expenseData = {
        gym_id: gymId,
        category: formData.category.trim(),
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date
      }

      const { error: expenseError } = await supabase
        .from('expenses')
        .insert([expenseData])

      if (expenseError) {
        console.error('Error creating expense:', expenseError)
        setError('Failed to create expense. Please try again.')
        return
      }

      alert('Expense created successfully!')
      router.push('/expenses')

    } catch (error) {
      console.error('Error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading gym data...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!gymId) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-8 pb-8 text-center">
              <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Complete Setup First
              </h3>
              <p className="text-gray-600 mb-6">
                You need to complete your gym setup before you can manage expenses.
              </p>
              <Link href="/setup">
                <Button>Complete Setup</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Navigation Breadcrumb */}
            <div className="flex items-center space-x-2 pt-4 text-sm">
              <Link href="/dashboard" className="text-red-100 hover:text-white transition-colors">
                Dashboard
              </Link>
              <span className="text-red-300">/</span>
              <Link href="/expenses" className="text-red-100 hover:text-white transition-colors">
                Expenses
              </Link>
              <span className="text-red-300">/</span>
              <span className="text-white font-semibold">Add Expense</span>
            </div>
            
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <Link href="/expenses">
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
                    <h1 className="text-3xl font-bold text-white">Add New Expense</h1>
                    <p className="text-red-100">Record gym expenses and transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Category Selection */}
            <Card className="mb-6 border-t-4 border-t-red-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                <CardTitle className="flex items-center text-red-800">
                  <div className="bg-red-600 p-2 rounded-lg mr-3">
                    <Tag className="h-5 w-5 text-white" />
                  </div>
                  Expense Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Category *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {PREDEFINED_CATEGORIES.map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category }))}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                          formData.category === category
                            ? 'border-transparent shadow-lg scale-105 text-white'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: formData.category === category ? getCategoryColor(category) : 'transparent',
                          color: formData.category === category ? 'white' : 'inherit'
                        }}
                      >
                        <div className="text-sm font-medium">{category}</div>
                      </button>
                    ))}
                  </div>
                  {errors.category && <p className="text-red-500 text-sm mt-2">{errors.category}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Amount and Date */}
            <Card className="mb-6 border-t-4 border-t-blue-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center text-blue-800">
                  <div className="bg-blue-600 p-2 rounded-lg mr-3">
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" className="flex items-center text-gray-700 font-semibold">
                      <IndianRupee className="h-4 w-4 mr-1 text-blue-600" />
                      Amount *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={`mt-1 ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                    />
                    {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                  </div>

                  <div>
                    <Label htmlFor="expense_date" className="flex items-center text-gray-700 font-semibold">
                      <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                      Expense Date *
                    </Label>
                    <Input
                      id="expense_date"
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                      className={`mt-1 ${errors.expense_date ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.expense_date && <p className="text-red-500 text-sm mt-1">{errors.expense_date}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="mb-6 border-t-4 border-t-gray-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gray-600 p-2 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Expense Description *</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the expense (purpose, vendor, details...)"
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.description 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                    }`}
                    maxLength={500}
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  <p className="text-gray-500 text-sm mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link href="/expenses">
                <Button type="button" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white transform hover:scale-105 transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Expense...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Add Expense
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}