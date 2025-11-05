# 🚀 Quick Deployment Checklist

## Before Deploying to Vercel

### ✅ Step 1: Supabase Setup
- [ ] Run all SQL migrations in Supabase SQL Editor
- [ ] Enable RLS on all tables
- [ ] Create storage buckets: `member-photos`, `staff-photos`
- [ ] Set bucket policies to public

### ✅ Step 2: Deploy to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository: `gymsync-pro`
3. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase Anon Key
   - (Optional) `TWILIO_ACCOUNT_SID` = For WhatsApp
   - (Optional) `TWILIO_AUTH_TOKEN` = For WhatsApp
   - (Optional) `TWILIO_WHATSAPP_NUMBER` = For WhatsApp
4. Click **Deploy**

### ✅ Step 3: Post-Deployment
- [ ] Copy your Vercel URL (e.g., `https://your-app.vercel.app`)
- [ ] Update Supabase **Site URL** with your Vercel URL
- [ ] Add Redirect URLs in Supabase:
  - `https://your-app.vercel.app/**`
  - `https://your-app.vercel.app/auth/callback`
- [ ] Test signup and login
- [ ] Create first gym
- [ ] Test all features

## 📚 Full Documentation
See **VERCEL_DEPLOYMENT_GUIDE.md** for detailed instructions

## 🆘 Need Help?
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Repo: https://github.com/adityakotiwal/gymsync-pro
