/**
 * Equipment CSV Export Utilities
 * Professional CSV export functionality for gym equipment management
 */

interface Equipment {
  id: string
  gym_id: string
  name: string
  category: string
  purchase_date: string
  cost: number
  status: 'Active' | 'Maintenance' | 'Retired' | 'Broken'
  maintenance_due: string
  description: string
  serial_number: string
  warranty_expires: string
  created_at: string
}

/**
 * Calculate equipment age and analytics
 */
function calculateEquipmentAnalytics(equipment: Equipment) {
  const purchaseDate = new Date(equipment.purchase_date)
  const today = new Date()
  const ageInDays = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
  const ageInMonths = Math.floor(ageInDays / 30)
  const ageInYears = Math.floor(ageInDays / 365)

  // Warranty status
  const warrantyExpires = new Date(equipment.warranty_expires)
  const warrantyDaysLeft = Math.floor((warrantyExpires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const warrantyStatus = warrantyDaysLeft > 0 ? 'Active' : 'Expired'

  // Maintenance status
  const maintenanceDue = new Date(equipment.maintenance_due)
  const maintenanceDaysLeft = Math.floor((maintenanceDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const maintenanceStatus = maintenanceDaysLeft <= 0 ? 'Overdue' : maintenanceDaysLeft <= 7 ? 'Due Soon' : 'Up to Date'

  return {
    ageInDays,
    ageInMonths,
    ageInYears,
    ageDisplay: ageInYears > 0 ? `${ageInYears} year(s)` : `${ageInMonths} month(s)`,
    warrantyStatus,
    warrantyDaysLeft,
    maintenanceStatus,
    maintenanceDaysLeft,
    costPerYear: ageInYears > 0 ? (equipment.cost / ageInYears).toFixed(2) : equipment.cost.toFixed(2)
  }
}

/**
 * Convert equipment data to CSV format
 */
export function equipmentToCSV(equipmentList: Equipment[]): string {
  if (equipmentList.length === 0) {
    return 'No equipment data to export'
  }

  // Define CSV headers
  const headers = [
    'Equipment ID',
    'Name',
    'Category',
    'Status',
    'Serial Number',
    'Purchase Date',
    'Cost (₹)',
    'Age',
    'Maintenance Due',
    'Maintenance Status',
    'Warranty Expires',
    'Warranty Status',
    'Description',
    'Cost Per Year (₹)',
    'Created Date'
  ]

  // Convert equipment to CSV rows
  const rows = equipmentList.map(equipment => {
    const analytics = calculateEquipmentAnalytics(equipment)
    
    return [
      equipment.id,
      `"${equipment.name}"`,
      equipment.category,
      equipment.status,
      equipment.serial_number || 'N/A',
      equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString('en-IN') : 'N/A',
      equipment.cost?.toLocaleString('en-IN') || '0',
      analytics.ageDisplay,
      equipment.maintenance_due ? new Date(equipment.maintenance_due).toLocaleDateString('en-IN') : 'N/A',
      analytics.maintenanceStatus,
      equipment.warranty_expires ? new Date(equipment.warranty_expires).toLocaleDateString('en-IN') : 'N/A',
      analytics.warrantyStatus,
      `"${equipment.description || 'No description'}"`,
      analytics.costPerYear,
      new Date(equipment.created_at).toLocaleDateString('en-IN')
    ]
  })

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  return csvContent
}

/**
 * Export equipment with comprehensive analytics
 */
export function exportEquipmentWithAnalytics(equipmentList: Equipment[], filename: string = 'gym-equipment-export.csv') {
  if (equipmentList.length === 0) {
    alert('No equipment data to export')
    return
  }

  try {
    const formatCSVField = (field: any) => {
      if (field === null || field === undefined) return ''
      const str = String(field)
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Generate equipment summary
    const totalEquipment = equipmentList.length
    const activeCount = equipmentList.filter(e => e.status === 'Active').length
    const maintenanceCount = equipmentList.filter(e => e.status === 'Maintenance').length
    const brokenCount = equipmentList.filter(e => e.status === 'Broken').length
    const retiredCount = equipmentList.filter(e => e.status === 'Retired').length
    
    const totalCost = equipmentList.reduce((sum, e) => sum + (e.cost || 0), 0)
    const avgCost = totalEquipment > 0 ? totalCost / totalEquipment : 0

    // Equipment by category
    const categoryBreakdown = equipmentList.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Maintenance analytics
    const today = new Date()
    const maintenanceOverdue = equipmentList.filter(e => {
      if (!e.maintenance_due) return false
      return new Date(e.maintenance_due) < today
    }).length

    const maintenanceDueSoon = equipmentList.filter(e => {
      if (!e.maintenance_due) return false
      const due = new Date(e.maintenance_due)
      const daysUntil = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil > 0 && daysUntil <= 30
    }).length

    const warrantyExpired = equipmentList.filter(e => {
      if (!e.warranty_expires) return false
      return new Date(e.warranty_expires) < today
    }).length

    const warrantyActive = equipmentList.filter(e => {
      if (!e.warranty_expires) return false
      return new Date(e.warranty_expires) >= today
    }).length

    // Build CSV with professional formatting
    const lines: string[] = []
    
    // Header Section
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('                   GYM EQUIPMENT INVENTORY REPORT')
    lines.push(`                    Generated: ${new Date().toLocaleString('en-IN')}`)
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('')
    
    // Summary Statistics
    lines.push('📊 INVENTORY SUMMARY')
    lines.push('─────────────────────────────────────────────────────────────────')
    lines.push(`Total Equipment Items:,${totalEquipment}`)
    lines.push(`Active Equipment:,${activeCount}`)
    lines.push(`In Maintenance:,${maintenanceCount}`)
    lines.push(`Broken/Non-Functional:,${brokenCount}`)
    lines.push(`Retired Equipment:,${retiredCount}`)
    lines.push('')
    
    // Financial Summary
    lines.push('💰 FINANCIAL SUMMARY')
    lines.push('─────────────────────────────────────────────────────────────────')
    lines.push(`Total Investment:,₹${totalCost.toLocaleString('en-IN')}`)
    lines.push(`Average Cost per Item:,₹${avgCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`)
    lines.push(`Active Equipment Value:,₹${equipmentList.filter(e => e.status === 'Active').reduce((sum, e) => sum + (e.cost || 0), 0).toLocaleString('en-IN')}`)
    lines.push('')
    
    // Category Breakdown
    lines.push('📦 CATEGORY BREAKDOWN')
    lines.push('─────────────────────────────────────────────────────────────────')
    Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        const categoryValue = equipmentList
          .filter(e => e.category === category)
          .reduce((sum, e) => sum + (e.cost || 0), 0)
        lines.push(`${category}:,${count} items,₹${categoryValue.toLocaleString('en-IN')}`)
      })
    lines.push('')
    
    // Maintenance Alerts
    lines.push('🔧 MAINTENANCE & WARRANTY STATUS')
    lines.push('─────────────────────────────────────────────────────────────────')
    lines.push(`Maintenance Overdue:,${maintenanceOverdue} items,⚠️ Immediate Action Required`)
    lines.push(`Maintenance Due Soon (30 days):,${maintenanceDueSoon} items,📅 Plan Scheduled Maintenance`)
    lines.push(`Warranty Active:,${warrantyActive} items,✅ Protected`)
    lines.push(`Warranty Expired:,${warrantyExpired} items,❌ Out of Warranty`)
    lines.push('')
    lines.push('')
    
    // Detailed Equipment Data
    lines.push('🏋️ DETAILED EQUIPMENT INVENTORY')
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('')
    
    // Column Headers
    const headers = [
      'SR. NO.',
      'EQUIPMENT NAME',
      'CATEGORY',
      'STATUS',
      'SERIAL NUMBER',
      'PURCHASE DATE',
      'COST (₹)',
      'AGE',
      'NEXT MAINTENANCE',
      'MAINTENANCE STATUS',
      'WARRANTY EXPIRES',
      'WARRANTY STATUS',
      'COST PER YEAR (₹)',
      'DESCRIPTION'
    ]
    lines.push(headers.join(','))
    lines.push('─────────────────────────────────────────────────────────────────')
    
    // Data Rows
    equipmentList.forEach((equipment, index) => {
      const analytics = calculateEquipmentAnalytics(equipment)
      
      const row = [
        formatCSVField(index + 1),
        formatCSVField(equipment.name),
        formatCSVField(equipment.category),
        formatCSVField(equipment.status.toUpperCase()),
        formatCSVField(equipment.serial_number || 'N/A'),
        formatCSVField(equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString('en-IN') : 'N/A'),
        formatCSVField(`₹${(equipment.cost || 0).toLocaleString('en-IN')}`),
        formatCSVField(analytics.ageDisplay),
        formatCSVField(equipment.maintenance_due ? new Date(equipment.maintenance_due).toLocaleDateString('en-IN') : 'N/A'),
        formatCSVField(analytics.maintenanceStatus),
        formatCSVField(equipment.warranty_expires ? new Date(equipment.warranty_expires).toLocaleDateString('en-IN') : 'N/A'),
        formatCSVField(analytics.warrantyStatus),
        formatCSVField(`₹${analytics.costPerYear}`),
        formatCSVField(equipment.description || 'No description')
      ]
      lines.push(row.join(','))
    })
    
    // Footer
    lines.push('')
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('                      MAINTENANCE RECOMMENDATIONS')
    lines.push('─────────────────────────────────────────────────────────────────')
    if (maintenanceOverdue > 0) {
      lines.push(`⚠️ URGENT: ${maintenanceOverdue} equipment items need immediate maintenance`)
    }
    if (maintenanceDueSoon > 0) {
      lines.push(`📅 ${maintenanceDueSoon} equipment items require maintenance within 30 days`)
    }
    if (brokenCount > 0) {
      lines.push(`🔴 ${brokenCount} broken equipment items need repair or replacement`)
    }
    if (warrantyExpired > 0) {
      lines.push(`⏰ ${warrantyExpired} equipment items are out of warranty`)
    }
    lines.push('═══════════════════════════════════════════════════════════════════')
    lines.push('                           END OF REPORT')
    lines.push(`                    Total Equipment: ${totalEquipment} items`)
    lines.push(`                    Total Value: ₹${totalCost.toLocaleString('en-IN')}`)
    lines.push('═══════════════════════════════════════════════════════════════════')

    const fullContent = lines.join('\n')

    // Create and download file
    const blob = new Blob(['\uFEFF' + fullContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename || `GymEquipment_Export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    console.log(`✅ Equipment export successful: ${totalEquipment} items exported`)
  } catch (error) {
    console.error('❌ Equipment export error:', error)
    alert('Error exporting equipment data. Please try again.')
  }
}

/**
 * Export basic equipment list (simple format)
 */
export function exportEquipmentBasic(equipmentList: Equipment[], filename: string = 'equipment-list.csv') {
  const csvContent = equipmentToCSV(equipmentList)
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}