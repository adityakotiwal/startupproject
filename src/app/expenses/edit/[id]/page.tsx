'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Receipt, 
  Save, 
  ArrowLeft,
  IndianRupee,
  Calendar,
  Tag,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

interface Expense {
  id: string
  gym_id: string
  category: string
  description: string
  amount: number
  expense_date: string
  created_at: string
}

export default function EditExpensePage() {
  const router = useRouter()
  const params = useParams()
  const expenseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expense, setExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expense_date: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const expenseCategories = [
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

  useEffect(() => {
    if (expenseId) {
      fetchExpense()
    }
  }, [expenseId])

  const fetchExpense = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single()

      if (error) {
        console.error('Error fetching expense:', error)
        router.push('/expenses')
        return
      }

      if (data) {
        setExpense(data)
        setFormData({
          category: data.category,
          description: data.description,
          amount: data.amount.toString(),
          expense_date: data.expense_date
        })
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/expenses')
    } finally {
      setLoading(false)
    }
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

    // Check if expense date is not in the future
    const expenseDate = new Date(formData.expense_date)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Set to end of today
    
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

    setSaving(true)

    try {
      const updateData = {
        category: formData.category,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date
      }

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expenseId)

      if (error) {
        console.error('Error updating expense:', error)
        alert('Error updating expense. Please try again.')
      } else {
        alert('Expense updated successfully!')
        router.push('/expenses')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating expense. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading expense...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Expense not found</h3>
          <p className="text-gray-500 mb-6">The expense you're looking for doesn't exist.</p>
          <Link href="/expenses">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Expenses
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 🎨 HERO HEADER */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Receipt className="h-8 w-8 mr-3" />
                Edit Expense
              </h1>
              <p className="text-blue-100 mt-2">Update "{expense.category}" expense details</p>
              <div className="flex items-center space-x-3 mt-3">
                <Badge className="bg-white/20 text-white">
                  Expense ID: {expense.id.slice(0, 8)}...
                </Badge>
                <Badge className="bg-white/20 text-white">
                  Created: {new Date(expense.created_at).toLocaleDateString('en-IN')}
                </Badge>
              </div>
            </div>
            <Link href="/expenses">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Expenses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 📊 EXPENSE INFORMATION */}
        <Card className="border-2 border-blue-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center text-xl">
              <Settings className="h-6 w-6 mr-2 text-blue-600" />
              Expense Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.category 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                >
                  <option value="">Select category</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                
                {formData.category && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(formData.category) }}
                    ></div>
                    <Badge 
                      className="text-white text-xs"
                      style={{ backgroundColor: getCategoryColor(formData.category) }}
                    >
                      {formData.category}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`pl-10 ${errors.amount ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  />
                </div>
                {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                
                {formData.amount && parseFloat(formData.amount) > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Amount: ₹{parseFloat(formData.amount).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                  className={`pl-10 ${errors.expense_date ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500 focus:border-blue-500'}`}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
              </div>
              {errors.expense_date && <p className="text-red-500 text-sm mt-1">{errors.expense_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the expense (purpose, vendor, details...)"
                  rows={4}
                  className={`w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.description 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              <p className="text-gray-500 text-sm mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 📊 EXPENSE PREVIEW */}
        {formData.category && formData.amount && (
          <Card className="border-2 border-green-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="h-6 w-6 mr-2 text-green-600" />
                Expense Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${getCategoryColor(formData.category)}20` }}
                    >
                      <Receipt 
                        className="h-6 w-6" 
                        style={{ color: getCategoryColor(formData.category) }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{formData.category}</h3>
                      <p className="text-gray-600 text-sm">
                        {formData.expense_date && new Date(formData.expense_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      ₹{parseFloat(formData.amount || '0').toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                {formData.description && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-700">{formData.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🚀 SUBMIT BUTTONS */}
        <div className="flex space-x-4 pt-6 border-t-2 border-gray-200">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-3"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Updating Expense...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Update Expense
              </>
            )}
          </Button>
          <Link href="/expenses">
            <Button type="button" variant="outline" className="flex-1 text-lg py-3 border-2">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}