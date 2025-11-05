interface Member {
  id: string
  user_id: string
  gym_id: string
  plan_id: string
  start_date: string
  end_date: string
  status: 'active' | 'inactive' | 'expired' | 'suspended'
  custom_fields: {
    full_name?: string
    phone?: string
    email?: string
    dateOfBirth?: string
    gender?: string
    address?: string
    pincode?: string
    emergencyContact?: string
    emergencyPhone?: string
  } | null
  created_at: string
  updated_at: string
  membership_plans?: {
    name: string
    price: number
    duration_days: number
  }
}

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

export const exportMembersToCSV = (members: Member[], filename?: string) => {
  // Function to safely format CSV fields (escape commas, quotes, etc.)
  const formatCSVField = (field: any) => {
    if (field === null || field === undefined) return ''
    
    const str = String(field)
    // If field contains comma, newline, or quote, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Function to calculate days remaining
  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const timeDiff = end.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    return daysDiff
  }

  // Calculate summary statistics
  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    inactive: members.filter(m => m.status === 'inactive').length,
    expired: members.filter(m => m.status === 'expired').length,
    suspended: members.filter(m => m.status === 'suspended').length,
    male: members.filter(m => m.custom_fields?.gender?.toLowerCase() === 'male').length,
    female: members.filter(m => m.custom_fields?.gender?.toLowerCase() === 'female').length,
    expiringSoon: members.filter(m => {
      const days = calculateDaysRemaining(m.end_date)
      return days > 0 && days <= 7
    }).length,
  }

  // Build CSV content with professional formatting
  const lines: string[] = []
  
  // Header Section with Title
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('                    GYM MEMBERS DATABASE EXPORT')
  lines.push(`                    Generated: ${new Date().toLocaleString('en-IN')}`)
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('')
  
  // Summary Statistics Section
  lines.push('📊 SUMMARY STATISTICS')
  lines.push('─────────────────────────────────────────────────────────────────')
  lines.push(`Total Members:,${stats.total}`)
  lines.push(`Active Members:,${stats.active}`)
  lines.push(`Inactive Members:,${stats.inactive}`)
  lines.push(`Expired Members:,${stats.expired}`)
  lines.push(`Suspended Members:,${stats.suspended}`)
  lines.push(`Male Members:,${stats.male}`)
  lines.push(`Female Members:,${stats.female}`)
  lines.push(`Memberships Expiring Soon (≤7 days):,${stats.expiringSoon}`)
  lines.push('')
  lines.push('')
  
  // Members Data Section
  lines.push('👥 MEMBERS DETAILS')
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('')
  
  // Column headers
  const headers = [
    'SR. NO.',
    'MEMBER NAME',
    'PHONE NUMBER',
    'EMAIL ADDRESS',
    'GENDER',
    'DATE OF BIRTH',
    'AGE',
    'ADDRESS',
    'PINCODE',
    'MEMBERSHIP PLAN',
    'PLAN PRICE (₹)',
    'START DATE',
    'END DATE',
    'DAYS REMAINING',
    'STATUS',
    'EMERGENCY CONTACT',
    'EMERGENCY PHONE',
    'JOINED ON'
  ]
  lines.push(headers.join(','))
  lines.push('─────────────────────────────────────────────────────────────────')
  
  // Data rows with serial numbers and calculated age
  members.forEach((member, index) => {
    const daysRemaining = calculateDaysRemaining(member.end_date)
    const age = member.custom_fields?.dateOfBirth 
      ? Math.floor((new Date().getTime() - new Date(member.custom_fields.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : ''
    
    const row = [
      formatCSVField(index + 1),
      formatCSVField(member.custom_fields?.full_name || 'N/A'),
      formatCSVField(member.custom_fields?.phone || 'N/A'),
      formatCSVField(member.custom_fields?.email || 'N/A'),
      formatCSVField(member.custom_fields?.gender || 'N/A'),
      formatCSVField(member.custom_fields?.dateOfBirth ? new Date(member.custom_fields.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'),
      formatCSVField(age || 'N/A'),
      formatCSVField(member.custom_fields?.address || 'N/A'),
      formatCSVField(member.custom_fields?.pincode || 'N/A'),
      formatCSVField(member.membership_plans?.name || 'N/A'),
      formatCSVField(member.membership_plans?.price ? `₹${member.membership_plans.price.toLocaleString('en-IN')}` : 'N/A'),
      formatCSVField(new Date(member.start_date).toLocaleDateString('en-IN')),
      formatCSVField(new Date(member.end_date).toLocaleDateString('en-IN')),
      formatCSVField(daysRemaining > 0 ? `${daysRemaining} days` : `Expired ${Math.abs(daysRemaining)} days ago`),
      formatCSVField(member.status.toUpperCase()),
      formatCSVField(member.custom_fields?.emergencyContact || 'N/A'),
      formatCSVField(member.custom_fields?.emergencyPhone || 'N/A'),
      formatCSVField(new Date(member.created_at).toLocaleDateString('en-IN'))
    ]
    lines.push(row.join(','))
  })
  
  // Footer Section
  lines.push('')
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('                           END OF REPORT')
  lines.push(`                  Total Records: ${members.length}`)
  lines.push('═══════════════════════════════════════════════════════════════════')
  
  const csvContent = lines.join('\n')

  // Create and download the file
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `GymMembers_Export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const exportMembersToExcel = (members: Member[], filename?: string) => {
  // For now, we'll export as CSV which can be opened in Excel
  // In the future, you could add a library like xlsx to create actual Excel files
  exportMembersToCSV(members, filename?.replace('.xlsx', '.csv'))
}

// Advanced export with custom fields selection
export const exportMembersAdvanced = (
  members: Member[], 
  selectedFields: string[], 
  filename?: string
) => {
  const fieldMapping: { [key: string]: (member: Member) => string } = {
    'name': (m) => m.custom_fields?.full_name || '',
    'phone': (m) => m.custom_fields?.phone || '',
    'email': (m) => m.custom_fields?.email || '',
    'gender': (m) => m.custom_fields?.gender || '',
    'dateOfBirth': (m) => m.custom_fields?.dateOfBirth || '',
    'address': (m) => m.custom_fields?.address || '',
    'pincode': (m) => m.custom_fields?.pincode || '',
    'membershipPlan': (m) => m.membership_plans?.name || '',
    'planPrice': (m) => String(m.membership_plans?.price || ''),
    'startDate': (m) => new Date(m.start_date).toLocaleDateString('en-IN'),
    'endDate': (m) => new Date(m.end_date).toLocaleDateString('en-IN'),
    'status': (m) => m.status.charAt(0).toUpperCase() + m.status.slice(1),
    'daysRemaining': (m) => {
      const endDate = new Date(m.end_date)
      const today = new Date()
      const timeDiff = endDate.getTime() - today.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      return String(daysDiff)
    },
    'emergencyContact': (m) => m.custom_fields?.emergencyContact || '',
    'emergencyPhone': (m) => m.custom_fields?.emergencyPhone || '',
    'joinDate': (m) => new Date(m.created_at).toLocaleDateString('en-IN')
  }

  const fieldLabels: { [key: string]: string } = {
    'name': 'Name',
    'phone': 'Phone',
    'email': 'Email',
    'gender': 'Gender',
    'dateOfBirth': 'Date of Birth',
    'address': 'Address',
    'pincode': 'Pincode',
    'membershipPlan': 'Membership Plan',
    'planPrice': 'Plan Price',
    'startDate': 'Start Date',
    'endDate': 'End Date',
    'status': 'Status',
    'daysRemaining': 'Days Remaining',
    'emergencyContact': 'Emergency Contact',
    'emergencyPhone': 'Emergency Phone',
    'joinDate': 'Join Date'
  }

  // Function to safely format CSV fields
  const formatCSVField = (field: any) => {
    if (field === null || field === undefined) return ''
    
    const str = String(field)
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Create headers for selected fields
  const headers = selectedFields.map(field => fieldLabels[field] || field)

  // Convert members data to CSV rows with only selected fields
  const csvRows = members.map(member => {
    return selectedFields.map(field => {
      const getValue = fieldMapping[field]
      return formatCSVField(getValue ? getValue(member) : '')
    }).join(',')
  })

  // Combine headers and rows
  const csvContent = [headers.join(','), ...csvRows].join('\n')

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `gym-members-custom-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const exportPaymentsToCSV = (payments: Payment[], filename?: string) => {
  // Define CSV headers
  const headers = [
    'Payment ID',
    'Member Name',
    'Member Phone',
    'Member Email',
    'Amount (₹)',
    'Payment Mode',
    'Payment Date',
    'Notes',
    'Recorded On'
  ]

  // Function to safely format CSV fields (escape commas, quotes, etc.)
  const formatCSVField = (field: any) => {
    if (field === null || field === undefined) return ''
    
    const str = String(field)
    // If field contains comma, newline, or quote, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Format amount in Indian Rupees
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN')
  }

  // Convert payments data to CSV rows
  const csvRows = payments.map(payment => {
    return [
      formatCSVField(payment.id),
      formatCSVField(payment.members?.custom_fields?.full_name || 'Unknown Member'),
      formatCSVField(payment.members?.custom_fields?.phone || ''),
      formatCSVField(payment.members?.custom_fields?.email || ''),
      formatCSVField(formatAmount(payment.amount)),
      formatCSVField(payment.payment_mode),
      formatCSVField(new Date(payment.payment_date).toLocaleDateString('en-IN')),
      formatCSVField(payment.notes || ''),
      formatCSVField(new Date(payment.created_at).toLocaleDateString('en-IN') + ' ' + 
                     new Date(payment.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    ].join(',')
  })

  // Combine headers and rows
  const csvContent = [headers.join(','), ...csvRows].join('\n')

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `gym-payments-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Analytics export function
interface AnalyticsData {
  generatedAt: string
  gymName?: string
  dateRange: string
  memberGrowth: any[]
  revenueData: any[]
  paymentModes: any[]
  memberStatus: any[]
  expenseCategories: any[]
  monthlyComparison: any[]
  retentionRate: number
  churnRate: number
  avgRevenuePerMember: number
  paymentCollectionRate: number
  profitMargin: number
  activeMembers: number
  newMembersThisMonth: number
  membersTurnover: number
}

export const exportAnalyticsToCSV = (analyticsData: AnalyticsData, filename?: string) => {
  // Function to safely format CSV fields
  const formatCSVField = (field: any) => {
    if (field === null || field === undefined) return ''
    
    const str = String(field)
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Build CSV with professional formatting
  const lines: string[] = []
  
  // Header Section
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('                    GYM ANALYTICS DASHBOARD REPORT')
  lines.push(`                    Generated: ${new Date(analyticsData.generatedAt).toLocaleString('en-IN')}`)
  lines.push(`                    Gym: ${analyticsData.gymName || 'Not Specified'}`)
  lines.push(`                    Period: ${analyticsData.dateRange}`)
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('')
  
  // Executive Summary - Key Performance Indicators
  lines.push('📊 EXECUTIVE SUMMARY - KEY PERFORMANCE INDICATORS')
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('')
  lines.push('MEMBERSHIP METRICS')
  lines.push('─────────────────────────────────────────────────────────────────')
  lines.push(`Active Members:,${formatCSVField(analyticsData.activeMembers)},members`)
  lines.push(`New Members This Month:,${formatCSVField(analyticsData.newMembersThisMonth)},members`)
  lines.push(`Member Turnover:,${formatCSVField(analyticsData.membersTurnover)},members`)
  lines.push(`Retention Rate:,${formatCSVField((analyticsData.retentionRate * 100).toFixed(2))}%,${analyticsData.retentionRate >= 0.8 ? '✅ Excellent' : analyticsData.retentionRate >= 0.6 ? '⚠️ Good' : '❌ Needs Improvement'}`)
  lines.push(`Churn Rate:,${formatCSVField((analyticsData.churnRate * 100).toFixed(2))}%,${analyticsData.churnRate <= 0.1 ? '✅ Low' : analyticsData.churnRate <= 0.2 ? '⚠️ Moderate' : '❌ High'}`)
  lines.push('')
  
  lines.push('FINANCIAL METRICS')
  lines.push('─────────────────────────────────────────────────────────────────')
  lines.push(`Avg Revenue Per Member:,₹${formatCSVField(analyticsData.avgRevenuePerMember.toLocaleString('en-IN', { maximumFractionDigits: 2 }))},per member`)
  lines.push(`Payment Collection Rate:,${formatCSVField((analyticsData.paymentCollectionRate * 100).toFixed(2))}%,${analyticsData.paymentCollectionRate >= 0.9 ? '✅ Excellent' : analyticsData.paymentCollectionRate >= 0.7 ? '⚠️ Good' : '❌ Needs Attention'}`)
  lines.push(`Profit Margin:,${formatCSVField((analyticsData.profitMargin * 100).toFixed(2))}%,${analyticsData.profitMargin >= 0.3 ? '✅ Healthy' : analyticsData.profitMargin >= 0.15 ? '⚠️ Moderate' : '❌ Low'}`)
  lines.push('')
  lines.push('')

  // Member Growth Analysis
  if (analyticsData.memberGrowth && analyticsData.memberGrowth.length > 0) {
    lines.push('📈 MEMBER GROWTH ANALYSIS')
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('')
    
    const growthHeaders = Object.keys(analyticsData.memberGrowth[0])
    lines.push(growthHeaders.map(h => formatCSVField(h.toUpperCase())).join(','))
    lines.push('─────────────────────────────────────────────────────────────────')
    
    analyticsData.memberGrowth.forEach(row => {
      lines.push(growthHeaders.map(h => formatCSVField(row[h])).join(','))
    })
    lines.push('')
    lines.push('')
  }

  // Revenue Analysis
  if (analyticsData.revenueData && analyticsData.revenueData.length > 0) {
    lines.push('💰 REVENUE ANALYSIS')
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('')
    
    const revenueHeaders = Object.keys(analyticsData.revenueData[0])
    lines.push(revenueHeaders.map(h => formatCSVField(h.toUpperCase())).join(','))
    lines.push('─────────────────────────────────────────────────────────────────')
    
    // Calculate totals
    const totalRevenue = analyticsData.revenueData.reduce((sum, row) => sum + (parseFloat(row.revenue) || 0), 0)
    
    analyticsData.revenueData.forEach(row => {
      lines.push(revenueHeaders.map(h => {
        const value = row[h]
        if (h.toLowerCase().includes('revenue') || h.toLowerCase().includes('amount')) {
          return formatCSVField(`₹${parseFloat(value || 0).toLocaleString('en-IN')}`)
        }
        return formatCSVField(value)
      }).join(','))
    })
    
    lines.push('─────────────────────────────────────────────────────────────────')
    lines.push(`TOTAL REVENUE:,₹${totalRevenue.toLocaleString('en-IN')}`)
    lines.push('')
    lines.push('')
  }

  // Payment Modes Distribution
  if (analyticsData.paymentModes && analyticsData.paymentModes.length > 0) {
    lines.push('💳 PAYMENT MODES DISTRIBUTION')
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('')
    lines.push('PAYMENT MODE,TRANSACTIONS,PERCENTAGE,TREND')
    lines.push('─────────────────────────────────────────────────────────────────')
    
    const total = analyticsData.paymentModes.reduce((sum, pm) => sum + (pm.value || 0), 0)
    analyticsData.paymentModes
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .forEach((pm, index) => {
        const percentage = total > 0 ? ((pm.value / total) * 100).toFixed(1) : '0'
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  '
        lines.push(`${formatCSVField(pm.name)},${formatCSVField(pm.value)} transactions,${percentage}%,${medal}`)
      })
    
    lines.push('─────────────────────────────────────────────────────────────────')
    lines.push(`TOTAL TRANSACTIONS:,${total}`)
    lines.push('')
    lines.push('')
  }

  // Member Status Distribution
  if (analyticsData.memberStatus && analyticsData.memberStatus.length > 0) {
    lines.push('👥 MEMBER STATUS DISTRIBUTION')
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('')
    lines.push('STATUS,COUNT,PERCENTAGE,VISUAL')
    lines.push('─────────────────────────────────────────────────────────────────')
    
    const total = analyticsData.memberStatus.reduce((sum, ms) => sum + (ms.value || 0), 0)
    analyticsData.memberStatus
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .forEach(ms => {
        const percentage = total > 0 ? ((ms.value / total) * 100).toFixed(1) : '0'
        const barLength = Math.round(parseFloat(percentage) / 5)
        const visualBar = '█'.repeat(barLength) + '░'.repeat(20 - barLength)
        lines.push(`${formatCSVField(ms.name.toUpperCase())},${formatCSVField(ms.value)} members,${percentage}%,${visualBar}`)
      })
    
    lines.push('─────────────────────────────────────────────────────────────────')
    lines.push(`TOTAL MEMBERS:,${total}`)
    lines.push('')
    lines.push('')
  }

  // Expense Categories Analysis
  if (analyticsData.expenseCategories && analyticsData.expenseCategories.length > 0) {
    lines.push('💸 EXPENSE CATEGORIES BREAKDOWN')
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('')
    lines.push('CATEGORY,AMOUNT (₹),PERCENTAGE,RANKING')
    lines.push('─────────────────────────────────────────────────────────────────')
    
    const total = analyticsData.expenseCategories.reduce((sum, ec) => sum + (ec.value || 0), 0)
    analyticsData.expenseCategories
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .forEach((ec, index) => {
        const percentage = total > 0 ? ((ec.value / total) * 100).toFixed(1) : '0'
        const ranking = index === 0 ? '🔴 Highest' : index === analyticsData.expenseCategories.length - 1 ? '🟢 Lowest' : '🟡 Medium'
        lines.push(`${formatCSVField(ec.name)},₹${formatCSVField(ec.value.toLocaleString('en-IN'))},${percentage}%,${ranking}`)
      })
    
    lines.push('─────────────────────────────────────────────────────────────────')
    lines.push(`TOTAL EXPENSES:,₹${total.toLocaleString('en-IN')}`)
    lines.push('')
    lines.push('')
  }

  // Monthly Comparison
  if (analyticsData.monthlyComparison && analyticsData.monthlyComparison.length > 0) {
    lines.push('📅 MONTHLY PERFORMANCE COMPARISON')
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('')
    
    const comparisonHeaders = Object.keys(analyticsData.monthlyComparison[0])
    lines.push(comparisonHeaders.map(h => formatCSVField(h.toUpperCase())).join(','))
    lines.push('─────────────────────────────────────────────────────────────────')
    
    analyticsData.monthlyComparison.forEach(row => {
      lines.push(comparisonHeaders.map(h => {
        const value = row[h]
        if (typeof value === 'number' && h.toLowerCase().includes('revenue')) {
          return formatCSVField(`₹${value.toLocaleString('en-IN')}`)
        }
        return formatCSVField(value)
      }).join(','))
    })
    lines.push('')
    lines.push('')
  }

  // Business Insights & Recommendations
  lines.push('💡 BUSINESS INSIGHTS & RECOMMENDATIONS')
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('')
  
  // Generate automated insights
  const insights: string[] = []
  
  if (analyticsData.retentionRate >= 0.8) {
    insights.push('✅ Excellent member retention! Keep up the great service quality.')
  } else if (analyticsData.retentionRate < 0.6) {
    insights.push('⚠️ Member retention needs improvement. Consider loyalty programs.')
  }
  
  if (analyticsData.churnRate > 0.15) {
    insights.push('❌ High churn rate detected. Investigate reasons for member dropout.')
  }
  
  if (analyticsData.paymentCollectionRate < 0.8) {
    insights.push('⚠️ Payment collection needs attention. Implement automated reminders.')
  }
  
  if (analyticsData.profitMargin < 0.15) {
    insights.push('⚠️ Low profit margin. Review pricing strategy and reduce unnecessary expenses.')
  }
  
  if (analyticsData.newMembersThisMonth > analyticsData.activeMembers * 0.1) {
    insights.push('🎉 Strong member acquisition! Focus on retention to maintain growth.')
  }
  
  insights.forEach((insight, index) => {
    lines.push(`${index + 1}. ${insight}`)
  })
  
  lines.push('')
  lines.push('')
  
  // Footer
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('                        END OF ANALYTICS REPORT')
  lines.push(`                    Generated on: ${new Date().toLocaleDateString('en-IN')}`)
  lines.push('                    For internal use only')
  lines.push('═══════════════════════════════════════════════════════════════════')

  const csvContent = lines.join('\n')

  // Create and download the file
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `GymAnalytics_Report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}