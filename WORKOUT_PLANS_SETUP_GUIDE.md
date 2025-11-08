# 🏋️ Workout Plan Builder - Setup Guide

## 📋 Overview
This guide will help you set up the complete Workout Plan Builder feature in your GymSync Pro SaaS platform.

## 🎯 Features Included

### ✅ Core Functionality
- **Workout Plan Templates**: Create reusable workout plan templates
- **Exercise Library**: Pre-populated with 35+ common exercises
- **Member Assignment**: Assign and customize plans for individual members
- **Progress Tracking**: Log workouts and track member progress
- **Analytics Dashboard**: View engagement, completion rates, and popular plans
- **Export Capabilities**: PDF and CSV export for plans and progress data

### ✅ Advanced Features
- **Drag-and-Drop Exercise Ordering**: Reorder exercises easily
- **Difficulty Levels**: Beginner, Intermediate, Advanced
- **Categories**: Strength, Cardio, Hypertrophy, Fat Loss, Endurance, etc.
- **Custom Tags**: Tag plans for better organization
- **Performance Metrics**: Track sets, reps, weight, duration
- **Difficulty & Energy Rating**: Member self-assessment (1-5 scale)
- **Multi-day Programs**: Create 1-12 week programs
- **Completion Tracking**: Real-time progress percentage

## 🚀 Setup Instructions

### Step 1: Run SQL Schema

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your GymSync Pro project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the Schema File**
   - Open `create_workout_plans_tables.sql`
   - Copy ALL contents
   - Paste into Supabase SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify Tables Created**
   Run this query to confirm:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE '%workout%';
   ```
   
   You should see:
   - `workout_plan_templates`
   - `workout_exercises`
   - `member_workout_plans`
   - `member_workout_exercises`
   - `workout_logs`
   - `exercise_library`

5. **Verify Exercise Library Populated**
   ```sql
   SELECT COUNT(*) FROM exercise_library;
   ```
   Should return: **35 exercises**

### Step 2: Update Sidebar Navigation

Add Workout Plans link to your sidebar component:

**File**: `src/components/Sidebar.tsx` or wherever your navigation is

```tsx
<Link 
  href="/workout-plans" 
  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100"
>
  <Dumbbell className="h-5 w-5" />
  <span>Workout Plans</span>
</Link>
```

### Step 3: Test the Feature

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Workout Plans**
   - Go to http://localhost:3000/workout-plans
   - You should see the beautiful workout plans page

3. **Click "Create Workout Plan"** (coming next)

## 📊 Database Schema Overview

### Tables Created

#### 1. `workout_plan_templates`
Main workout plan templates that can be reused
- `id`, `gym_id`, `name`, `description`
- `duration_weeks`, `difficulty_level`, `category`
- `tags[]`, `is_active`, `times_assigned`

#### 2. `workout_exercises`
Individual exercises within each template
- `template_id`, `day_number`, `exercise_name`
- `sets`, `reps`, `duration_minutes`, `rest_seconds`
- `target_muscle_group`, `instructions`, `video_url`

#### 3. `member_workout_plans`
Workout plans assigned to specific members
- `member_id`, `template_id`, `plan_name`
- `start_date`, `end_date`, `status`
- `completion_percentage`, `total_workouts`, `completed_workouts`

#### 4. `member_workout_exercises`
Customized exercises for each member's plan
- Copy of template exercises but can be modified per member
- Tracks `is_completed` status

#### 5. `workout_logs`
Performance tracking and progress logs
- `workout_date`, `sets_completed`, `reps_completed`
- `weight_used`, `difficulty_rating`, `energy_level`
- `performance_notes`

#### 6. `exercise_library`
Pre-built exercise database (35+ exercises included!)
- Chest, Back, Legs, Shoulders, Arms, Core, Cardio
- Equipment needed, difficulty, instructions
- Optional video_url for tutorials

## 🔐 Security

All tables have Row Level Security (RLS) enabled:
- Users can only access their gym's data
- Policies based on `gym_staff` table membership
- Exercise library is public read (everyone can view)

## 📈 Analytics Metrics

The system tracks:
- **Total Templates**: Number of workout plans created
- **Active Assignments**: Members currently on a plan
- **Completion Rate**: Average % completion across all plans
- **Engagement Rate**: % of assigned plans that are active
- **Popular Templates**: Most frequently assigned plans
- **Recent Activity**: Latest workout logs

## 🎨 UI Features

### Workout Plans Page
- ✅ Beautiful gradient cards
- ✅ Search and advanced filtering
- ✅ Difficulty badges (Beginner/Intermediate/Advanced)
- ✅ Category tags
- ✅ Assignment counter
- ✅ Animated hover effects
- ✅ Responsive grid layout

### Coming Next
- [ ] Create/Edit Workout Plan Modal (with exercise builder)
- [ ] Workout Plan Details View
- [ ] Member Assignment Interface
- [ ] Progress Tracking Dashboard
- [ ] PDF/CSV Export
- [ ] WhatsApp Notifications

## 💡 Usage Examples

### Example 1: Create "Beginner Full Body" Plan
1. Click "Create Workout Plan"
2. Name: "Beginner Full Body"
3. Duration: 4 weeks
4. Difficulty: Beginner
5. Category: Strength
6. Add exercises from library (Push-ups, Squats, etc.)
7. Set sets/reps (3x12, 3x10)
8. Save template

### Example 2: Assign to Member
1. Go to Members page
2. Click on a member
3. Go to "Workout Plans" tab
4. Select "Beginner Full Body" template
5. Customize if needed
6. Set start date
7. Assign!

### Example 3: Log Progress
1. Open member's workout plan
2. Click "Log Workout"
3. Select day/exercise
4. Enter sets completed, weight used
5. Rate difficulty (1-5)
6. Add notes ("Felt strong today!")
7. Save log

## 🔧 Troubleshooting

### Tables Not Created?
- Check for SQL syntax errors in Supabase logs
- Ensure `gyms` and `members` tables exist (required foreign keys)
- Verify `auth.users` table exists

### RLS Blocking Access?
- Ensure user is in `gym_staff` table with correct `gym_id`
- Check auth token is valid
- Review RLS policies in Supabase dashboard

### Exercises Not Showing?
- Verify exercise_library table populated
- Check RLS policy allows SELECT (should be public)
- Run: `SELECT COUNT(*) FROM exercise_library`

## 🎯 Next Steps

1. **Run the SQL schema** (Step 1 above)
2. **Test the Workout Plans page** works
3. **Continue with next modals**:
   - Create Workout Plan Builder Modal
   - Member Assignment Modal
   - Progress Tracking Interface
4. **Integrate with Member Details**
5. **Add PDF Export**
6. **Set up notifications**

## 📞 Support

If you encounter any issues:
1. Check Supabase logs for errors
2. Verify all dependencies installed: `npm install`
3. Ensure React Query provider wraps app
4. Check browser console for errors

---

**Status**: ✅ Database Schema Complete | 🔄 UI Implementation In Progress

**Last Updated**: November 8, 2025
