-- ==========================================
-- 🏋️ WORKOUT PLAN BUILDER - DATABASE SCHEMA
-- ==========================================
-- This schema creates tables for workout plan management
-- with comprehensive tracking and analytics capabilities

-- ==========================================
-- 1️⃣ WORKOUT PLAN TEMPLATES TABLE
-- ==========================================
-- Stores reusable workout plan templates created by gym owners
CREATE TABLE IF NOT EXISTS workout_plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
  category VARCHAR(100), -- Strength, Cardio, Hypertrophy, Fat Loss, Endurance, etc.
  tags TEXT[], -- Array of tags for filtering
  is_active BOOLEAN DEFAULT true,
  times_assigned INTEGER DEFAULT 0, -- Track popularity
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 2️⃣ WORKOUT EXERCISES TABLE
-- ==========================================
-- Stores individual exercises within each workout plan template
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES workout_plan_templates(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL, -- Which day of the week (1-7)
  exercise_name VARCHAR(255) NOT NULL,
  exercise_type VARCHAR(100), -- Strength, Cardio, Flexibility, etc.
  target_muscle_group VARCHAR(100), -- Chest, Back, Legs, Arms, Core, etc.
  sets INTEGER,
  reps VARCHAR(50), -- Can be "8-12" or "15" or "AMRAP"
  duration_minutes INTEGER, -- For cardio/timed exercises
  rest_seconds INTEGER, -- Rest time between sets
  weight_recommendation VARCHAR(100), -- "Bodyweight", "50% 1RM", "20kg", etc.
  instructions TEXT, -- Detailed instructions
  video_url TEXT, -- Optional video tutorial link
  order_index INTEGER DEFAULT 0, -- For ordering exercises in a day
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3️⃣ MEMBER WORKOUT PLANS TABLE
-- ==========================================
-- Tracks workout plans assigned to specific members
CREATE TABLE IF NOT EXISTS member_workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_plan_templates(id) ON DELETE SET NULL,
  plan_name VARCHAR(255) NOT NULL, -- Copy of template name (in case template is deleted)
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- Optional end date
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Paused', 'Cancelled')),
  completion_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
  total_workouts INTEGER DEFAULT 0, -- Total planned workouts
  completed_workouts INTEGER DEFAULT 0, -- Workouts completed
  notes TEXT, -- Custom notes for this member
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4️⃣ MEMBER WORKOUT EXERCISES TABLE
-- ==========================================
-- Stores customized exercises for each member's assigned plan
-- (copied from template but can be modified per member)
CREATE TABLE IF NOT EXISTS member_workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_plan_id UUID NOT NULL REFERENCES member_workout_plans(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  exercise_type VARCHAR(100),
  target_muscle_group VARCHAR(100),
  sets INTEGER,
  reps VARCHAR(50),
  duration_minutes INTEGER,
  rest_seconds INTEGER,
  weight_recommendation VARCHAR(100),
  instructions TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false, -- Track if exercise was done
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5️⃣ WORKOUT LOGS TABLE
-- ==========================================
-- Tracks actual workout performance and progress
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_plan_id UUID REFERENCES member_workout_plans(id) ON DELETE CASCADE,
  member_exercise_id UUID REFERENCES member_workout_exercises(id) ON DELETE CASCADE,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  day_number INTEGER, -- Which day this was
  exercise_name VARCHAR(255) NOT NULL,
  sets_completed INTEGER,
  reps_completed VARCHAR(50), -- Actual reps done
  weight_used VARCHAR(100), -- Actual weight used
  duration_minutes INTEGER, -- For cardio
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5), -- 1=Too Easy, 5=Too Hard
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5), -- Self-reported energy
  performance_notes TEXT, -- "Struggled on last set", "Felt strong today"
  logged_by UUID REFERENCES auth.users(id), -- Who logged it (owner or staff)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6️⃣ EXERCISE LIBRARY TABLE (OPTIONAL)
-- ==========================================
-- Pre-built exercise database for quick selection
CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100), -- Strength, Cardio, Flexibility, etc.
  muscle_group VARCHAR(100), -- Primary muscle targeted
  equipment_needed TEXT[], -- Array: ['Barbell', 'Bench']
  difficulty VARCHAR(50) CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  description TEXT,
  instructions TEXT,
  video_url TEXT,
  image_url TEXT,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 📊 INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_workout_templates_gym ON workout_plan_templates(gym_id);
CREATE INDEX idx_workout_templates_active ON workout_plan_templates(gym_id, is_active);
CREATE INDEX idx_workout_exercises_template ON workout_exercises(template_id);
CREATE INDEX idx_workout_exercises_gym ON workout_exercises(gym_id);
CREATE INDEX idx_member_plans_gym ON member_workout_plans(gym_id);
CREATE INDEX idx_member_plans_member ON member_workout_plans(member_id);
CREATE INDEX idx_member_plans_status ON member_workout_plans(gym_id, status);
CREATE INDEX idx_member_exercises_plan ON member_workout_exercises(member_plan_id);
CREATE INDEX idx_workout_logs_member ON workout_logs(member_id);
CREATE INDEX idx_workout_logs_date ON workout_logs(gym_id, workout_date);
CREATE INDEX idx_exercise_library_category ON exercise_library(category);
CREATE INDEX idx_exercise_library_muscle ON exercise_library(muscle_group);

-- ==========================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE workout_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_plan_templates
CREATE POLICY "Users can view their gym's workout templates"
  ON workout_plan_templates FOR SELECT
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create workout templates for their gym"
  ON workout_plan_templates FOR INSERT
  WITH CHECK (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update their gym's workout templates"
  ON workout_plan_templates FOR UPDATE
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete their gym's workout templates"
  ON workout_plan_templates FOR DELETE
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

-- RLS Policies for workout_exercises
CREATE POLICY "Users can view their gym's workout exercises"
  ON workout_exercises FOR SELECT
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create workout exercises for their gym"
  ON workout_exercises FOR INSERT
  WITH CHECK (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update their gym's workout exercises"
  ON workout_exercises FOR UPDATE
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete their gym's workout exercises"
  ON workout_exercises FOR DELETE
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

-- RLS Policies for member_workout_plans
CREATE POLICY "Users can view their gym's member workout plans"
  ON member_workout_plans FOR SELECT
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create member workout plans for their gym"
  ON member_workout_plans FOR INSERT
  WITH CHECK (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update their gym's member workout plans"
  ON member_workout_plans FOR UPDATE
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete their gym's member workout plans"
  ON member_workout_plans FOR DELETE
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

-- RLS Policies for member_workout_exercises
CREATE POLICY "Users can view their gym's member workout exercises"
  ON member_workout_exercises FOR SELECT
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create member workout exercises for their gym"
  ON member_workout_exercises FOR INSERT
  WITH CHECK (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update their gym's member workout exercises"
  ON member_workout_exercises FOR UPDATE
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete their gym's member workout exercises"
  ON member_workout_exercises FOR DELETE
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

-- RLS Policies for workout_logs
CREATE POLICY "Users can view their gym's workout logs"
  ON workout_logs FOR SELECT
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create workout logs for their gym"
  ON workout_logs FOR INSERT
  WITH CHECK (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update their gym's workout logs"
  ON workout_logs FOR UPDATE
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete their gym's workout logs"
  ON workout_logs FOR DELETE
  USING (gym_id IN (SELECT id FROM gyms WHERE owner_id = auth.uid()));

-- RLS Policies for exercise_library (public read, admin write)
CREATE POLICY "Everyone can view exercise library"
  ON exercise_library FOR SELECT
  USING (true);

-- ==========================================
-- 🎯 SEED DATA - EXERCISE LIBRARY
-- ==========================================
-- Pre-populate with common exercises

INSERT INTO exercise_library (name, category, muscle_group, equipment_needed, difficulty, description, is_popular) VALUES
-- Chest Exercises
('Barbell Bench Press', 'Strength', 'Chest', ARRAY['Barbell', 'Bench'], 'Intermediate', 'Classic compound chest exercise', true),
('Dumbbell Chest Press', 'Strength', 'Chest', ARRAY['Dumbbells', 'Bench'], 'Beginner', 'Great for building chest strength', true),
('Push-ups', 'Strength', 'Chest', ARRAY['Bodyweight'], 'Beginner', 'Fundamental bodyweight chest exercise', true),
('Cable Chest Fly', 'Strength', 'Chest', ARRAY['Cable Machine'], 'Intermediate', 'Excellent chest isolation', false),
('Incline Dumbbell Press', 'Strength', 'Chest', ARRAY['Dumbbells', 'Incline Bench'], 'Intermediate', 'Targets upper chest', true),

-- Back Exercises
('Pull-ups', 'Strength', 'Back', ARRAY['Pull-up Bar'], 'Advanced', 'King of back exercises', true),
('Barbell Row', 'Strength', 'Back', ARRAY['Barbell'], 'Intermediate', 'Builds thick back muscles', true),
('Lat Pulldown', 'Strength', 'Back', ARRAY['Cable Machine'], 'Beginner', 'Great pull-up alternative', true),
('Dumbbell Row', 'Strength', 'Back', ARRAY['Dumbbells', 'Bench'], 'Beginner', 'Unilateral back builder', true),
('Deadlift', 'Strength', 'Back', ARRAY['Barbell'], 'Advanced', 'Full body compound movement', true),

-- Leg Exercises
('Barbell Squat', 'Strength', 'Legs', ARRAY['Barbell', 'Squat Rack'], 'Intermediate', 'King of leg exercises', true),
('Leg Press', 'Strength', 'Legs', ARRAY['Leg Press Machine'], 'Beginner', 'Safe quad builder', true),
('Romanian Deadlift', 'Strength', 'Legs', ARRAY['Barbell'], 'Intermediate', 'Hamstring and glute focus', true),
('Leg Extension', 'Strength', 'Legs', ARRAY['Leg Extension Machine'], 'Beginner', 'Quad isolation', false),
('Leg Curl', 'Strength', 'Legs', ARRAY['Leg Curl Machine'], 'Beginner', 'Hamstring isolation', false),
('Walking Lunges', 'Strength', 'Legs', ARRAY['Dumbbells'], 'Beginner', 'Functional leg exercise', true),

-- Shoulder Exercises
('Overhead Press', 'Strength', 'Shoulders', ARRAY['Barbell'], 'Intermediate', 'Builds strong shoulders', true),
('Dumbbell Shoulder Press', 'Strength', 'Shoulders', ARRAY['Dumbbells'], 'Beginner', 'Shoulder mass builder', true),
('Lateral Raises', 'Strength', 'Shoulders', ARRAY['Dumbbells'], 'Beginner', 'Side delt isolation', true),
('Front Raises', 'Strength', 'Shoulders', ARRAY['Dumbbells'], 'Beginner', 'Front delt focus', false),
('Face Pulls', 'Strength', 'Shoulders', ARRAY['Cable Machine'], 'Beginner', 'Rear delt and posture', true),

-- Arm Exercises
('Barbell Curl', 'Strength', 'Arms', ARRAY['Barbell'], 'Beginner', 'Classic bicep builder', true),
('Dumbbell Curl', 'Strength', 'Arms', ARRAY['Dumbbells'], 'Beginner', 'Bicep development', true),
('Tricep Dips', 'Strength', 'Arms', ARRAY['Dip Bar'], 'Intermediate', 'Compound tricep exercise', true),
('Tricep Pushdown', 'Strength', 'Arms', ARRAY['Cable Machine'], 'Beginner', 'Tricep isolation', true),
('Hammer Curls', 'Strength', 'Arms', ARRAY['Dumbbells'], 'Beginner', 'Brachialis focus', false),

-- Core Exercises
('Plank', 'Core', 'Core', ARRAY['Bodyweight'], 'Beginner', 'Isometric core strength', true),
('Crunches', 'Core', 'Core', ARRAY['Bodyweight'], 'Beginner', 'Basic ab exercise', false),
('Russian Twists', 'Core', 'Core', ARRAY['Medicine Ball'], 'Intermediate', 'Oblique focus', true),
('Hanging Leg Raises', 'Core', 'Core', ARRAY['Pull-up Bar'], 'Advanced', 'Advanced ab exercise', true),
('Cable Crunches', 'Core', 'Core', ARRAY['Cable Machine'], 'Beginner', 'Weighted ab work', false),

-- Cardio Exercises
('Treadmill Running', 'Cardio', 'Full Body', ARRAY['Treadmill'], 'Beginner', 'Classic cardio', true),
('Cycling', 'Cardio', 'Legs', ARRAY['Stationary Bike'], 'Beginner', 'Low impact cardio', true),
('Rowing', 'Cardio', 'Full Body', ARRAY['Rowing Machine'], 'Intermediate', 'Full body cardio', true),
('Jump Rope', 'Cardio', 'Full Body', ARRAY['Jump Rope'], 'Beginner', 'High intensity cardio', true),
('Stair Climber', 'Cardio', 'Legs', ARRAY['Stair Climber'], 'Intermediate', 'Leg endurance', false);

-- ==========================================
-- ✅ SCHEMA CREATION COMPLETE
-- ==========================================
-- Run this file in your Supabase SQL Editor
-- Then proceed to build the frontend components
