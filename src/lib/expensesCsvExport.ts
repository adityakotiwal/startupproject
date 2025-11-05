// 🚀 ENTERPRISE-GRADE EXPENSES CSV EXPORT UTILITY
// Built with MAXIMUM HIGH MOTIVATION! 💪

interface Expense {
  id: string
  gym_id: string
  category: string
  description: string
  amount: number
  expense_date: string
  created_at: string
}

interface ExpenseAnalytics {
  totalExpenses: number
  totalAmount: number
  averageAmount: number
  categoryBreakdown: Record<string, { count: number; amount: number; percentage: number }>
  monthlyTrends: Record<string, { count: number; amount: number }>
  dateRange: { earliest: string; latest: string }
  topCategories: Array<{ category: string; amount: number; count: number }>
  expenseFrequency: Record<string, number>
}

// 📊 COMPREHENSIVE EXPENSE ANALYTICS
export const calculateExpenseAnalytics = (expenses: Expense[]): ExpenseAnalytics => {
  if (expenses.length === 0) {
    return {
      totalExpenses: 0,
      totalAmount: 0,
      averageAmount: 0,
      categoryBreakdown: {},
      monthlyTrends: {},
      dateRange: { earliest: '', latest: '' },
      topCategories: [],
      expenseFrequency: {}
    }
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalExpenses = expenses.length
  const averageAmount = totalAmount / totalExpenses

  // 📈 Category Breakdown Analysis
  const categoryBreakdown: Record<string, { count: number; amount: number; percentage: number }> = {}
  expenses.forEach(expense => {
    if (!categoryBreakdown[expense.category]) {
      categoryBreakdown[expense.category] = { count: 0, amount: 0, percentage: 0 }
    }
    categoryBreakdown[expense.category].count += 1
    categoryBreakdown[expense.category].amount += expense.amount
  })

  // Calculate percentages
  Object.keys(categoryBreakdown).forEach(category => {
    categoryBreakdown[category].percentage = (categoryBreakdown[category].amount / totalAmount) * 100
  })

  // 📅 Monthly Trends Analysis
  const monthlyTrends: Record<string, { count: number; amount: number }> = {}
  expenses.forEach(expense => {
    const month = new Date(expense.expense_date).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long' 
    })
    if (!monthlyTrends[month]) {
      monthlyTrends[month] = { count: 0, amount: 0 }
    }
    monthlyTrends[month].count += 1
    monthlyTrends[month].amount += expense.amount
  })

  // 🏆 Top Categories by Amount
  const topCategories = Object.entries(categoryBreakdown)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // 📊 Expense Frequency Analysis
  const expenseFrequency: Record<string, number> = {}
  expenses.forEach(expense => {
    const dayOfWeek = new Date(expense.expense_date).toLocaleDateString('en-IN', { weekday: 'long' })
    expenseFrequency[dayOfWeek] = (expenseFrequency[dayOfWeek] || 0) + 1
  })

  // 📅 Date Range
  const dates = expenses.map(e => new Date(e.expense_date).getTime()).sort((a, b) => a - b)
  const dateRange = {
    earliest: new Date(dates[0]).toLocaleDateString('en-IN'),
    latest: new Date(dates[dates.length - 1]).toLocaleDateString('en-IN')
  }

  return {
    totalExpenses,
    totalAmount,
    averageAmount,
    categoryBreakdown,
    monthlyTrends,
    dateRange,
    topCategories,
    expenseFrequency
  }
}

// 📈 GENERATE SUMMARY ANALYTICS
export const generateSummaryAnalytics = (analytics: ExpenseAnalytics) => {
  const insights = []

  // Financial Insights
  insights.push(`💰 Total Expenses: ₹${analytics.totalAmount.toLocaleString('en-IN')} across ${analytics.totalExpenses} transactions`)
  insights.push(`📊 Average Expense: ₹${analytics.averageAmount.toFixed(2)} per transaction`)

  // Category Insights
  const topCategory = analytics.topCategories[0]
  if (topCategory) {
    insights.push(`🏆 Highest Expense Category: ${topCategory.category} (₹${topCategory.amount.toLocaleString('en-IN')})`)
  }

  // Monthly Insights
  const monthlyEntries = Object.entries(analytics.monthlyTrends)
  if (monthlyEntries.length > 0) {
    const highestMonth = monthlyEntries.reduce((max, current) => 
      current[1].amount > max[1].amount ? current : max
    )
    insights.push(`📅 Highest Spending Month: ${highestMonth[0]} (₹${highestMonth[1].amount.toLocaleString('en-IN')})`)
  }

  // Frequency Insights
  const frequencyEntries = Object.entries(analytics.expenseFrequency)
  if (frequencyEntries.length > 0) {
    const mostActiveDay = frequencyEntries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    )
    insights.push(`📈 Most Active Day: ${mostActiveDay[0]} (${mostActiveDay[1]} expenses)`)
  }

  return insights
}

// 🎯 MAIN CSV EXPORT FUNCTION
export const exportExpensesToCSV = async (expenses: Expense[]) => {
  try {
    // Calculate comprehensive analytics
    const analytics = calculateExpenseAnalytics(expenses)
    const insights = generateSummaryAnalytics(analytics)

    // 📋 Prepare CSV headers
    const headers = [
      'Expense ID',
      'Category',
      'Description', 
      'Amount (₹)',
      'Expense Date',
      'Created Date',
      'Day of Week',
      'Month',
      'Amount (Formatted)'
    ]

    // 📊 Prepare expense data rows
    const dataRows = expenses.map(expense => {
      const expenseDate = new Date(expense.expense_date)
      const createdDate = new Date(expense.created_at)
      
      return [
        expense.id,
        expense.category || 'Uncategorized',
        expense.description || 'No description',
        expense.amount.toString(),
        expense.expense_date,
        expense.created_at,
        expenseDate.toLocaleDateString('en-IN', { weekday: 'long' }),
        expenseDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
        `₹${expense.amount.toLocaleString('en-IN')}`
      ]
    })

    // 🎨 Create analytics summary section
    const summaryRows = [
      [],
      ['=== EXPENSE ANALYTICS SUMMARY ==='],
      [],
      ['Metric', 'Value'],
      ['Total Expenses', analytics.totalExpenses.toString()],
      ['Total Amount', `₹${analytics.totalAmount.toLocaleString('en-IN')}`],
      ['Average Amount', `₹${analytics.averageAmount.toFixed(2)}`],
      ['Date Range', `${analytics.dateRange.earliest} to ${analytics.dateRange.latest}`],
      [],
      ['=== CATEGORY BREAKDOWN ==='],
      ['Category', 'Count', 'Amount', 'Percentage'],
      ...Object.entries(analytics.categoryBreakdown).map(([category, data]) => [
        category,
        data.count.toString(),
        `₹${data.amount.toLocaleString('en-IN')}`,
        `${data.percentage.toFixed(1)}%`
      ]),
      [],
      ['=== MONTHLY TRENDS ==='],
      ['Month', 'Count', 'Amount'],
      ...Object.entries(analytics.monthlyTrends).map(([month, data]) => [
        month,
        data.count.toString(),
        `₹${data.amount.toLocaleString('en-IN')}`
      ]),
      [],
      ['=== TOP 5 CATEGORIES ==='],
      ['Rank', 'Category', 'Amount', 'Count'],
      ...analytics.topCategories.map((cat, index) => [
        (index + 1).toString(),
        cat.category,
        `₹${cat.amount.toLocaleString('en-IN')}`,
        cat.count.toString()
      ]),
      [],
      ['=== BUSINESS INSIGHTS ==='],
      ...insights.map(insight => [insight])
    ]

    // 🔧 Combine all data
    const csvContent = [
      headers,
      ...dataRows,
      ...summaryRows
    ]

    // 📝 Convert to CSV format
    const csvString = csvContent
      .map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
      .join('\n')

    // 💾 Download the file
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    const filename = `expenses-analytics-${timestamp}.csv`
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(link.href)

    console.log(`✅ Expenses analytics exported successfully: ${filename}`)
    console.log(`📊 Analytics Summary:`, analytics)
    
    return { success: true, filename, analytics, insights }

  } catch (error) {
    console.error('❌ Error exporting expenses to CSV:', error)
    throw new Error('Failed to export expenses data')
  }
}

// 🎯 QUICK EXPORT CATEGORIES ONLY
export const exportCategorySummaryToCSV = async (expenses: Expense[]) => {
  const analytics = calculateExpenseAnalytics(expenses)
  
  const csvContent = [
    ['Category', 'Count', 'Total Amount', 'Average Amount', 'Percentage'],
    ...Object.entries(analytics.categoryBreakdown).map(([category, data]) => [
      category,
      data.count.toString(),
      `₹${data.amount.toLocaleString('en-IN')}`,
      `₹${(data.amount / data.count).toFixed(2)}`,
      `${data.percentage.toFixed(1)}%`
    ])
  ]
  
  const csvString = csvContent.map(row => row.join(',')).join('\n')
  const filename = `expense-categories-${new Date().toISOString().slice(0, 10)}.csv`
  
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}