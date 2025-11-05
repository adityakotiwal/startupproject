# 🚀 GymSync Pro - Vercel Deployment Guide

## Prerequisites
- GitHub account with your repository
- Vercel account (sign up at https://vercel.com)
- Supabase project with database setup complete

---

## 📋 Step 1: Prepare Your Supabase Database

Before deploying, ensure your Supabase database is properly set up:

### 1.1 Run Database Migrations
Execute these SQL files in your Supabase SQL Editor (in order):

```sql
-- 1. Core tables
SETUP_DATABASE.sql

-- 2. Row Level Security
sql/rls_policies.sql

-- 3. Storage buckets (for member/staff photos)
create_storage_buckets.sql

-- 4. Additional features
create_membership_plans_table.sql
create_equipment_table.sql
create_staff_salary_payments.sql
create_class_schedules_table.sql
CREATE_PAYMENTS_TABLE.sql
create_whatsapp_messages_table.sql
```

### 1.2 Enable Required Extensions
In Supabase SQL Editor:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1.3 Set Up Storage Buckets
Go to Supabase Dashboard > Storage and create these buckets:
- `member-photos` (Public bucket)
- `staff-photos` (Public bucket)

---

## 🔧 Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository

1. Go to https://vercel.com/new
2. Click **"Import Project"**
3. Select **"Import Git Repository"**
4. Find and select your `gymsync-pro` repository
5. Click **"Import"**

### 2.2 Configure Project Settings

**Framework Preset:** Next.js (Auto-detected)
**Root Directory:** `./` (leave as default)
**Build Command:** `npm run build` (default)
**Output Directory:** `.next` (default)
**Install Command:** `npm install` (default)

### 2.3 Add Environment Variables

Click **"Environment Variables"** and add these:

#### Required Variables:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: your-project-url.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: your-supabase-anon-key
```

**Where to find these:**
1. Go to your Supabase Dashboard
2. Click on your project
3. Go to **Settings** > **API**
4. Copy **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
5. Copy **Project API keys** > **anon/public** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Optional (for WhatsApp features):
```
Name: TWILIO_ACCOUNT_SID
Value: your-twilio-account-sid

Name: TWILIO_AUTH_TOKEN
Value: your-twilio-auth-token

Name: TWILIO_WHATSAPP_NUMBER
Value: whatsapp:+14155238886
```

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for the build to complete
3. Your app will be live at: `https://your-app-name.vercel.app`

---

## ✅ Step 3: Post-Deployment Configuration

### 3.1 Update Supabase Site URL
In your Supabase Dashboard:
1. Go to **Settings** > **Authentication**
2. Under **Site URL**, add your Vercel domain:
   ```
   https://your-app-name.vercel.app
   ```

### 3.2 Add Redirect URLs
Under **Redirect URLs**, add:
```
https://your-app-name.vercel.app/auth/callback
https://your-app-name.vercel.app/auth/verify-email
https://your-app-name.vercel.app/**
```

### 3.3 Test Your Deployment

1. Visit your deployed app: `https://your-app-name.vercel.app`
2. Test signup: Create a new account
3. Check email verification
4. Test login
5. Create a gym setup
6. Test core features:
   - Add members
   - Record payments
   - Add staff
   - Track equipment
   - View analytics

---

## 🔄 Step 4: Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically:
- Detect the push
- Build your app
- Deploy to production
- Update your live site

---

## 🎨 Step 5: Custom Domain (Optional)

### Add Your Own Domain:

1. In Vercel Dashboard, go to your project
2. Click **"Settings"** > **"Domains"**
3. Click **"Add"**
4. Enter your domain (e.g., `gymsync.yourdomain.com`)
5. Follow DNS configuration instructions
6. Update Supabase Site URL to your custom domain

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript has no errors locally: `npx tsc --noEmit`

### Authentication Not Working
- Verify Supabase URL and Anon Key are correct
- Check Site URL and Redirect URLs in Supabase
- Clear browser cache and cookies

### Database Errors
- Ensure all SQL migrations are run
- Check RLS policies are enabled
- Verify user has proper permissions

### Images Not Loading
- Check Supabase storage buckets are created
- Verify bucket policies allow public access
- Update `next.config.mjs` image domains

### API Routes Failing
- Check environment variables are set in Vercel
- Verify Twilio credentials (if using WhatsApp)
- Check API route logs in Vercel dashboard

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Free)
1. Go to your project in Vercel
2. Click **"Analytics"** tab
3. Enable Web Analytics

### Performance Monitoring
- Check **"Speed Insights"** in Vercel
- Monitor Core Web Vitals
- Optimize based on recommendations

---

## 🔒 Security Best Practices

1. **Never commit `.env.local` file**
   - Already in `.gitignore`
   
2. **Use Environment Variables in Vercel**
   - All secrets should be in Vercel Environment Variables
   - Never hardcode credentials

3. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

4. **Enable Supabase RLS**
   - All tables should have Row Level Security enabled
   - Test policies thoroughly

---

## 🎯 Production Checklist

Before going live:

- [ ] All database migrations executed
- [ ] RLS policies enabled on all tables
- [ ] Storage buckets created and configured
- [ ] Environment variables set in Vercel
- [ ] Supabase Site URL and Redirect URLs configured
- [ ] Test signup and login flow
- [ ] Test all major features
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled
- [ ] Error monitoring set up
- [ ] Backup strategy in place

---

## 🆘 Support & Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Supabase Documentation:** https://supabase.com/docs
- **GitHub Repository:** https://github.com/adityakotiwal/gymsync-pro

---

## 🎉 Success!

Your GymSync Pro application is now live and ready to use!

**Next Steps:**
1. Share the URL with your team
2. Create your first gym
3. Add members and staff
4. Start managing your gym operations

**Your App URL:** `https://your-app-name.vercel.app`

---

*Last Updated: November 5, 2025*
