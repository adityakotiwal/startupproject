/**
 * 🔥 MEMBERSHIP PLANS CSV EXPORT UTILITY 🔥
 * Enterprise-grade CSV export functionality with comprehensive analytics
 * Built with MAXIMUM HIGH MOTIVATION! 💪
 */

interface MembershipPlan {
  id: string
  gym_id: string
  name: string
  price: number
  duration_months: number
  duration_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime'
  features: string[]
  description: string
  status: 'Active' | 'Inactive' | 'Discontinued'
  is_popular: boolean
  max_members: number
  color_theme: string
  created_at: string
}

/**
 * 💰 Calculate comprehensive plan analytics
 */
function calculatePlanAnalytics(plan: MembershipPlan) {
  // Calculate standardized monthly price for comparison
  let monthlyPrice = plan.price
  
  switch (plan.duration_type) {
    case 'daily':
      monthlyPrice = plan.price * 30
      break
    case 'weekly':
      monthlyPrice = plan.price * 4.33
      break
    case 'monthly':
      monthlyPrice = plan.price
      break
    case 'yearly':
      monthlyPrice = plan.price / 12
      break
    case 'lifetime':
      monthlyPrice = plan.price / 60 // Assume 5-year value
      break
  }

  // Calculate yearly revenue potential
  const yearlyRevenue = monthlyPrice * 12
  
  // Calculate value score (features per rupee)
  const valueScore = plan.features.length / monthlyPrice * 1000
  
  // Calculate plan age in months
  const ageInMonths = Math.floor((new Date().getTime() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
  
  return {
    monthlyPrice: Math.round(monthlyPrice),
    yearlyRevenue: Math.round(yearlyRevenue),
    valueScore: Math.round(valueScore * 100) / 100,
    ageInMonths,
    featuresCount: plan.features.length,
    isUnlimited: !plan.max_members || plan.max_members === 0
  }
}

/**
 * 📊 Generate comprehensive plan summary analytics
 */
function generateSummaryAnalytics(plans: MembershipPlan[]) {
  if (plans.length === 0) return null

  const analytics = plans.map(calculatePlanAnalytics)
  
  return {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.status === 'Active').length,
    inactivePlans: plans.filter(p => p.status === 'Inactive').length,
    discontinuedPlans: plans.filter(p => p.status === 'Discontinued').length,
    popularPlans: plans.filter(p => p.is_popular).length,
    unlimitedPlans: plans.filter(p => !p.max_members || p.max_members === 0).length,
    
    // Price analytics
    avgPrice: Math.round(plans.reduce((sum, p) => sum + p.price, 0) / plans.length),
    minPrice: Math.min(...plans.map(p => p.price)),
    maxPrice: Math.max(...plans.map(p => p.price)),
    
    // Monthly price analytics
    avgMonthlyPrice: Math.round(analytics.reduce((sum, a) => sum + a.monthlyPrice, 0) / analytics.length),
    minMonthlyPrice: Math.min(...analytics.map(a => a.monthlyPrice)),
    maxMonthlyPrice: Math.max(...analytics.map(a => a.monthlyPrice)),
    
    // Revenue analytics
    totalPotentialRevenue: analytics.reduce((sum, a) => sum + a.yearlyRevenue, 0),
    avgValueScore: Math.round(analytics.reduce((sum, a) => sum + a.valueScore, 0) / analytics.length * 100) / 100,
    
    // Feature analytics
    totalFeatures: plans.reduce((sum, p) => sum + p.features.length, 0),
    avgFeaturesPerPlan: Math.round(plans.reduce((sum, p) => sum + p.features.length, 0) / plans.length * 10) / 10,
    
    // Duration type breakdown
    durationBreakdown: {
      daily: plans.filter(p => p.duration_type === 'daily').length,
      weekly: plans.filter(p => p.duration_type === 'weekly').length,
      monthly: plans.filter(p => p.duration_type === 'monthly').length,
      yearly: plans.filter(p => p.duration_type === 'yearly').length,
      lifetime: plans.filter(p => p.duration_type === 'lifetime').length
    }
  }
}

/**
 * 🎯 Export membership plans to CSV with comprehensive analytics
 */
export function exportMembershipPlansToCSV(plans: MembershipPlan[]) {
  // Generate summary analytics
  const summary = generateSummaryAnalytics(plans)
  
  // Prepare CSV headers
  const headers = [
    'Plan ID',
    'Plan Name',
    'Description',
    'Status',
    'Price (₹)',
    'Duration Value',
    'Duration Type',
    'Monthly Price (₹)',
    'Yearly Revenue Potential (₹)',
    'Is Popular',
    'Max Members',
    'Features Count',
    'Features List',
    'Value Score',
    'Plan Age (Months)',
    'Color Theme',
    'Created Date',
    'Gym ID'
  ]

  // Prepare CSV data
  const csvData = plans.map(plan => {
    const analytics = calculatePlanAnalytics(plan)
    
    return [
      plan.id,
      `"${plan.name}"`,
      `"${plan.description.replace(/"/g, '""')}"`,
      plan.status,
      plan.price,
      plan.duration_months,
      plan.duration_type,
      analytics.monthlyPrice,
      analytics.yearlyRevenue,
      plan.is_popular ? 'Yes' : 'No',
      plan.max_members || 'Unlimited',
      analytics.featuresCount,
      `"${plan.features.join('; ').replace(/"/g, '""')}"`,
      analytics.valueScore,
      analytics.ageInMonths,
      plan.color_theme || 'Default',
      new Date(plan.created_at).toLocaleDateString('en-IN'),
      plan.gym_id
    ]
  })

  // Create CSV content
  let csvContent = 'data:text/csv;charset=utf-8,'
  
  // Add summary section
  if (summary) {
    csvContent += '🔥 MEMBERSHIP PLANS ANALYTICS REPORT 🔥\n'
    csvContent += `Generated on: ${new Date().toLocaleString('en-IN')}\n`
    csvContent += '\n'
    csvContent += 'SUMMARY ANALYTICS\n'
    csvContent += `Total Plans,${summary.totalPlans}\n`
    csvContent += `Active Plans,${summary.activePlans}\n`
    csvContent += `Inactive Plans,${summary.inactivePlans}\n`
    csvContent += `Discontinued Plans,${summary.discontinuedPlans}\n`
    csvContent += `Popular Plans,${summary.popularPlans}\n`
    csvContent += `Unlimited Plans,${summary.unlimitedPlans}\n`
    csvContent += '\n'
    csvContent += 'PRICING ANALYTICS\n'
    csvContent += `Average Price (₹),${summary.avgPrice}\n`
    csvContent += `Price Range (₹),${summary.minPrice} - ${summary.maxPrice}\n`
    csvContent += `Average Monthly Price (₹),${summary.avgMonthlyPrice}\n`
    csvContent += `Monthly Price Range (₹),${summary.minMonthlyPrice} - ${summary.maxMonthlyPrice}\n`
    csvContent += `Total Potential Revenue (₹),${summary.totalPotentialRevenue.toLocaleString('en-IN')}\n`
    csvContent += `Average Value Score,${summary.avgValueScore}\n`
    csvContent += '\n'
    csvContent += 'FEATURES ANALYTICS\n'
    csvContent += `Total Features,${summary.totalFeatures}\n`
    csvContent += `Average Features per Plan,${summary.avgFeaturesPerPlan}\n`
    csvContent += '\n'
    csvContent += 'DURATION TYPE BREAKDOWN\n'
    csvContent += `Daily Plans,${summary.durationBreakdown.daily}\n`
    csvContent += `Weekly Plans,${summary.durationBreakdown.weekly}\n`
    csvContent += `Monthly Plans,${summary.durationBreakdown.monthly}\n`
    csvContent += `Yearly Plans,${summary.durationBreakdown.yearly}\n`
    csvContent += `Lifetime Plans,${summary.durationBreakdown.lifetime}\n`
    csvContent += '\n'
    csvContent += 'BUSINESS INSIGHTS\n'
    csvContent += `Most Popular Duration Type,${Object.entries(summary.durationBreakdown).reduce((a, b) => summary.durationBreakdown[a[0] as keyof typeof summary.durationBreakdown] > summary.durationBreakdown[b[0] as keyof typeof summary.durationBreakdown] ? a : b)[0]}\n`
    csvContent += `Popular Plans Ratio,${Math.round(summary.popularPlans / summary.totalPlans * 100)}%\n`
    csvContent += `Active Plans Ratio,${Math.round(summary.activePlans / summary.totalPlans * 100)}%\n`
    csvContent += `Revenue per Plan (₹),${Math.round(summary.totalPotentialRevenue / summary.totalPlans).toLocaleString('en-IN')}\n`
    csvContent += '\n\n'
  }
  
  // Add detailed data section
  csvContent += 'DETAILED MEMBERSHIP PLANS DATA\n'
  csvContent += headers.join(',') + '\n'
  csvData.forEach(row => {
    csvContent += row.join(',') + '\n'
  })

  // Create and download file
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `membership-plans-report-${new Date().toISOString().split('T')[0]}.csv`)
  
  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  console.log('🎉 Membership Plans CSV Export Complete! 📊')
}