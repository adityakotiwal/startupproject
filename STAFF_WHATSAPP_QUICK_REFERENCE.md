# Staff WhatsApp - Quick Reference Card

## 📱 Message Types

| Event | When Triggered | Template Function |
|-------|---------------|------------------|
| **Welcome** | New staff added | `generateStaffWelcomeMessage()` |
| **Salary Paid** | Payment recorded | `generateSalaryPaidNotification()` |
| **Salary Update** | Salary changed | `generateSalaryUpdateNotification()` |
| **Termination** | Staff terminated | `generateStaffTerminationMessage()` |
| **Role Change** | Role updated | `generateStaffRoleChangeNotification()` |

## 🎯 Integration Points

```typescript
// 1. STAFF ADDITION (add/page.tsx - line 282)
if (phone && valid) {
  generateStaffWelcomeMessage({ staffName, gymName, role, joinDate, salary })
}

// 2. SALARY PAYMENT (RecordSalaryPaymentModal.tsx - line 143)
if (phone && valid) {
  generateSalaryPaidNotification({ staffName, month, year, amount, paymentDate, paymentMode })
}

// 3. SALARY UPDATE (SalaryUpdateModal.tsx - line 122)
if (phone && valid) {
  generateSalaryUpdateNotification({ staffName, oldSalary, newSalary, effectiveDate, reason })
}

// 4. TERMINATION (staff/page.tsx - line 688)
if (phone && valid) {
  generateStaffTerminationMessage({ staffName, terminationDate, lastWorkingDay })
}

// 5. ROLE CHANGE (EditStaffModal.tsx - line 112)
if (roleChanged && phone && valid) {
  generateStaffRoleChangeNotification({ staffName, oldRole, newRole, effectiveDate })
}
```

## ✅ Validation Rules

```typescript
// Phone must be 10 digits
/^\d{10}$/.test(phone.replace(/\D/g, ''))

// Auto-formats to: whatsapp:+91{number}
```

## 🔧 API Call Pattern

```typescript
const response = await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    to: phone.replace(/\D/g, ''),
    message: generatedMessage,
    messageType: 'staff_welcome',
    metadata: { staff_id, role, join_date }
  })
})
```

## 📝 Template Parameters

### Welcome Message
- `staffName`, `gymName`, `role`, `joinDate`, `salary?`

### Salary Paid
- `staffName`, `gymName`, `month`, `year`, `amount`, `paymentDate`, `paymentMode`

### Salary Update
- `staffName`, `gymName`, `oldSalary`, `newSalary`, `effectiveDate`, `reason?`

### Termination
- `staffName`, `gymName`, `terminationDate`, `reason?`, `lastWorkingDay?`

### Role Change
- `staffName`, `gymName`, `oldRole`, `newRole`, `effectiveDate`

## 🎨 Message Format Example

```
Welcome to ABC Gym, John Doe! 🎉

Congratulations on joining our team!

Your Employment Details:
• Role: Fitness Trainer
• Join Date: 15 January 2024
• Monthly Salary: ₹30,000

We're excited to have you as part of our team...

Best regards,
ABC Gym Management
```

## 🔍 Error Handling

```typescript
try {
  // Send WhatsApp
  console.log('📱 Sending WhatsApp...')
  // ... send logic
  console.log('✅ WhatsApp sent successfully!')
} catch (whatsappError) {
  console.error('❌ WhatsApp error (non-critical):', whatsappError)
  // Operation continues regardless
}
```

## 📊 Database Logging

All messages logged to `whatsapp_messages` table:
- `gym_id`, `phone`, `message`, `message_type`
- `status`, `metadata`, `created_at`

## 🚀 Quick Test

1. Add new staff with phone: `9876543210`
2. Check console: `📱 Sending WhatsApp...`
3. Verify: `✅ WhatsApp sent successfully!`
4. Staff receives welcome message

## 🛠️ Environment Variables

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## ✅ All Complete!

✅ Welcome on Joining  
✅ Salary Payment Confirmation  
✅ Salary Update Notification  
✅ Termination Notice  
✅ Role Change Alert  

**Status**: Production Ready 🎉
