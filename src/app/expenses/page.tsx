'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useGymContext } from '@/hooks/useGymContext'
import { useExpenses, useInvalidateQueries } from '@/hooks/useOptimizedData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  TrendingUp, 
  IndianRupee, 
  Calendar, 
  Receipt,
  Eye,
  Edit,
  Trash2,
  Settings,
  Target,
  BarChart3,
  RotateCcw,
  X,
  Copy,
  Repeat,
  FileDown
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppHeader from '@/components/AppHeader'
import { useClientOnly } from '@/hooks/useClientOnly'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ExpenseDetailsModal from '@/components/ExpenseDetailsModal'
import ExpensesAdvancedFiltersModal from '@/components/ExpensesAdvancedFiltersModal'
import { exportExpensesToCSV } from '@/lib/expensesCsvExport'

// Expense interface - using your exact table structure
interface Expense {
  id: string
  gym_id: string
  category: string
  description: string
  amount: number
  expense_date: string
  created_at: string
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const { currentGym, gymId, loading: gymLoading } = useGymContext()
  const isClient = useClientOnly()
  const router = useRouter()
  
  // React Query optimized data fetching
  const { data: expenses = [], isLoading, refetch } = useExpenses(gymId)
  const { invalidateExpenses } = useInvalidateQueries()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [exportingCSV, setExportingCSV] = useState(false)

  // Advanced filter states
  const [advancedFilters, setAdvancedFilters] = useState({
    categories: [] as string[],
    amountFrom: '',
    amountTo: '',
    dateFrom: '',
    dateTo: '',
    ageFrom: '',
    ageTo: '',
    descriptionKeywords: [] as string[]
  })
  
  // Refresh callback for modals
  const refreshExpenses = () => {
    refetch()
    invalidateExpenses()
  }
  
  const loading = isLoading || gymLoading

  // Filter expenses based on search term, category, and advanced filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Basic search
      const matchesSearch = searchTerm === '' || 
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Basic category filter
      const matchesCategory = categoryFilter === 'all' || expense.category.toLowerCase() === categoryFilter.toLowerCase()
      
      // Advanced filters
      // Category filter (from advanced modal)
      const matchesAdvancedCategory = advancedFilters.categories.length === 0 || 
        advancedFilters.categories.some(cat => cat.toLowerCase() === expense.category.toLowerCase())
      
      // Amount filter
      const matchesAmount = (!advancedFilters.amountFrom || expense.amount >= parseFloat(advancedFilters.amountFrom)) &&
        (!advancedFilters.amountTo || expense.amount <= parseFloat(advancedFilters.amountTo))
      
      // Date filter
      const expenseDate = new Date(expense.expense_date)
      const matchesDateFrom = !advancedFilters.dateFrom || expenseDate >= new Date(advancedFilters.dateFrom)
      const matchesDateTo = !advancedFilters.dateTo || expenseDate <= new Date(advancedFilters.dateTo)
      
      // Age filter (days old)
      const today = new Date()
      const ageInDays = Math.floor((today.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24))
      const matchesAgeFrom = !advancedFilters.ageFrom || ageInDays >= parseInt(advancedFilters.ageFrom)
      const matchesAgeTo = !advancedFilters.ageTo || ageInDays <= parseInt(advancedFilters.ageTo)
      
      return matchesSearch && matchesCategory && matchesAdvancedCategory && 
             matchesAmount && matchesDateFrom && matchesDateTo && 
             matchesAgeFrom && matchesAgeTo
    })
  }, [expenses, searchTerm, categoryFilter, advancedFilters])

  // Get category badge color
  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      'equipment': 'bg-blue-100 text-blue-800 border-blue-200',
      'utilities': 'bg-green-100 text-green-800 border-green-200',
      'salaries': 'bg-purple-100 text-purple-800 border-purple-200',
      'maintenance': 'bg-orange-100 text-orange-800 border-orange-200',
      'rent': 'bg-red-100 text-red-800 border-red-200',
      'marketing': 'bg-pink-100 text-pink-800 border-pink-200',
      'other': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    
    const colorClass = colors[category.toLowerCase()] || colors['other']
    return <Badge className={colorClass}>{category}</Badge>
  }

  // Format amount
  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })
  }

  // Button handlers
  const handleViewExpense = (expense: Expense) => {
    console.log('💼 Opening expense details for:', expense.id)
    setSelectedExpense(expense)
    setShowDetailsModal(true)
  }

  const handleEditExpense = (expense: Expense) => {
    router.push(`/expenses/edit/${expense.id}`)
  }

  const handleDeleteExpense = async (expense: Expense) => {
    if (!confirm(`Are you sure you want to delete this ${expense.category} expense of ${formatAmount(expense.amount)}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)

      if (error) throw error

      console.log('✅ Successfully deleted expense:', expense.id)
      await refreshExpenses() // Refresh the list
    } catch (error) {
      console.error('❌ Error deleting expense:', error)
      alert('Failed to delete expense. Please try again.')
    }
  }

  const handleExportCSV = async () => {
    try {
      setExportingCSV(true)
      console.log('📊 Starting CSV export for', filteredExpenses.length, 'expenses')
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay for animation
      await exportExpensesToCSV(filteredExpenses)
    } finally {
      setExportingCSV(false)
    }
  }

  const handleAdvancedFilters = () => {
    setShowAdvancedFilters(true)
  }

  const handleApplyAdvancedFilters = (filters: any) => {
    console.log('📊 Advanced filters applied:', filters)
    setAdvancedFilters(filters)
    setShowAdvancedFilters(false)
  }

  const getActiveAdvancedFiltersCount = () => {
    let count = 0
    if (advancedFilters.categories.length > 0) count++
    if (advancedFilters.amountFrom || advancedFilters.amountTo) count++
    if (advancedFilters.dateFrom || advancedFilters.dateTo) count++
    if (advancedFilters.ageFrom || advancedFilters.ageTo) count++
    return count
  }

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
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

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.expense_date)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  }).reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <AppHeader 
          onRefresh={refreshExpenses}
          isRefreshing={loading}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header with Gradient */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-red-700 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <Receipt className="h-8 w-8 text-white" />
                  <h1 className="text-3xl font-bold text-white">Expense Management</h1>
                </div>
                <p className="text-red-100 text-lg">Track, analyze, and optimize your gym expenses with powerful insights</p>
                <div className="flex items-center space-x-6 mt-4 text-sm text-red-100">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Advanced Analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Cost Optimization</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <Receipt className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Receipt className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Expenses</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Expenses Card */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatAmount(totalExpenses)}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
              <p className="text-red-100 text-xs">
                {expenses.length > 0 ? `Avg: ${formatAmount(totalExpenses / expenses.length)}` : 'No data'}
              </p>
            </div>

            {/* Monthly Expenses Card */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-orange-100 text-sm font-medium">This Month</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatAmount(monthlyExpenses)}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
              </div>
              <p className="text-orange-100 text-xs">
                {totalExpenses > 0 ? `${((monthlyExpenses / totalExpenses) * 100).toFixed(1)}% of total` : 'No data'}
              </p>
            </div>

            {/* Total Records Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Records</p>
                  <p className="text-3xl font-bold mt-1">
                    {expenses.length.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Receipt className="h-8 w-8" />
                </div>
              </div>
              <p className="text-blue-100 text-xs">
                {expenses.length > 0 ? `Latest: ${formatDate(expenses[0]?.expense_date)}` : 'No expenses yet'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Link href="/expenses/add">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
              >
                <Plus size={20} />
                Add Expense
              </button>
            </Link>
            <button 
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} className={exportingCSV ? 'animate-spin' : ''} />
              {exportingCSV ? 'Exporting...' : `Export CSV (${filteredExpenses.length})`}
            </button>
            <button 
              onClick={handleAdvancedFilters}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transform hover:scale-105 transition-all duration-200 ${
                getActiveAdvancedFiltersCount() > 0
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <Filter size={20} />
              More Filters
              {getActiveAdvancedFiltersCount() > 0 && (
                <span className="bg-purple-800 px-2 py-1 rounded-full text-xs">
                  {getActiveAdvancedFiltersCount()}
                </span>
              )}
            </button>
            {getActiveAdvancedFiltersCount() > 0 && (
              <button 
                onClick={resetAdvancedFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transform hover:scale-105 transition-all duration-200"
              >
                <RotateCcw size={20} />
                Reset Filters
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search expenses by category or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="equipment">Equipment</option>
                    <option value="utilities">Utilities</option>
                    <option value="salaries">Salaries</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="rent">Rent</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Advanced Filters Summary */}
          {getActiveAdvancedFiltersCount() > 0 && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 mb-2">
                      Active Advanced Filters ({getActiveAdvancedFiltersCount()})
                    </h3>
                    <div className="space-y-1 text-sm text-blue-700">
                      {advancedFilters.categories.length > 0 && (
                        <div><strong>Categories:</strong> {advancedFilters.categories.join(', ')}</div>
                      )}
                      {(advancedFilters.amountFrom || advancedFilters.amountTo) && (
                        <div><strong>Amount:</strong> ₹{advancedFilters.amountFrom || '0'} - ₹{advancedFilters.amountTo || '∞'}</div>
                      )}
                      {(advancedFilters.dateFrom || advancedFilters.dateTo) && (
                        <div><strong>Date:</strong> {advancedFilters.dateFrom || 'Start'} to {advancedFilters.dateTo || 'End'}</div>
                      )}
                      {(advancedFilters.ageFrom || advancedFilters.ageTo) && (
                        <div><strong>Age:</strong> {advancedFilters.ageFrom || '0'} - {advancedFilters.ageTo || '∞'} days</div>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={resetAdvancedFilters}
                    className="text-blue-600 hover:bg-blue-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expenses List */}
          {filteredExpenses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Receipt className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'No expenses match your search criteria.' 
                    : 'Get started by adding your first expense.'}
                </p>
                <Link href="/expenses/add">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Expense
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <Card 
                  key={expense.id} 
                  className="relative hover:shadow-2xl hover:scale-105 hover:border-red-300 transition-all duration-300 cursor-pointer group overflow-hidden"
                  onClick={() => handleViewExpense(expense)}
                >
                  {/* Colored background overlay on hover */}
                  <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

                  <CardContent className="p-6 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Receipt className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {expense.description || 'No Description'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {getCategoryBadge(expense.category)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600">
                              {formatAmount(expense.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(expense.expense_date).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Added: {new Date(expense.created_at).toLocaleDateString('en-IN')}
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Duplicate Expense Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (confirm('Create a duplicate of this expense?')) {
                                  try {
                                    const { data, error } = await supabase
                                      .from('expenses')
                                      .insert({
                                        gym_id: expense.gym_id,
                                        category: expense.category,
                                        amount: expense.amount,
                                        description: `${expense.description} (Copy)`,
                                        expense_date: new Date().toISOString().split('T')[0],
                                        payment_method: expense.payment_method,
                                        vendor: expense.vendor,
                                        notes: expense.notes
                                      })
                                      .select()
                                    
                                    if (error) throw error
                                    alert('Expense duplicated successfully!')
                                    invalidateExpenses()
                                  } catch (error) {
                                    console.error('Error duplicating expense:', error)
                                    alert('Failed to duplicate expense')
                                  }
                                }
                              }}
                              className="group hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-all duration-200 overflow-hidden"
                            >
                              <Copy className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                Duplicate
                              </span>
                            </Button>

                            {/* Download Receipt Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const receiptData = `
EXPENSE RECEIPT
================
Date: ${new Date(expense.expense_date).toLocaleDateString('en-IN')}
Category: ${expense.category}
Amount: ₹${expense.amount.toLocaleString('en-IN')}
Description: ${expense.description || 'N/A'}
Vendor: ${expense.vendor || 'N/A'}
Payment Method: ${expense.payment_method || 'N/A'}
Notes: ${expense.notes || 'N/A'}
================
Generated: ${new Date().toLocaleString('en-IN')}
                                `.trim()
                                
                                const blob = new Blob([receiptData], { type: 'text/plain' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `expense-receipt-${expense.id}.txt`
                                a.click()
                                URL.revokeObjectURL(url)
                              }}
                              className="group hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all duration-200 overflow-hidden"
                            >
                              <FileDown className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                Receipt
                              </span>
                            </Button>

                            {/* Edit Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditExpense(expense)}
                              className="group hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 overflow-hidden"
                            >
                              <Edit className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                Edit
                              </span>
                            </Button>

                            {/* Delete Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteExpense(expense)}
                              className="group hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 overflow-hidden"
                            >
                              <Trash2 className="h-4 w-4 flex-shrink-0" />
                              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-200 group-hover:ml-2 whitespace-nowrap">
                                Delete
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {showDetailsModal && selectedExpense && (
          <ExpenseDetailsModal
            isOpen={showDetailsModal}
            expense={selectedExpense}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedExpense(null)
            }}
            onExpenseUpdated={() => {
              refreshExpenses() // Refresh data after updates
            }}
          />
        )}

        {showAdvancedFilters && (
          <ExpensesAdvancedFiltersModal
            isOpen={showAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
            onApplyFilters={handleApplyAdvancedFilters}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}