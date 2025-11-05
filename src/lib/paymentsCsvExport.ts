/**
 * 🔥 COMPREHENSIVE PAYMENT ANALYTICS & CSV EXPORT SYSTEM 🔥
 * Enterprise-grade payment analytics with business insights
 * Built with PEAK EVEREST MOTIVATION! 💪⚡
 */

interface Payment {
  id: string
  gym_id: string
  member_id: string
  amount: number
  payment_date: string
  payment_mode: string
  notes?: string
  created_at: string
  members?: {
    id: string
    custom_fields: {
      full_name?: string
      phone?: string
      email?: string
    } | null
  }
}

interface PaymentAnalytics {
  // Revenue Analytics
  totalRevenue: number
  monthlyRevenue: number
  averagePayment: number
  revenueGrowth: number
  
  // Payment Method Analytics
  paymentMethodBreakdown: Record<string, { count: number; amount: number; percentage: number }>
  mostPopularMethod: string
  
  // Temporal Analytics
  monthlyTrends: Array<{ month: string; revenue: number; count: number }>
  dailyAverage: number
  peakPaymentDay: string
  
  // Member Analytics
  uniquePayingMembers: number
  averagePaymentPerMember: number
  topPayingMembers: Array<{ name: string; amount: number; count: number }>
  
  // Business Insights
  insights: string[]
  recommendations: string[]
}

/**
 * 🎯 CALCULATE COMPREHENSIVE PAYMENT ANALYTICS
 * Advanced analytics with business intelligence
 */
export function calculatePaymentAnalytics(payments: Payment[]): PaymentAnalytics {
  if (payments.length === 0) {
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      averagePayment: 0,
      revenueGrowth: 0,
      paymentMethodBreakdown: {},
      mostPopularMethod: '',
      monthlyTrends: [],
      dailyAverage: 0,
      peakPaymentDay: '',
      uniquePayingMembers: 0,
      averagePaymentPerMember: 0,
      topPayingMembers: [],
      insights: ['No payment data available for analysis'],
      recommendations: ['Start collecting payments to generate insights']
    }
  }

  // 💰 REVENUE ANALYTICS
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const averagePayment = totalRevenue / payments.length

  // Current month revenue
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyRevenue = payments
    .filter(payment => {
      const paymentDate = new Date(payment.payment_date)
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
    })
    .reduce((sum, payment) => sum + payment.amount, 0)

  // Revenue growth (current vs previous month)
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const previousMonthRevenue = payments
    .filter(payment => {
      const paymentDate = new Date(payment.payment_date)
      return paymentDate.getMonth() === previousMonth && paymentDate.getFullYear() === previousYear
    })
    .reduce((sum, payment) => sum + payment.amount, 0)

  const revenueGrowth = previousMonthRevenue > 0 
    ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0

  // 💳 PAYMENT METHOD ANALYTICS
  const methodStats = payments.reduce((acc, payment) => {
    const method = payment.payment_mode || 'Unknown'
    if (!acc[method]) {
      acc[method] = { count: 0, amount: 0 }
    }
    acc[method].count++
    acc[method].amount += payment.amount
    return acc
  }, {} as Record<string, { count: number; amount: number }>)

  const paymentMethodBreakdown = Object.entries(methodStats).reduce((acc, [method, stats]) => {
    acc[method] = {
      ...stats,
      percentage: (stats.amount / totalRevenue) * 100
    }
    return acc
  }, {} as Record<string, { count: number; amount: number; percentage: number }>)

  const mostPopularMethod = Object.entries(paymentMethodBreakdown)
    .sort((a, b) => b[1].amount - a[1].amount)[0]?.[0] || 'None'

  // 📊 MONTHLY TRENDS
  const monthlyData = payments.reduce((acc, payment) => {
    const date = new Date(payment.payment_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[monthKey]) {
      acc[monthKey] = { revenue: 0, count: 0 }
    }
    acc[monthKey].revenue += payment.amount
    acc[monthKey].count++
    return acc
  }, {} as Record<string, { revenue: number; count: number }>)

  const monthlyTrends = Object.entries(monthlyData)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12) // Last 12 months

  // 📅 DAILY ANALYTICS
  const totalDays = monthlyTrends.length * 30 // Approximation
  const dailyAverage = totalDays > 0 ? totalRevenue / totalDays : 0

  // Peak payment day
  const dayStats = payments.reduce((acc, payment) => {
    const day = new Date(payment.payment_date).toLocaleDateString('en-US', { weekday: 'long' })
    acc[day] = (acc[day] || 0) + payment.amount
    return acc
  }, {} as Record<string, number>)

  const peakPaymentDay = Object.entries(dayStats)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'

  // 👥 MEMBER ANALYTICS
  const memberStats = payments.reduce((acc, payment) => {
    const memberId = payment.member_id
    const memberName = payment.members?.custom_fields?.full_name || `Member ${memberId}`
    
    if (!acc[memberId]) {
      acc[memberId] = { name: memberName, amount: 0, count: 0 }
    }
    acc[memberId].amount += payment.amount
    acc[memberId].count++
    return acc
  }, {} as Record<string, { name: string; amount: number; count: number }>)

  const uniquePayingMembers = Object.keys(memberStats).length
  const averagePaymentPerMember = uniquePayingMembers > 0 ? totalRevenue / uniquePayingMembers : 0

  const topPayingMembers = Object.values(memberStats)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // 🧠 BUSINESS INSIGHTS & RECOMMENDATIONS
  const insights = []
  const recommendations = []

  // Revenue insights
  if (revenueGrowth > 10) {
    insights.push(`🚀 Excellent revenue growth of ${revenueGrowth.toFixed(1)}% this month!`)
    recommendations.push('💡 Consider expanding successful programs that drive revenue growth')
  } else if (revenueGrowth < -5) {
    insights.push(`⚠️ Revenue declined by ${Math.abs(revenueGrowth).toFixed(1)}% this month`)
    recommendations.push('🎯 Analyze factors causing revenue decline and implement retention strategies')
  }

  // Payment method insights
  const cashPercentage = paymentMethodBreakdown['cash']?.percentage || 0
  if (cashPercentage > 60) {
    insights.push(`💰 ${cashPercentage.toFixed(1)}% of payments are cash-based`)
    recommendations.push('📱 Encourage digital payments to improve transaction tracking')
  }

  // Member engagement insights
  if (averagePaymentPerMember > averagePayment * 2) {
    insights.push(`⭐ High member loyalty with ₹${averagePaymentPerMember.toLocaleString()} average per member`)
    recommendations.push('🏆 Implement referral programs to leverage loyal member base')
  }

  // Volume insights
  if (payments.length > 100) {
    insights.push(`📈 Strong payment volume with ${payments.length} transactions`)
    recommendations.push('🔄 Consider automated billing systems for efficiency')
  }

  // Seasonal insights
  if (monthlyTrends.length >= 3) {
    const recentTrend = monthlyTrends.slice(-3).map(m => m.revenue)
    const isIncreasing = recentTrend[2] > recentTrend[0]
    if (isIncreasing) {
      insights.push('📊 Positive revenue trend in recent months')
      recommendations.push('🎯 Maintain current strategies and consider scaling successful initiatives')
    }
  }

  return {
    totalRevenue,
    monthlyRevenue,
    averagePayment,
    revenueGrowth,
    paymentMethodBreakdown,
    mostPopularMethod,
    monthlyTrends,
    dailyAverage,
    peakPaymentDay,
    uniquePayingMembers,
    averagePaymentPerMember,
    topPayingMembers,
    insights,
    recommendations
  }
}

/**
 * 📊 GENERATE BUSINESS SUMMARY ANALYTICS
 * Executive summary with key performance indicators
 */
function generateSummaryAnalytics(analytics: PaymentAnalytics): string {
  const summary = []
  
  summary.push('=== 🏦 FINANCIAL PERFORMANCE SUMMARY ===')
  summary.push(`💰 Total Revenue: ₹${analytics.totalRevenue.toLocaleString('en-IN')}`)
  summary.push(`📅 This Month: ₹${analytics.monthlyRevenue.toLocaleString('en-IN')}`)
  summary.push(`📈 Growth Rate: ${analytics.revenueGrowth >= 0 ? '+' : ''}${analytics.revenueGrowth.toFixed(1)}%`)
  summary.push(`💳 Average Payment: ₹${analytics.averagePayment.toLocaleString('en-IN')}`)
  summary.push(`👥 Paying Members: ${analytics.uniquePayingMembers}`)
  summary.push('')

  summary.push('=== 💳 PAYMENT METHOD ANALYSIS ===')
  Object.entries(analytics.paymentMethodBreakdown)
    .sort((a, b) => b[1].amount - a[1].amount)
    .forEach(([method, stats]) => {
      summary.push(`${method.toUpperCase()}: ₹${stats.amount.toLocaleString('en-IN')} (${stats.percentage.toFixed(1)}%) - ${stats.count} transactions`)
    })
  summary.push('')

  summary.push('=== 🏆 TOP PERFORMING MEMBERS ===')
  analytics.topPayingMembers.forEach((member, index) => {
    summary.push(`${index + 1}. ${member.name}: ₹${member.amount.toLocaleString('en-IN')} (${member.count} payments)`)
  })
  summary.push('')

  summary.push('=== 📊 BUSINESS INSIGHTS ===')
  analytics.insights.forEach(insight => summary.push(insight))
  summary.push('')

  summary.push('=== 💡 STRATEGIC RECOMMENDATIONS ===')
  analytics.recommendations.forEach(recommendation => summary.push(recommendation))
  summary.push('')

  summary.push('=== 📈 MONTHLY TRENDS ===')
  analytics.monthlyTrends.slice(-6).forEach(trend => {
    const [year, month] = trend.month.split('-')
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    summary.push(`${monthName}: ₹${trend.revenue.toLocaleString('en-IN')} (${trend.count} payments)`)
  })

  return summary.join('\n')
}

/**
 * 🚀 MAIN CSV EXPORT FUNCTION
 * Export payments with comprehensive analytics
 */
export async function exportPaymentsToCSV(payments: Payment[]): Promise<void> {
  try {
    console.log('🔥 Starting COMPREHENSIVE payment export with analytics!', { count: payments.length })
    
    // Calculate analytics
    const analytics = calculatePaymentAnalytics(payments)
    
    // Create CSV content
    const headers = [
      'Payment ID',
      'Member Name',
      'Member Phone',
      'Amount (₹)',
      'Payment Date',
      'Payment Method',
      'Notes',
      'Days Ago',
      'Month',
      'Year',
      'Created At'
    ]

    const rows = payments.map(payment => {
      const paymentDate = new Date(payment.payment_date)
      const daysAgo = Math.floor((new Date().getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return [
        payment.id,
        payment.members?.custom_fields?.full_name || 'Unknown Member',
        payment.members?.custom_fields?.phone || 'Not provided',
        payment.amount.toLocaleString('en-IN'),
        payment.payment_date,
        payment.payment_mode || 'Not specified',
        payment.notes || 'No notes',
        daysAgo.toString(),
        paymentDate.toLocaleDateString('en-US', { month: 'long' }),
        paymentDate.getFullYear().toString(),
        payment.created_at
      ]
    })

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // Generate analytics summary
    const analyticsContent = generateSummaryAnalytics(analytics)

    // Create final content with analytics
    const finalContent = `${analyticsContent}\n\n=== 📋 DETAILED PAYMENT RECORDS ===\n\n${csvContent}`

    // Download file
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `gym_payments_analytics_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log('✅ Payment export completed successfully!')
    console.log('📊 Analytics Summary:', {
      totalRevenue: `₹${analytics.totalRevenue.toLocaleString('en-IN')}`,
      monthlyRevenue: `₹${analytics.monthlyRevenue.toLocaleString('en-IN')}`,
      growth: `${analytics.revenueGrowth.toFixed(1)}%`,
      payingMembers: analytics.uniquePayingMembers,
      mostPopularMethod: analytics.mostPopularMethod
    })

  } catch (error) {
    console.error('❌ Error exporting payments:', error)
    alert('Failed to export payments. Please try again.')
  }
}