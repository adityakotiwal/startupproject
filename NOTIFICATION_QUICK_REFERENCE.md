# 🔔 Notification System - Quick Reference

## 📋 At a Glance

### Notification Types
| Type | Icon | Priority | WhatsApp Action |
|------|------|----------|-----------------|
| 🎂 Birthday Today | Gift | Medium | Send Birthday Wish |
| ⏰ Expiry Soon (7d) | Clock | Medium | Send Renewal Reminder |
| 🚨 Expired | Alert | High | Send Urgent Renewal |
| 💰 Installment Due | Card | High/Med | Send Payment Reminder |
| 👤 New Member | User | Low | No action (auto-sent) |

### Priority Colors
- 🔴 **High** - Red background, urgent action needed
- 🟠 **Medium** - Orange background, important
- 🔵 **Low** - Blue background, informational

---

## ⚡ Quick Actions

### Open Notifications
```
Click bell icon in top-right corner
Badge shows total count (9+ if more than 9)
```

### Send WhatsApp
```
1. Find notification
2. Click "Send WhatsApp" button
3. Wait for confirmation
```

### Refresh
```
Auto: Every 5 minutes
Manual: Click "Refresh Notifications" at bottom
On Open: Auto-refreshes when panel opens
```

---

## 🎯 Daily Workflow

### Morning Checklist
1. ✅ Open notification panel
2. ✅ Check high-priority items first
3. ✅ Send birthday wishes for today
4. ✅ Follow up on expired memberships
5. ✅ Review expiring soon notifications

### Throughout Day
1. ✅ Monitor badge for new notifications
2. ✅ Address installment dues
3. ✅ Welcome new members in person
4. ✅ Process walk-in renewals

### Before Closing
1. ✅ Review pending actions
2. ✅ Send remaining reminders
3. ✅ Plan tomorrow's follow-ups

---

## 📱 WhatsApp Message Types

### 🎂 Birthday Wish
```
🎉 Happy Birthday [Name]! 🎂
Wishing you a fantastic day...
```

### ⏰ Renewal Reminder
```
Dear [Name],
Your [Plan] expires on [Date].
You have [X] days remaining...
```

### 💰 Payment Reminder
```
Dear [Name],
Your installment of ₹[Amount]
is due on [Date]...
```

---

## 🔧 Troubleshooting

### No notifications?
- Check if you have active members
- Verify member dates are set
- Refresh manually

### WhatsApp not sending?
- Verify Twilio setup
- Check phone number format
- Ensure member joined sandbox

### Badge not updating?
- Wait for auto-refresh (5 min)
- Close and reopen panel
- Check network connection

---

## 💡 Pro Tips

1. **Prioritize High First** - Always handle urgent items immediately
2. **Personal Touch** - Members appreciate birthday wishes
3. **Timely Reminders** - Send renewal reminders during peak hours
4. **Track Responses** - Follow up on WhatsApp messages
5. **Consistent Check** - Review notifications 2-3 times daily

---

## 📊 Success Metrics

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Renewal Rate | 85%+ | Send 7-day reminders |
| Payment Rate | 90%+ | Follow up on dues |
| Birthday Wishes | 100% | Check daily |
| Response Time | <24h | Check frequently |

---

## 🎓 Quick Scenarios

### Member Walks In
```
1. Check notification for their name
2. See "Expires in 3 days"
3. Discuss renewal immediately
4. Process on the spot
```

### Morning Routine
```
1. Open panel (see 5 notifications)
2. Send 2 birthday wishes
3. Follow up 1 expired membership
4. Note 2 expiring soon
```

### Payment Collection
```
1. Filter high-priority (overdue)
2. Send WhatsApp to all
3. Track responses
4. Update when paid
```

---

## ⚙️ Detection Timing

| Type | Detection Rule |
|------|----------------|
| Expiry Soon | 7 days before end_date |
| Expired | After end_date |
| Birthday | Today + 3 days advance |
| Installment Due | 3 days before + overdue |
| New Member | Last 24 hours |

---

## 📞 Need Help?

1. ✅ Read [Full Guide](./NOTIFICATION_SYSTEM_GUIDE.md)
2. ✅ Check [WhatsApp Setup](./WHATSAPP_SETUP_GUIDE.md)
3. ✅ Review browser console
4. ✅ Verify Supabase data

---

**Remember: Consistent use = Better member relationships = Higher retention!**

---

*Quick Reference Card - Print or bookmark this page*
