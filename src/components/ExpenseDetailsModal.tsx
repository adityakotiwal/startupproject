'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Receipt,
  IndianRupee,
  Calendar,
  Tag,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  TrendingUp,
  Target,
  Settings,
  CheckCircle,
  XCircle,
  Activity,
  Award,
  Clock,
  FileText,
  DollarSign,
  PieChart
} from 'lucide-react'
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

interface ExpenseDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  expense: Expense
  onExpenseUpdated: () => void
}

export default function ExpenseDetailsModal({ 
  isOpen, 
  onClose, 
  expense,
  onExpenseUpdated 
}: ExpenseDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [categoryStats, setCategoryStats] = useState({
    totalInCategory: 0,
    averageInCategory: 0,
    rankInCategory: 0
  })

  useEffect(() => {
    if (isOpen && expense) {
      fetchCategoryStats()
    }
  }, [isOpen, expense])

  if (!isOpen || !expense) return null

  const fetchCategoryStats = async () => {
    try {
      // Fetch all expenses in the same category for analytics
      const { data: categoryExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('gym_id', expense.gym_id)
        .eq('category', expense.category)
        .order('amount', { ascending: false })

      if (categoryExpenses) {
        const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
        const average = total / categoryExpenses.length
        const rank = categoryExpenses.findIndex(exp => exp.amount <= expense.amount) + 1

        setCategoryStats({
          totalInCategory: total,
          averageInCategory: average,
          rankInCategory: rank
        })
      }
    } catch (error) {
      console.error('Error fetching category stats:', error)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: newStatus })
        .eq('id', expense.id)

      if (error) {
        console.error('Error updating expense status:', error)
        alert('Error updating expense. Please try again.')
      } else {
        onExpenseUpdated()
        onClose()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)

      if (error) {
        console.error('Error deleting expense:', error)
        alert('Error deleting expense. Please try again.')
      } else {
        alert('Expense deleted successfully!')
        onExpenseUpdated()
        onClose()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error deleting expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          gym_id: expense.gym_id,
          category: expense.category,
          description: `Copy of ${expense.description}`,
          amount: expense.amount,
          expense_date: new Date().toISOString().split('T')[0] // Today's date
        }])

      if (error) {
        console.error('Error duplicating expense:', error)
        alert('Error duplicating expense. Please try again.')
      } else {
        alert('Expense duplicated successfully!')
        onExpenseUpdated()
        onClose()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error duplicating expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const getDaysAgo = (date: string) => {
    const expenseDate = new Date(date)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - expenseDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
      'Other': '#6B7280'
    }
    return colors[category] || '#6B7280'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 🎨 HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Expense Details</h2>
                <p className="text-blue-100">
                  ID: {expense.id.slice(0, 8)}... • Created {getDaysAgo(expense.created_at)} days ago
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
          {/* 📊 ANALYTICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Amount</p>
                    <p className="text-2xl font-bold">{formatAmount(expense.amount)}</p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-green-100" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Category Avg</p>
                    <p className="text-2xl font-bold">{formatAmount(categoryStats.averageInCategory)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-100" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Rank in Category</p>
                    <p className="text-2xl font-bold">#{categoryStats.rankInCategory}</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-100" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Days Ago</p>
                    <p className="text-2xl font-bold">{getDaysAgo(expense.expense_date)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-100" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 📋 EXPENSE INFORMATION */}
          <Card className="border-2 border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center text-xl">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Expense Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      ></div>
                      <Badge 
                        className="text-white"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {expense.category}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                      {formatAmount(expense.amount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Expense Date</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-lg font-medium">
                        {new Date(expense.expense_date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <p className="text-lg font-medium">
                        {new Date(expense.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {expense.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="mt-1 text-lg text-gray-800 bg-gray-50 p-4 rounded-lg border">
                    {expense.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 📊 CATEGORY ANALYTICS */}
          <Card className="border-2 border-green-100">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center text-xl">
                <PieChart className="h-6 w-6 mr-2 text-green-600" />
                Category Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatAmount(categoryStats.totalInCategory)}
                  </div>
                  <p className="text-sm text-gray-600">Total in Category</p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatAmount(categoryStats.averageInCategory)}
                  </div>
                  <p className="text-sm text-gray-600">Category Average</p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    #{categoryStats.rankInCategory}
                  </div>
                  <p className="text-sm text-gray-600">Rank by Amount</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  This expense is <span className="font-semibold">
                    {expense.amount > categoryStats.averageInCategory ? 'above' : 'below'}
                  </span> average for the <span className="font-semibold">{expense.category}</span> category
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 🚀 ACTION BUTTONS */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              onClick={() => window.open(`/expenses/edit/${expense.id}`, '_blank')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              disabled={loading}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Expense
            </Button>

            <Button
              variant="outline"
              onClick={handleDuplicate}
              className="border-green-300 text-green-700 hover:bg-green-50"
              disabled={loading}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>

            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <Button
              variant="outline"
              onClick={onClose}
              className="ml-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}