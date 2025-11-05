/**
 * Notification System for GymSync Pro
 * Generates real-time notifications for gym management
 */

import { supabase } from './supabaseClient'

export interface Notification {
  id: string
  type: 
    // Member notifications
    | 'payment_due' 
    | 'expiry_soon' 
    | 'expired' 
    | 'birthday' 
    | 'new_member' 
    | 'installment_due' 
    | 'renewal_reminder'
    // Staff notifications
    | 'staff_birthday'
    | 'salary_due'
    | 'new_staff'
    | 'staff_anniversary'
    // Equipment notifications
    | 'equipment_maintenance_due'
    | 'equipment_warranty_expiring'
    | 'equipment_out_of_service'
    // Expense notifications
    | 'expense_reminder'
    | 'recurring_expense_due'
    | 'budget_exceeded'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  timestamp: string
  memberId?: string
  memberName?: string
  staffId?: string
  staffName?: string
  equipmentId?: string
  equipmentName?: string
  expenseId?: string
  expenseCategory?: string
  actionRequired: boolean
  read: boolean
  metadata?: any
}

/**
 * Get all notifications for the current gym
 */
export async function getNotifications(gymId: string): Promise<Notification[]> {
  const notifications: Notification[] = []
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  try {
    // Fetch members data
    const { data: members, error } = await supabase
      .from('members')
      .select(`
        *,
        membership_plans(name, price, duration_days)
      `)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })

    if (error || !members) {
      console.error('Error fetching members for notifications:', error)
      return []
    }

    // Get gym name for notifications
    const { data: gym } = await supabase
      .from('gyms')
      .select('name')
      .eq('id', gymId)
      .single()

    const gymName = gym?.name || 'Your Gym'

    // 1. Check for expiring memberships (within 7 days)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(today.getDate() + 7)

    members.forEach(member => {
      if (member.status !== 'active') return

      const endDate = new Date(member.end_date)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Expiring soon (1-7 days)
      if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
        notifications.push({
          id: `expiry-${member.id}`,
          type: 'expiry_soon',
          title: '⏰ Membership Expiring Soon',
          message: `${member.custom_fields?.full_name || 'Member'}'s membership expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
          priority: daysUntilExpiry <= 3 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
          memberId: member.id,
          memberName: member.custom_fields?.full_name || 'Member',
          actionRequired: true,
          read: false,
          metadata: {
            daysRemaining: daysUntilExpiry,
            endDate: member.end_date,
            phone: member.custom_fields?.phone
          }
        })
      }

      // Already expired
      if (daysUntilExpiry <= 0 && daysUntilExpiry >= -30) {
        notifications.push({
          id: `expired-${member.id}`,
          type: 'expired',
          title: '❌ Membership Expired',
          message: `${member.custom_fields?.full_name || 'Member'}'s membership expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) > 1 ? 's' : ''} ago`,
          priority: 'high',
          timestamp: new Date().toISOString(),
          memberId: member.id,
          memberName: member.custom_fields?.full_name || 'Member',
          actionRequired: true,
          read: false,
          metadata: {
            daysExpired: Math.abs(daysUntilExpiry),
            endDate: member.end_date,
            phone: member.custom_fields?.phone
          }
        })
      }
    })

    // 2. Check for birthdays
    members.forEach(member => {
      const dob = member.custom_fields?.dateOfBirth
      if (!dob) return

      const birthDate = new Date(dob)
      const birthMonth = birthDate.getMonth()
      const birthDay = birthDate.getDate()
      
      const todayMonth = today.getMonth()
      const todayDay = today.getDate()

      // Birthday today
      if (birthMonth === todayMonth && birthDay === todayDay) {
        notifications.push({
          id: `birthday-${member.id}`,
          type: 'birthday',
          title: '🎂 Birthday Today',
          message: `${member.custom_fields?.full_name || 'Member'} is celebrating their birthday today!`,
          priority: 'medium',
          timestamp: new Date().toISOString(),
          memberId: member.id,
          memberName: member.custom_fields?.full_name || 'Member',
          actionRequired: true,
          read: false,
          metadata: {
            phone: member.custom_fields?.phone,
            age: today.getFullYear() - birthDate.getFullYear()
          }
        })
      }

      // Birthday in next 3 days (advance notice)
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(today.getDate() + 3)
      
      for (let i = 1; i <= 3; i++) {
        const checkDate = new Date()
        checkDate.setDate(today.getDate() + i)
        const checkMonth = checkDate.getMonth()
        const checkDay = checkDate.getDate()

        if (birthMonth === checkMonth && birthDay === checkDay) {
          notifications.push({
            id: `birthday-upcoming-${member.id}`,
            type: 'birthday',
            title: '🎂 Birthday Coming Up',
            message: `${member.custom_fields?.full_name || 'Member'}'s birthday is on ${checkDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`,
            priority: 'low',
            timestamp: new Date().toISOString(),
            memberId: member.id,
            memberName: member.custom_fields?.full_name || 'Member',
            actionRequired: false,
            read: false,
            metadata: {
              phone: member.custom_fields?.phone,
              daysUntil: i,
              date: checkDate.toISOString()
            }
          })
        }
      }
    })

    // 3. Check for installment dues
    members.forEach(member => {
      if (!member.installment_plan?.enabled) return

      const installments = member.installment_plan.installments || []
      
      installments.forEach((installment: any) => {
        if (installment.paid) return

        const dueDate = new Date(installment.due_date)
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Overdue installments
        if (daysUntilDue < 0) {
          notifications.push({
            id: `installment-overdue-${member.id}-${installment.number}`,
            type: 'installment_due',
            title: '💰 Installment Overdue',
            message: `${member.custom_fields?.full_name || 'Member'} has an overdue installment of ₹${installment.amount}`,
            priority: 'high',
            timestamp: new Date().toISOString(),
            memberId: member.id,
            memberName: member.custom_fields?.full_name || 'Member',
            actionRequired: true,
            read: false,
            metadata: {
              phone: member.custom_fields?.phone,
              amount: installment.amount,
              dueDate: installment.due_date,
              installmentNumber: installment.number,
              daysOverdue: Math.abs(daysUntilDue)
            }
          })
        }
        // Due within 3 days
        else if (daysUntilDue >= 0 && daysUntilDue <= 3) {
          notifications.push({
            id: `installment-due-${member.id}-${installment.number}`,
            type: 'installment_due',
            title: '💰 Installment Due Soon',
            message: `${member.custom_fields?.full_name || 'Member'} has an installment of ₹${installment.amount} due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}`,
            priority: 'medium',
            timestamp: new Date().toISOString(),
            memberId: member.id,
            memberName: member.custom_fields?.full_name || 'Member',
            actionRequired: true,
            read: false,
            metadata: {
              phone: member.custom_fields?.phone,
              amount: installment.amount,
              dueDate: installment.due_date,
              installmentNumber: installment.number,
              daysUntilDue
            }
          })
        }
      })
    })

    // 4. Check for new members (joined in last 24 hours)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(today.getHours() - 24)

    members.forEach(member => {
      const joinedDate = new Date(member.created_at)
      
      if (joinedDate >= twentyFourHoursAgo) {
        notifications.push({
          id: `new-member-${member.id}`,
          type: 'new_member',
          title: '👤 New Member Joined',
          message: `${member.custom_fields?.full_name || 'Member'} joined on ${joinedDate.toLocaleDateString('en-IN')}`,
          priority: 'low',
          timestamp: new Date().toISOString(),
          memberId: member.id,
          memberName: member.custom_fields?.full_name || 'Member',
          actionRequired: false,
          read: false,
          metadata: {
            joinedDate: member.created_at,
            plan: member.membership_plans?.name
          }
        })
      }
    })

    // ============================================================================
    // STAFF NOTIFICATIONS
    // ============================================================================

    // Fetch staff data
    const { data: staff, error: staffError } = await supabase
      .from('staff_details')
      .select('*')
      .eq('gym_id', gymId)
      .eq('status', 'Active')
      .order('created_at', { ascending: false })

    if (!staffError && staff) {
      
      // 5. Check for staff birthdays
      staff.forEach(staffMember => {
        const dob = staffMember.date_of_birth
        if (!dob) return

        const birthDate = new Date(dob)
        const birthMonth = birthDate.getMonth()
        const birthDay = birthDate.getDate()
        
        const todayMonth = today.getMonth()
        const todayDay = today.getDate()

        // Birthday today
        if (birthMonth === todayMonth && birthDay === todayDay) {
          notifications.push({
            id: `staff-birthday-${staffMember.user_id}`,
            type: 'staff_birthday',
            title: '🎂 Staff Birthday Today',
            message: `${staffMember.full_name || 'Staff member'} (${staffMember.role || 'Staff'}) is celebrating their birthday today!`,
            priority: 'medium',
            timestamp: new Date().toISOString(),
            staffId: staffMember.user_id,
            staffName: staffMember.full_name || 'Staff member',
            actionRequired: true,
            read: false,
            metadata: {
              phone: staffMember.phone,
              role: staffMember.role,
              age: today.getFullYear() - birthDate.getFullYear()
            }
          })
        }

        // Birthday in next 3 days (advance notice)
        for (let i = 1; i <= 3; i++) {
          const checkDate = new Date()
          checkDate.setDate(today.getDate() + i)
          const checkMonth = checkDate.getMonth()
          const checkDay = checkDate.getDate()

          if (birthMonth === checkMonth && birthDay === checkDay) {
            notifications.push({
              id: `staff-birthday-upcoming-${staffMember.user_id}`,
              type: 'staff_birthday',
              title: '🎂 Staff Birthday Coming Up',
              message: `${staffMember.full_name || 'Staff member'}'s birthday is on ${checkDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`,
              priority: 'low',
              timestamp: new Date().toISOString(),
              staffId: staffMember.user_id,
              staffName: staffMember.full_name || 'Staff member',
              actionRequired: false,
              read: false,
              metadata: {
                phone: staffMember.phone,
                role: staffMember.role,
                daysUntil: i,
                date: checkDate.toISOString()
              }
            })
          }
        }
      })

      // 6. Check for work anniversaries
      staff.forEach(staffMember => {
        if (!staffMember.join_date) return

        const joinDate = new Date(staffMember.join_date)
        const joinMonth = joinDate.getMonth()
        const joinDay = joinDate.getDate()
        
        const todayMonth = today.getMonth()
        const todayDay = today.getDate()

        // Anniversary today (and at least 1 year)
        const yearsOfService = today.getFullYear() - joinDate.getFullYear()
        
        if (joinMonth === todayMonth && joinDay === todayDay && yearsOfService >= 1) {
          notifications.push({
            id: `staff-anniversary-${staffMember.user_id}`,
            type: 'staff_anniversary',
            title: '🎉 Work Anniversary',
            message: `${staffMember.full_name || 'Staff member'} completed ${yearsOfService} year${yearsOfService > 1 ? 's' : ''} with ${gymName} today!`,
            priority: 'medium',
            timestamp: new Date().toISOString(),
            staffId: staffMember.user_id,
            staffName: staffMember.full_name || 'Staff member',
            actionRequired: true,
            read: false,
            metadata: {
              phone: staffMember.phone,
              role: staffMember.role,
              yearsOfService,
              joinDate: staffMember.join_date
            }
          })
        }
      })

      // 7. Check for salary due (5 days before end of month for monthly salaries)
      const salaryCurrentMonth = today.getMonth()
      const salaryCurrentYear = today.getFullYear()
      const lastDayOfMonth = new Date(salaryCurrentYear, salaryCurrentMonth + 1, 0).getDate()
      const daysUntilEndOfMonth = lastDayOfMonth - today.getDate()

      if (daysUntilEndOfMonth <= 5 && daysUntilEndOfMonth >= 0) {
        // Check which staff haven't been paid this month
        const { data: salaryPayments } = await supabase
          .from('staff_salary_payments')
          .select('staff_id')
          .eq('gym_id', gymId)
          .eq('payment_month', salaryCurrentMonth + 1)
          .eq('payment_year', salaryCurrentYear)
          .eq('status', 'Paid')

        const paidStaffIds = new Set(salaryPayments?.map(p => p.staff_id) || [])

        staff.forEach(staffMember => {
          if (!paidStaffIds.has(staffMember.user_id) && staffMember.salary) {
            notifications.push({
              id: `salary-due-${staffMember.user_id}-${salaryCurrentMonth}`,
              type: 'salary_due',
              title: '💰 Salary Payment Pending',
              message: `${staffMember.full_name || 'Staff member'} (${staffMember.role || 'Staff'}) - Salary ₹${staffMember.salary.toLocaleString('en-IN')} pending for ${new Date(salaryCurrentYear, salaryCurrentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
              priority: daysUntilEndOfMonth <= 2 ? 'high' : 'medium',
              timestamp: new Date().toISOString(),
              staffId: staffMember.user_id,
              staffName: staffMember.full_name || 'Staff member',
              actionRequired: true,
              read: false,
              metadata: {
                phone: staffMember.phone,
                role: staffMember.role,
                salary: staffMember.salary,
                month: salaryCurrentMonth + 1,
                year: salaryCurrentYear,
                daysUntilEndOfMonth
              }
            })
          }
        })
      }

      // 8. New staff joined (last 24 hours)
      staff.forEach(staffMember => {
        const joinedDate = new Date(staffMember.created_at)
        
        if (joinedDate >= twentyFourHoursAgo) {
          notifications.push({
            id: `new-staff-${staffMember.user_id}`,
            type: 'new_staff',
            title: '👔 New Staff Member',
            message: `${staffMember.full_name || 'Staff member'} joined as ${staffMember.role || 'Staff'} on ${joinedDate.toLocaleDateString('en-IN')}`,
            priority: 'low',
            timestamp: new Date().toISOString(),
            staffId: staffMember.user_id,
            staffName: staffMember.full_name || 'Staff member',
            actionRequired: false,
            read: false,
            metadata: {
              joinedDate: staffMember.created_at,
              role: staffMember.role,
              salary: staffMember.salary
            }
          })
        }
      })
    }

    // ============================================================================
    // EQUIPMENT NOTIFICATIONS
    // ============================================================================

    // Fetch equipment data
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('*')
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false })

    if (!equipmentError && equipment) {
      
      // 9. Check for maintenance due
      equipment.forEach(item => {
        if (!item.next_maintenance_date || item.status === 'Out of Service') return

        const maintenanceDate = new Date(item.next_maintenance_date)
        const daysUntilMaintenance = Math.ceil((maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Maintenance overdue
        if (daysUntilMaintenance < 0) {
          notifications.push({
            id: `equipment-maintenance-overdue-${item.id}`,
            type: 'equipment_maintenance_due',
            title: '🔧 Equipment Maintenance Overdue',
            message: `${item.name} maintenance was due ${Math.abs(daysUntilMaintenance)} day${Math.abs(daysUntilMaintenance) > 1 ? 's' : ''} ago`,
            priority: 'high',
            timestamp: new Date().toISOString(),
            equipmentId: item.id,
            equipmentName: item.name,
            actionRequired: true,
            read: false,
            metadata: {
              category: item.category,
              maintenanceDate: item.next_maintenance_date,
              daysOverdue: Math.abs(daysUntilMaintenance),
              location: item.location
            }
          })
        }
        // Maintenance due soon (within 7 days)
        else if (daysUntilMaintenance >= 0 && daysUntilMaintenance <= 7) {
          notifications.push({
            id: `equipment-maintenance-due-${item.id}`,
            type: 'equipment_maintenance_due',
            title: '🔧 Equipment Maintenance Due',
            message: `${item.name} maintenance due ${daysUntilMaintenance === 0 ? 'today' : `in ${daysUntilMaintenance} day${daysUntilMaintenance > 1 ? 's' : ''}`}`,
            priority: daysUntilMaintenance <= 2 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
            equipmentId: item.id,
            equipmentName: item.name,
            actionRequired: true,
            read: false,
            metadata: {
              category: item.category,
              maintenanceDate: item.next_maintenance_date,
              daysUntilMaintenance,
              location: item.location
            }
          })
        }
      })

      // 10. Check for warranty expiring
      equipment.forEach(item => {
        if (!item.warranty_expiry_date || item.status === 'Out of Service') return

        const warrantyDate = new Date(item.warranty_expiry_date)
        const daysUntilExpiry = Math.ceil((warrantyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Warranty expiring within 30 days
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
          notifications.push({
            id: `equipment-warranty-${item.id}`,
            type: 'equipment_warranty_expiring',
            title: '📋 Equipment Warranty Expiring',
            message: `${item.name} warranty expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''} (${warrantyDate.toLocaleDateString('en-IN')})`,
            priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
            equipmentId: item.id,
            equipmentName: item.name,
            actionRequired: false,
            read: false,
            metadata: {
              category: item.category,
              warrantyExpiryDate: item.warranty_expiry_date,
              daysUntilExpiry,
              purchaseDate: item.purchase_date
            }
          })
        }
      })

      // 11. Equipment out of service
      equipment.forEach(item => {
        if (item.status !== 'Out of Service') return

        notifications.push({
          id: `equipment-out-of-service-${item.id}`,
          type: 'equipment_out_of_service',
          title: '⚠️ Equipment Out of Service',
          message: `${item.name} is currently out of service${item.notes ? `: ${item.notes}` : ''}`,
          priority: 'high',
          timestamp: new Date().toISOString(),
          equipmentId: item.id,
          equipmentName: item.name,
          actionRequired: true,
          read: false,
          metadata: {
            category: item.category,
            location: item.location,
            notes: item.notes
          }
        })
      })
    }

    // ============================================================================
    // EXPENSE NOTIFICATIONS
    // ============================================================================

    // Fetch recent expenses (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('gym_id', gymId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (!expensesError && expenses) {
      
      // 12. Calculate monthly expense totals by category
      const expenseCurrentMonth = today.getMonth()
      const expenseCurrentYear = today.getFullYear()
      const currentMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === expenseCurrentMonth && expenseDate.getFullYear() === expenseCurrentYear
      })

      // Group by category and calculate totals
      const categoryTotals = currentMonthExpenses.reduce((acc, expense) => {
        const category = expense.category || 'Other'
        acc[category] = (acc[category] || 0) + (expense.amount || 0)
        return acc
      }, {} as Record<string, number>)

      // Check for high spending categories (this month > ₹10,000)
      Object.entries(categoryTotals).forEach(([category, total]) => {
        const totalAmount = Number(total)
        if (totalAmount > 10000) {
          notifications.push({
            id: `expense-high-${category}-${expenseCurrentMonth}`,
            type: 'expense_reminder',
            title: '💸 High Expense Alert',
            message: `${category} expenses: ₹${totalAmount.toLocaleString('en-IN')} this month (${currentMonthExpenses.filter(e => e.category === category).length} transactions)`,
            priority: totalAmount > 50000 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
            expenseCategory: category,
            actionRequired: false,
            read: false,
            metadata: {
              category,
              amount: totalAmount,
              month: expenseCurrentMonth + 1,
              year: expenseCurrentYear,
              transactionCount: currentMonthExpenses.filter(e => e.category === category).length
            }
          })
        }
      })

      // 13. Check for recurring expenses due (if you have recurring expense tracking)
      // This is a placeholder - implement based on your recurring expense logic
      const recurringExpenses = expenses.filter(expense => expense.is_recurring)
      
      recurringExpenses.forEach(expense => {
        const lastPaymentDate = new Date(expense.date)
        const daysSincePayment = Math.ceil((today.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // Example: if recurring monthly and 30+ days since last payment
        if (expense.recurring_frequency === 'Monthly' && daysSincePayment >= 30) {
          notifications.push({
            id: `recurring-expense-${expense.id}`,
            type: 'recurring_expense_due',
            title: '🔄 Recurring Expense Due',
            message: `${expense.description || expense.category} (₹${expense.amount.toLocaleString('en-IN')}) - Last paid ${daysSincePayment} days ago`,
            priority: 'medium',
            timestamp: new Date().toISOString(),
            expenseId: expense.id,
            expenseCategory: expense.category,
            actionRequired: true,
            read: false,
            metadata: {
              category: expense.category,
              amount: expense.amount,
              lastPaymentDate: expense.date,
              daysSincePayment,
              frequency: expense.recurring_frequency
            }
          })
        }
      })
    }

  } catch (error) {
    console.error('Error generating notifications:', error)
  }

  // Sort notifications: high priority first, then by timestamp (newest first)
  return notifications.sort((a, b) => {
    // Priority order: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    
    if (priorityDiff !== 0) return priorityDiff
    
    // If same priority, sort by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
}

/**
 * Get notification count by priority
 */
export function getNotificationCount(notifications: Notification[]) {
  return {
    total: notifications.length,
    high: notifications.filter(n => n.priority === 'high').length,
    medium: notifications.filter(n => n.priority === 'medium').length,
    low: notifications.filter(n => n.priority === 'low').length,
  }
}

/**
 * Group notifications by type
 */
export function groupNotificationsByType(notifications: Notification[]) {
  return notifications.reduce((groups, notification) => {
    const type = notification.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(notification)
    return groups
  }, {} as Record<string, Notification[]>)
}
