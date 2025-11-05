/**
 * WhatsApp Message Templates for GymSync Pro
 * Professional message templates for automated member communication
 */

export interface BirthdayWishParams {
  memberName: string
  gymName: string
}

export interface RenewalReminderParams {
  memberName: string
  gymName: string
  membershipPlan: string
  expiryDate: string
  daysRemaining: number
}

export interface FeeDueParams {
  memberName: string
  gymName: string
  dueAmount: number
  currency: string
  dueDate: string
}

export interface WelcomeMessageParams {
  memberName: string
  gymName: string
  membershipPlan?: string
  startDate?: string
  validityDays?: number
}

export interface PaymentConfirmationParams {
  memberName: string
  gymName?: string
  amount: number
  currency: string
  paymentDate: string
  paymentMode?: string
  receiptNumber?: string
}

/**
 * Generate birthday wish message
 */
export function generateBirthdayWish(params: BirthdayWishParams): string {
  const { memberName, gymName } = params
  
  return `🎉 Happy Birthday ${memberName}! 🎂

Wishing you a fantastic day filled with joy and celebration!

May this year bring you strength, success, and great health.

Thank you for being a valued member of ${gymName}.

Have a wonderful celebration! 🎈

Best wishes,
${gymName} Team`
}

/**
 * Generate renewal reminder message
 */
export function generateRenewalReminder(params: RenewalReminderParams): string {
  const { memberName, gymName, membershipPlan, expiryDate, daysRemaining } = params
  
  if (daysRemaining <= 0) {
    return `Dear ${memberName},

Your ${membershipPlan} membership at ${gymName} has expired.

Please renew your membership to continue your fitness journey without interruption.

Visit the gym or contact us to renew today.

Thank you!
${gymName}`
  }
  
  return `Dear ${memberName},

This is a friendly reminder that your ${membershipPlan} membership at ${gymName} will expire on ${expiryDate}.

You have ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining.

To continue your fitness journey without interruption, please renew your membership soon.

Reply to this message or visit the gym to renew.

Thank you!
${gymName}`
}

/**
 * Generate fee due notification
 */
export function generateFeeDueNotification(params: FeeDueParams): string {
  const { memberName, gymName, dueAmount, currency, dueDate } = params
  
  return `Dear ${memberName},

This is a reminder that your installment payment of ${currency}${dueAmount.toLocaleString()} is due on ${dueDate}.

Please make the payment at your earliest convenience to avoid any interruption.

Visit the gym or contact us for payment options.

Thank you!
${gymName}`
}

/**
 * Generate generic announcement message
 */
export function generateAnnouncement(params: {
  title: string
  message: string
  gymName: string
}): string {
  const { title, message, gymName } = params
  
  return `${title}

${message}

${gymName}`
}

/**
 * Generate welcome message for new members
 */
export function generateWelcomeMessage(params: WelcomeMessageParams): string {
  const { memberName, gymName, membershipPlan, startDate, validityDays } = params
  
  return `Welcome to ${gymName}, ${memberName}! 🎉

We're excited to have you join our fitness family!

${membershipPlan ? `Your ${membershipPlan} membership is now active.` : 'Your membership is now active.'}

Our team is here to support you on your fitness journey. Feel free to reach out if you need any assistance.

Let's achieve your fitness goals together! 💪

Best regards,
${gymName} Team`
}

/**
 * Generate payment confirmation message
 */
export function generatePaymentConfirmation(params: PaymentConfirmationParams): string {
  const { memberName, gymName, amount, currency, paymentDate, paymentMode, receiptNumber } = params
  
  return `Dear ${memberName},

Thank you for your payment! ✅

Payment Details:
• Amount: ${currency}${amount.toLocaleString()}
• Date: ${paymentDate}${paymentMode ? `\n• Mode: ${paymentMode}` : ''}${receiptNumber ? `\n• Receipt: ${receiptNumber}` : ''}

Your payment has been successfully recorded.

Thank you for being a valued member of ${gymName || 'Our Gym'}!

Best regards,
${gymName || 'Our Gym'} Team`
}

/**
 * Generate membership upgrade confirmation message
 */
export function generateMembershipUpgrade(params: {
  memberName: string
  gymName: string
  newPlan: string
  startDate: string
  endDate: string
}): string {
  const { memberName, gymName, newPlan, startDate, endDate } = params
  
  return `Dear ${memberName},

Your membership has been successfully upgraded! 🎉

New Membership Details:
• Plan: ${newPlan}
• Start Date: ${startDate}
• End Date: ${endDate}

Thank you for choosing ${gymName}. We're committed to helping you achieve your fitness goals!

Best regards,
${gymName} Team`
}

// ============================================================================
// STAFF MESSAGE TEMPLATES
// ============================================================================

/**
 * Generate welcome message for new staff members
 */
export function generateStaffWelcomeMessage(params: {
  staffName: string
  gymName: string
  role: string
  joinDate: string
  salary?: number
}): string {
  const { staffName, gymName, role, joinDate, salary } = params
  
  return `Welcome to ${gymName}, ${staffName}! 🎉

Congratulations on joining our team!

Your Employment Details:
• Role: ${role}
• Join Date: ${joinDate}${salary ? `\n• Monthly Salary: ₹${salary.toLocaleString()}` : ''}

We're excited to have you as part of our team. Together, we'll create an exceptional experience for our members.

Please feel free to reach out if you have any questions or need assistance.

Looking forward to working with you! 💼

Best regards,
${gymName} Management`
}

/**
 * Generate salary paid notification for staff
 */
export function generateSalaryPaidNotification(params: {
  staffName: string
  gymName: string
  month: string
  year: number
  amount: number
  paymentDate: string
  paymentMode: string
}): string {
  const { staffName, gymName, month, year, amount, paymentDate, paymentMode } = params
  
  return `Dear ${staffName},

Your salary has been processed! ✅

Payment Details:
• Period: ${month} ${year}
• Amount: ₹${amount.toLocaleString()}
• Payment Date: ${paymentDate}
• Payment Mode: ${paymentMode}

Thank you for your dedication and hard work at ${gymName}.

Best regards,
${gymName} Management`
}

/**
 * Generate salary update notification for staff
 */
export function generateSalaryUpdateNotification(params: {
  staffName: string
  gymName: string
  oldSalary: number
  newSalary: number
  effectiveDate: string
  reason?: string
}): string {
  const { staffName, gymName, oldSalary, newSalary, effectiveDate, reason } = params
  
  const increase = newSalary > oldSalary
  const change = Math.abs(newSalary - oldSalary)
  const percentage = ((change / oldSalary) * 100).toFixed(1)
  
  return `Dear ${staffName},

${increase ? '🎉 Congratulations!' : 'Important Update'}

Your salary has been ${increase ? 'increased' : 'updated'} at ${gymName}.

Salary Details:
• Previous Salary: ₹${oldSalary.toLocaleString()}
• New Salary: ₹${newSalary.toLocaleString()}
• ${increase ? 'Increase' : 'Change'}: ₹${change.toLocaleString()} (${percentage}%)
• Effective From: ${effectiveDate}${reason ? `\n• Reason: ${reason}` : ''}

${increase ? 'This reflects your valuable contribution to our team. Keep up the excellent work!' : 'For any questions, please contact the management.'}

Best regards,
${gymName} Management`
}

/**
 * Generate termination notification for staff
 */
export function generateStaffTerminationMessage(params: {
  staffName: string
  gymName: string
  terminationDate: string
  reason?: string
  lastWorkingDay?: string
}): string {
  const { staffName, gymName, terminationDate, reason, lastWorkingDay } = params
  
  return `Dear ${staffName},

This message is to inform you about the termination of your employment with ${gymName}.

Details:
• Termination Date: ${terminationDate}${lastWorkingDay ? `\n• Last Working Day: ${lastWorkingDay}` : ''}${reason ? `\n• Reason: ${reason}` : ''}

Please complete all necessary exit procedures and handover responsibilities as discussed.

We appreciate your service and wish you all the best in your future endeavors.

For any queries, please contact the management.

${gymName} Management`
}

/**
 * Generate staff details update notification
 */
export function generateStaffDetailsUpdateNotification(params: {
  staffName: string
  gymName: string
  updatedFields: string[]
}): string {
  const { staffName, gymName, updatedFields } = params
  
  const fieldsList = updatedFields.map(field => `• ${field}`).join('\n')
  
  return `Dear ${staffName},

Your profile information has been updated in ${gymName}'s system.

Updated Details:
${fieldsList}

If you did not request these changes or have any concerns, please contact the management immediately.

Thank you!

Best regards,
${gymName} Management`
}

/**
 * Generate staff role change notification
 */
export function generateStaffRoleChangeNotification(params: {
  staffName: string
  gymName: string
  oldRole: string
  newRole: string
  effectiveDate: string
}): string {
  const { staffName, gymName, oldRole, newRole, effectiveDate } = params
  
  return `Dear ${staffName},

Your role at ${gymName} has been updated! 🎉

Role Change Details:
• Previous Role: ${oldRole}
• New Role: ${newRole}
• Effective From: ${effectiveDate}

Congratulations on your new responsibilities! We're confident you'll excel in this role.

For any questions about your new duties, please reach out to the management.

Best regards,
${gymName} Management`
}
