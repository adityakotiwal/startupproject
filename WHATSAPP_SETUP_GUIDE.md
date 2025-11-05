# WhatsApp Integration with Twilio - Complete Setup Guide

## Overview
This guide will help you set up WhatsApp messaging for GymSync Pro using Twilio's WhatsApp Business API. You'll be able to send automated messages for:
- Welcome messages to new members
- Membership renewal reminders
- Payment confirmations
- Fee due notifications
- General announcements

## Prerequisites
- A Twilio account (free trial available)
- A phone number capable of receiving WhatsApp messages (for testing)
- Access to your GymSync Pro project

---

## Part 1: Twilio Account Setup

### Step 1: Create a Twilio Account
1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Click **Sign up** and fill in your details
3. Verify your email address
4. Verify your phone number (this will be used for testing)

### Step 2: Get Your Twilio Credentials
After logging in to your Twilio Console:

1. Go to the **Dashboard** at [https://console.twilio.com/](https://console.twilio.com/)
2. You'll see your **Account SID** and **Auth Token**
3. **IMPORTANT**: Copy these values - you'll need them later
   - Account SID: `AC...` (34 characters)
   - Auth Token: Click "Show" to reveal it

### Step 3: Set Up WhatsApp Sandbox (For Testing)
Twilio provides a free sandbox for testing WhatsApp messages.

1. In the Twilio Console, navigate to:
   **Messaging** → **Try it out** → **Send a WhatsApp message**
   
   Or go directly to: [https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)

2. You'll see a **Sandbox phone number** like: `+1 415 523 8886`

3. Follow the instructions to join the sandbox:
   - Open WhatsApp on your phone
   - Send a message to the sandbox number with the code shown (e.g., "join abc-xyz")
   - You'll receive a confirmation message

4. **Copy the sandbox WhatsApp number** (e.g., `whatsapp:+14155238886`)

### Step 4: Production Setup (Optional - For Later)
For production use, you'll need to:
1. Apply for WhatsApp Business API access through Twilio
2. Get your own WhatsApp Business number approved
3. Submit message templates for approval

**For now, we'll use the sandbox for development and testing.**

---

## Part 2: Configure GymSync Pro

### Step 5: Add Environment Variables
1. Open your `.env.local` file in the root of your project
2. Add the following variables:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# For Production (leave empty for now)
# TWILIO_WHATSAPP_NUMBER=whatsapp:+15555555555
```

3. Replace:
   - `your_account_sid_here` with your actual Account SID
   - `your_auth_token_here` with your actual Auth Token
   - The WhatsApp number with your sandbox number (or production number later)

### Step 6: Install Twilio SDK
Run this command in your terminal:

```bash
npm install twilio
```

---

## Part 3: Testing the Integration

### Step 7: Test Sending a Message
After all files are set up, you can test by:

1. **Add a new member** in the Members page with a phone number (in WhatsApp format: `+919876543210`)
2. Make sure your test phone number is joined to the Twilio sandbox
3. You should receive a welcome message on WhatsApp!

### Step 8: Check Message Logs
1. Go to Twilio Console → **Monitor** → **Logs** → **Messaging**
2. You'll see all messages sent, their status, and any errors

---

## Phone Number Format
**IMPORTANT**: All phone numbers must be in E.164 format:
- Format: `+[country code][number]`
- India: `+919876543210`
- US: `+14155551234`
- UK: `+447911123456`

The system will automatically format numbers if they're not in the correct format.

---

## Message Types Supported

### 1. Welcome Message
Sent automatically when a new member joins
```
Welcome to [Gym Name]! 🎉
We're excited to have you join our fitness family.

Your membership details:
- Plan: [Plan Name]
- Start Date: [Date]
- Validity: [Days] days

For any queries, contact us anytime!
```

### 2. Renewal Reminder
Sent before membership expiration
```
Hi [Name],

Your membership at [Gym Name] expires on [Date] (in [X] days).

Please renew to continue enjoying our facilities!

Contact us for assistance.
```

### 3. Payment Confirmation
Sent after successful payment
```
Payment Confirmed! ✅

Amount: ₹[Amount]
Date: [Date]
Receipt: #[ID]

Thank you for your payment!
```

### 4. Fee Due Notification
Sent for pending payments
```
Hi [Name],

You have a pending payment of ₹[Amount] due on [Date].

Please clear your dues to avoid service interruption.
```

---

## Troubleshooting

### Error: "Not a valid phone number"
- Ensure the phone number is in E.164 format: `+[country code][number]`
- Remove spaces, dashes, or parentheses

### Error: "Twilio credentials not found"
- Check your `.env.local` file has the correct variables
- Restart your development server after adding environment variables

### Error: "The sandbox number has not been enabled"
- Make sure you've joined the sandbox by sending the join code via WhatsApp
- Wait a few minutes after joining and try again

### Messages not received
- Check if the recipient's number is joined to the sandbox
- Verify the number format is correct
- Check Twilio Console logs for delivery status

### Sandbox Limitations
- Maximum 3 phone numbers can join the sandbox
- Sandbox resets every 72 hours (you'll need to rejoin)
- Free messages to sandbox numbers

---

## Moving to Production

When you're ready to go live:

1. **Apply for WhatsApp Business API**
   - In Twilio Console: **Messaging** → **WhatsApp** → **Get started**
   - Fill in business details
   - Submit for approval (can take 1-2 weeks)

2. **Get a Dedicated WhatsApp Number**
   - Purchase a Twilio phone number
   - Enable it for WhatsApp

3. **Create Message Templates**
   - All messages must use pre-approved templates
   - Submit templates in Twilio Console
   - Wait for approval (24-48 hours)

4. **Update Environment Variables**
   ```env
   TWILIO_WHATSAPP_NUMBER=whatsapp:+15555555555
   ```

5. **Update Message Templates**
   - Modify `lib/whatsapp-templates.ts` to match approved templates

---

## Cost Estimates (After Sandbox)
- WhatsApp messages: ~$0.005 - $0.025 per message (varies by country)
- India: ~$0.01 per message
- Free trial includes $15 credit

---

## Next Steps
1. Follow Steps 1-6 above to set up your Twilio account
2. Test sending messages using the sandbox
3. Monitor message logs in Twilio Console
4. Plan for production approval when ready

---

## Support Resources
- Twilio WhatsApp Documentation: [https://www.twilio.com/docs/whatsapp](https://www.twilio.com/docs/whatsapp)
- Twilio Support: [https://support.twilio.com](https://support.twilio.com)
- GymSync Pro Support: Check your implementation files

---

## Quick Reference

### Required Environment Variables
```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Twilio Sandbox Join Command
```
join [your-sandbox-code]
```

### Test Phone Number Format
```
+919876543210  ✅ Correct
9876543210     ❌ Wrong
+91 98765 43210 ❌ Wrong
```

---

Happy messaging! 🎉
