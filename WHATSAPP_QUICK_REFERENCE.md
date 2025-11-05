# WhatsApp Integration - Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Get Twilio Credentials
1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up (free trial with $15 credit)
3. Copy your **Account SID** and **Auth Token** from dashboard

### 2. Join WhatsApp Sandbox
1. In Twilio Console, go to: **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see a sandbox number like `+1 415 523 8886`
3. Open WhatsApp on your phone
4. Send the join code (e.g., "join abc-xyz") to that number
5. You'll get a confirmation message

### 3. Add to Environment Variables
Create/edit `.env.local` in your project root:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 4. Restart Server
```bash
# Stop your dev server (Ctrl+C) and restart:
npm run dev
```

### 5. Test It!
Add a new member with a phone number that's joined the sandbox. You should receive a welcome message on WhatsApp! 🎉

---

## 📱 Phone Number Format

**Always use E.164 format:** `+[country code][number]`

✅ **Correct:**
- India: `+919876543210`
- US: `+14155551234`
- UK: `+447911123456`

❌ **Wrong:**
- `9876543210` (missing country code)
- `+91 98765 43210` (has spaces)
- `+91-9876543210` (has dash)

---

## 🔧 Available Functions

### Send Welcome Message
```typescript
import { sendWelcomeWhatsApp } from '@/lib/whatsapp-helpers'

await sendWelcomeWhatsApp({
  memberName: 'John Doe',
  memberPhone: '+919876543210',
  gymName: 'FitZone Gym',
  membershipPlan: '3 Month Plan',
  startDate: '1 January 2024',
  validityDays: 90,
  memberId: 'uuid-here'
})
```

### Send Renewal Reminder
```typescript
import { sendRenewalReminderWhatsApp } from '@/lib/whatsapp-helpers'

await sendRenewalReminderWhatsApp({
  memberName: 'John Doe',
  memberPhone: '+919876543210',
  gymName: 'FitZone Gym',
  membershipPlan: '3 Month Plan',
  expiryDate: '31 March 2024',
  daysRemaining: 7,
  memberId: 'uuid-here'
})
```

### Send Payment Confirmation
```typescript
import { sendPaymentConfirmationWhatsApp } from '@/lib/whatsapp-helpers'

await sendPaymentConfirmationWhatsApp({
  memberName: 'John Doe',
  memberPhone: '+919876543210',
  amount: 5000,
  currency: '₹',
  paymentDate: '15 January 2024',
  receiptNumber: 'RCP-001',
  paymentMethod: 'Cash',
  memberId: 'uuid-here',
  paymentId: 'payment-uuid'
})
```

### Send Fee Due Notification
```typescript
import { sendFeeDueWhatsApp } from '@/lib/whatsapp-helpers'

await sendFeeDueWhatsApp({
  memberName: 'John Doe',
  memberPhone: '+919876543210',
  gymName: 'FitZone Gym',
  dueAmount: 2500,
  currency: '₹',
  dueDate: '30 January 2024',
  memberId: 'uuid-here'
})
```

### Send Bulk Messages
```typescript
import { sendBulkWhatsApp } from '@/lib/whatsapp-helpers'

await sendBulkWhatsApp({
  recipients: [
    { phone: '+919876543210', name: 'John Doe' },
    { phone: '+919876543211', name: 'Jane Smith' }
  ],
  message: 'Gym closed tomorrow for maintenance. Sorry for the inconvenience!',
  messageType: 'announcement'
})
```

---

## 📊 Database Table

All messages are logged in `whatsapp_messages` table:

```sql
SELECT * FROM whatsapp_messages 
WHERE gym_id = 'your-gym-id' 
ORDER BY sent_at DESC 
LIMIT 10;
```

Fields:
- `recipient_phone` - Phone number
- `message_content` - Message text
- `message_type` - welcome, renewal, payment, fee_due, etc.
- `status` - sent, delivered, failed
- `twilio_sid` - Twilio message ID for tracking

---

## 🎨 Message Templates

All templates are in: `src/lib/whatsapp-templates.ts`

Available templates:
- ✅ Welcome Message
- 🔔 Renewal Reminder
- 💳 Payment Confirmation
- ⚠️ Fee Due Notification
- 🏋️ Class Reminder
- 📢 Announcements
- ⬆️ Membership Upgrade
- ❄️ Membership Freeze
- 🎂 Birthday Wishes
- 🚨 Emergency Closure

You can customize any template by editing the file!

---

## 🐛 Troubleshooting

### "Cannot find module 'twilio'"
**Solution:** Run `npm install twilio` and restart server

### "Not a valid phone number"
**Solution:** Use E.164 format: `+919876543210`

### "Twilio credentials not found"
**Solution:** Check `.env.local` has correct variables and restart server

### "The sandbox number has not been enabled"
**Solution:** Make sure recipient has joined the sandbox by sending the join code

### Messages not received
**Solution:** 
1. Check recipient joined sandbox
2. Verify phone number format
3. Check Twilio Console logs: https://console.twilio.com/monitor/logs/messaging

---

## 💰 Sandbox Limitations

- ✅ Free for testing
- ✅ Up to 3 test phone numbers
- ⚠️ Sandbox resets every 72 hours (need to rejoin)
- ⚠️ Only for development/testing

---

## 🚀 Going to Production

See `WHATSAPP_SETUP_GUIDE.md` for detailed instructions on:
1. Applying for WhatsApp Business API
2. Getting a dedicated WhatsApp number
3. Submitting message templates for approval
4. Updating production environment variables

**Estimated Time:** 1-2 weeks for approval  
**Cost:** ~₹0.75 per message in India

---

## 📚 Documentation

- **Setup Guide:** `WHATSAPP_SETUP_GUIDE.md` (detailed step-by-step)
- **Templates:** `src/lib/whatsapp-templates.ts`
- **Helper Functions:** `src/lib/whatsapp-helpers.ts`
- **API Route:** `src/app/api/whatsapp/send/route.ts`
- **Twilio Client:** `src/lib/twilio.ts`

---

## ✅ Currently Integrated

The following features automatically send WhatsApp messages:

1. **✅ Welcome Message** - When adding a new member
2. **🔜 Payment Confirmation** - When recording a payment (coming soon)
3. **🔜 Renewal Reminders** - Automated (coming soon)

---

## 🎯 Next Steps

To add WhatsApp to more features:

1. **Payment Recording:**
   - Open `src/components/RecordPaymentModal.tsx`
   - Add `sendPaymentConfirmationWhatsApp()` after successful payment

2. **Automated Renewal Reminders:**
   - Create a cron job or scheduled function
   - Query members expiring in 7 days
   - Send renewal reminders

3. **Bulk Announcements:**
   - Create a new page for announcements
   - Use `sendBulkWhatsApp()` function

---

## 🆘 Need Help?

1. Read `WHATSAPP_SETUP_GUIDE.md` for detailed setup
2. Check Twilio Console logs for delivery status
3. Test with your own phone number first
4. Ensure phone numbers are in correct format

---

**Happy Messaging! 🎉**
