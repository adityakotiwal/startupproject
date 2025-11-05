interface Staff {
  id: string
  user_id: string
  gym_id: string
  status: 'Active' | 'Inactive' | 'Terminated'
  full_name?: string
  phone?: string
  email?: string
  address?: string
  role?: string
  join_date?: string
  salary?: number
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

export const exportStaffToCSV = (staff: Staff[], filename?: string) => {
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

  // Function to calculate experience
  const calculateExperience = (joinDate?: string) => {
    if (!joinDate) return 'N/A'
    
    const join = new Date(joinDate)
    const today = new Date()
    const monthsDiff = (today.getFullYear() - join.getFullYear()) * 12 + 
                       (today.getMonth() - join.getMonth())
    
    if (monthsDiff < 1) return 'Less than 1 month'
    if (monthsDiff < 12) return `${monthsDiff} months`
    
    const years = Math.floor(monthsDiff / 12)
    const remainingMonths = monthsDiff % 12
    
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`
    } else {
      return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`
    }
  }

  // Calculate summary statistics
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'Active').length,
    inactive: staff.filter(s => s.status === 'Inactive').length,
    terminated: staff.filter(s => s.status === 'Terminated').length,
    totalSalary: staff.filter(s => s.status === 'Active').reduce((sum, s) => sum + (s.salary || 0), 0),
    averageSalary: staff.filter(s => s.status === 'Active' && s.salary).length > 0 
      ? staff.filter(s => s.status === 'Active').reduce((sum, s) => sum + (s.salary || 0), 0) / staff.filter(s => s.status === 'Active' && s.salary).length
      : 0,
  }

  // Build CSV content with professional formatting
  const lines: string[] = []
  
  // Header Section with Title
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('                    GYM STAFF DATABASE EXPORT')
  lines.push(`                    Generated: ${new Date().toLocaleString('en-IN')}`)
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('')
  
  // Summary Statistics Section
  lines.push('📊 SUMMARY STATISTICS')
  lines.push('─────────────────────────────────────────────────────────────────')
  lines.push(`Total Staff Members:,${stats.total}`)
  lines.push(`Active Staff:,${stats.active}`)
  lines.push(`Inactive Staff:,${stats.inactive}`)
  lines.push(`Terminated Staff:,${stats.terminated}`)
  lines.push(`Total Monthly Salary (Active):,₹${stats.totalSalary.toLocaleString('en-IN')}`)
  lines.push(`Average Salary:,₹${stats.averageSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`)
  lines.push('')
  lines.push('')
  
  // Staff Data Section
  lines.push('👥 STAFF MEMBERS DETAILS')
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('')
  
  // Column headers
  const headers = [
    'SR. NO.',
    'STAFF NAME',
    'ROLE/DESIGNATION',
    'PHONE NUMBER',
    'EMAIL ADDRESS',
    'ADDRESS',
    'EMPLOYMENT STATUS',
    'JOIN DATE',
    'EXPERIENCE',
    'MONTHLY SALARY (₹)',
    'EMERGENCY CONTACT NAME',
    'EMERGENCY CONTACT PHONE'
  ]
  lines.push(headers.join(','))
  lines.push('─────────────────────────────────────────────────────────────────')
  
  // Data rows with serial numbers
  staff.forEach((staffMember, index) => {
    const row = [
      formatCSVField(index + 1),
      formatCSVField(staffMember.full_name || 'N/A'),
      formatCSVField(staffMember.role || 'N/A'),
      formatCSVField(staffMember.phone || 'N/A'),
      formatCSVField(staffMember.email || 'N/A'),
      formatCSVField(staffMember.address || 'N/A'),
      formatCSVField(staffMember.status.toUpperCase()),
      formatCSVField(staffMember.join_date ? new Date(staffMember.join_date).toLocaleDateString('en-IN') : 'N/A'),
      formatCSVField(calculateExperience(staffMember.join_date)),
      formatCSVField(staffMember.salary ? `₹${staffMember.salary.toLocaleString('en-IN')}` : 'N/A'),
      formatCSVField(staffMember.emergency_contact_name || 'N/A'),
      formatCSVField(staffMember.emergency_contact_phone || 'N/A')
    ]
    lines.push(row.join(','))
  })
  
  // Footer Section with Salary Summary
  lines.push('')
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('                        PAYROLL SUMMARY')
  lines.push('─────────────────────────────────────────────────────────────────')
  lines.push(`Total Active Staff:,${stats.active}`)
  lines.push(`Total Monthly Payroll:,₹${stats.totalSalary.toLocaleString('en-IN')}`)
  lines.push(`Average Salary per Staff:,₹${stats.averageSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`)
  lines.push(`Annual Payroll Estimate:,₹${(stats.totalSalary * 12).toLocaleString('en-IN')}`)
  lines.push('═══════════════════════════════════════════════════════════════════')
  lines.push('                           END OF REPORT')
  lines.push(`                  Total Records: ${staff.length}`)
  lines.push('═══════════════════════════════════════════════════════════════════')
  
  const csvContent = lines.join('\n')

  // Create and download the file
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `GymStaff_Export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Advanced staff export with salary analytics
export const exportStaffWithAnalytics = (staff: Staff[], filename?: string) => {
  // Define CSV headers for analytics export
  const headers = [
    'Name',
    'Role',
    'Status',
    'Phone',
    'Email',
    'Join Date',
    'Experience (Months)',
    'Current Salary',
    'Annual Salary',
    'Salary Per Hour (Approx)',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Address'
  ]

  // Function to calculate experience in months
  const calculateExperienceMonths = (joinDate?: string) => {
    if (!joinDate) return 0
    
    const join = new Date(joinDate)
    const today = new Date()
    const monthsDiff = (today.getFullYear() - join.getFullYear()) * 12 + 
                       (today.getMonth() - join.getMonth())
    return monthsDiff
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

  // Convert staff data to CSV rows with analytics
  const csvRows = staff.map(staffMember => {
    const experienceMonths = calculateExperienceMonths(staffMember.join_date)
    const monthlySalary = staffMember.salary || 0
    const annualSalary = monthlySalary * 12
    const hourlyRate = monthlySalary / (22 * 8) // Assuming 22 working days, 8 hours per day
    
    return [
      formatCSVField(staffMember.full_name || ''),
      formatCSVField(staffMember.role || ''),
      formatCSVField(staffMember.status),
      formatCSVField(staffMember.phone || ''),
      formatCSVField(staffMember.email || ''),
      formatCSVField(staffMember.join_date ? new Date(staffMember.join_date).toLocaleDateString('en-IN') : ''),
      formatCSVField(experienceMonths),
      formatCSVField(monthlySalary),
      formatCSVField(annualSalary),
      formatCSVField(Math.round(hourlyRate)),
      formatCSVField(staffMember.emergency_contact_name || ''),
      formatCSVField(staffMember.emergency_contact_phone || ''),
      formatCSVField(staffMember.address || '')
    ].join(',')
  })

  // Add summary statistics at the top
  const totalStaff = staff.length
  const activeStaff = staff.filter(s => s.status === 'Active').length
  const averageSalary = staff.reduce((sum, s) => sum + (s.salary || 0), 0) / totalStaff
  const totalPayroll = staff.reduce((sum, s) => sum + (s.salary || 0), 0)

  const summaryRows = [
    '# STAFF ANALYTICS SUMMARY',
    `# Total Staff: ${totalStaff}`,
    `# Active Staff: ${activeStaff}`,
    `# Average Salary: ₹${Math.round(averageSalary).toLocaleString('en-IN')}`,
    `# Total Monthly Payroll: ₹${totalPayroll.toLocaleString('en-IN')}`,
    `# Total Annual Payroll: ₹${(totalPayroll * 12).toLocaleString('en-IN')}`,
    `# Generated on: ${new Date().toLocaleDateString('en-IN')}`,
    '',
    '# STAFF DATA'
  ]

  // Combine summary, headers and rows
  const csvContent = [...summaryRows, headers.join(','), ...csvRows].join('\n')

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `gym-staff-analytics-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Export staff by role/department
export const exportStaffByRole = (staff: Staff[], filename?: string) => {
  // Group staff by role
  const staffByRole = staff.reduce((groups: {[key: string]: Staff[]}, staffMember) => {
    const role = staffMember.role || 'Unassigned'
    if (!groups[role]) {
      groups[role] = []
    }
    groups[role].push(staffMember)
    return groups
  }, {})

  const headers = ['Role', 'Name', 'Status', 'Salary', 'Join Date', 'Experience', 'Phone', 'Email']
  
  const formatCSVField = (field: any) => {
    if (field === null || field === undefined) return ''
    
    const str = String(field)
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const calculateExperience = (joinDate?: string) => {
    if (!joinDate) return 'Unknown'
    
    const join = new Date(joinDate)
    const today = new Date()
    const monthsDiff = (today.getFullYear() - join.getFullYear()) * 12 + 
                       (today.getMonth() - join.getMonth())
    
    if (monthsDiff < 1) return 'Less than 1 month'
    if (monthsDiff < 12) return `${monthsDiff} months`
    
    const years = Math.floor(monthsDiff / 12)
    return `${years} ${years === 1 ? 'year' : 'years'}`
  }

  let csvRows: string[] = []
  
  // Add data grouped by role
  Object.entries(staffByRole).forEach(([role, roleStaff]) => {
    // Add role header
    csvRows.push(`\n# ${role.toUpperCase()} (${roleStaff.length} staff members)`)
    
    // Add staff data for this role
    roleStaff.forEach(staffMember => {
      csvRows.push([
        formatCSVField(role),
        formatCSVField(staffMember.full_name || ''),
        formatCSVField(staffMember.status),
        formatCSVField(staffMember.salary ? `₹${staffMember.salary.toLocaleString('en-IN')}` : ''),
        formatCSVField(staffMember.join_date ? new Date(staffMember.join_date).toLocaleDateString('en-IN') : ''),
        formatCSVField(calculateExperience(staffMember.join_date)),
        formatCSVField(staffMember.phone || ''),
        formatCSVField(staffMember.email || '')
      ].join(','))
    })
  })

  // Combine headers and rows
  const csvContent = [headers.join(','), ...csvRows].join('\n')

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `gym-staff-by-role-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Salary Payment interface
interface SalaryPayment {
  id: string
  staff_id: string
  amount: number
  payment_date: string
  payment_month: number
  payment_year: number
  payment_mode: string
  transaction_id?: string
  bonus_amount: number
  deduction_amount: number
  deduction_reason?: string
  notes?: string
  status: string
  created_at: string
}

// Extended Staff interface for salary export
interface StaffWithPayments extends Staff {
  total_paid?: number
  last_payment_date?: string
  payment_count?: number
}

// Export salary payments to CSV
export const exportSalaryPaymentsToCSV = (payments: SalaryPayment[], staffData: Staff[], filename?: string) => {
  // Function to safely format CSV fields
  const formatCSVField = (field: any) => {
    if (field === null || field === undefined) return ''
    
    const str = String(field)
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Define CSV headers
  const headers = [
    'Payment Date',
    'Staff Name',
    'Role',
    'Month/Year',
    'Base Salary',
    'Bonus',
    'Deductions',
    'Deduction Reason',
    'Total Paid',
    'Payment Mode',
    'Transaction ID',
    'Status',
    'Notes',
    'Recorded On'
  ]

  // Create a map of staff by ID for quick lookup
  const staffMap = new Map(staffData.map(s => [s.id, s]))

  // Convert payments to CSV rows
  const csvRows = payments.map(payment => {
    const staff = staffMap.get(payment.staff_id)
    const baseAmount = payment.amount - payment.bonus_amount + payment.deduction_amount

    return [
      formatCSVField(new Date(payment.payment_date).toLocaleDateString('en-IN')),
      formatCSVField(staff?.full_name || 'Unknown Staff'),
      formatCSVField(staff?.role || 'N/A'),
      formatCSVField(`${monthNames[payment.payment_month - 1]} ${payment.payment_year}`),
      formatCSVField(`₹${baseAmount.toLocaleString('en-IN')}`),
      formatCSVField(payment.bonus_amount > 0 ? `₹${payment.bonus_amount.toLocaleString('en-IN')}` : '-'),
      formatCSVField(payment.deduction_amount > 0 ? `₹${payment.deduction_amount.toLocaleString('en-IN')}` : '-'),
      formatCSVField(payment.deduction_reason || '-'),
      formatCSVField(`₹${payment.amount.toLocaleString('en-IN')}`),
      formatCSVField(payment.payment_mode),
      formatCSVField(payment.transaction_id || 'N/A'),
      formatCSVField(payment.status),
      formatCSVField(payment.notes || '-'),
      formatCSVField(new Date(payment.created_at).toLocaleDateString('en-IN') + ' ' + 
                     new Date(payment.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    ].join(',')
  })

  // Calculate summary
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalBonus = payments.reduce((sum, p) => sum + p.bonus_amount, 0)
  const totalDeductions = payments.reduce((sum, p) => sum + p.deduction_amount, 0)

  // Add summary at the top
  const summary = [
    `# SALARY PAYMENTS REPORT`,
    `# Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`,
    `# Total Payments: ${payments.length}`,
    `# Total Amount Paid: ₹${totalPaid.toLocaleString('en-IN')}`,
    `# Total Bonus: ₹${totalBonus.toLocaleString('en-IN')}`,
    `# Total Deductions: ₹${totalDeductions.toLocaleString('en-IN')}`,
    ``,
    headers.join(','),
    ...csvRows
  ]

  const csvContent = summary.join('\n')

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `staff-salary-payments-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Export staff salary summary to CSV
export const exportStaffSalarySummaryToCSV = (staffWithPayments: StaffWithPayments[], filename?: string) => {
  // Function to safely format CSV fields
  const formatCSVField = (field: any) => {
    if (field === null || field === undefined) return ''
    
    const str = String(field)
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Define CSV headers
  const headers = [
    'Staff Name',
    'Role',
    'Status',
    'Monthly Salary',
    'Join Date',
    'Total Payments Made',
    'Total Amount Paid',
    'Last Payment Date',
    'Phone',
    'Email'
  ]

  // Convert staff data to CSV rows
  const csvRows = staffWithPayments.map(staff => {
    return [
      formatCSVField(staff.full_name || ''),
      formatCSVField(staff.role || ''),
      formatCSVField(staff.status),
      formatCSVField(staff.salary ? `₹${staff.salary.toLocaleString('en-IN')}` : 'Not Set'),
      formatCSVField(staff.join_date ? new Date(staff.join_date).toLocaleDateString('en-IN') : 'N/A'),
      formatCSVField(staff.payment_count || 0),
      formatCSVField(staff.total_paid ? `₹${staff.total_paid.toLocaleString('en-IN')}` : '₹0'),
      formatCSVField(staff.last_payment_date ? new Date(staff.last_payment_date).toLocaleDateString('en-IN') : 'Never'),
      formatCSVField(staff.phone || ''),
      formatCSVField(staff.email || '')
    ].join(',')
  })

  // Calculate totals
  const totalStaff = staffWithPayments.length
  const totalSalaryExpense = staffWithPayments.reduce((sum, s) => sum + (s.total_paid || 0), 0)
  const totalMonthlySalary = staffWithPayments.reduce((sum, s) => sum + (s.salary || 0), 0)

  // Add summary at the top
  const summary = [
    `# STAFF SALARY SUMMARY`,
    `# Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}`,
    `# Total Staff: ${totalStaff}`,
    `# Total Monthly Salary Budget: ₹${totalMonthlySalary.toLocaleString('en-IN')}`,
    `# Total Amount Paid (All Time): ₹${totalSalaryExpense.toLocaleString('en-IN')}`,
    ``,
    headers.join(','),
    ...csvRows
  ]

  const csvContent = summary.join('\n')

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename || `staff-salary-summary-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}