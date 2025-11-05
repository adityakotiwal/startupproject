-- FIXED VERSION - No status column errors!
-- This will work with your existing table structure

-- First, add the status column if it doesn't exist
ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- Add all other missing columns
ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS duration_type TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_members INTEGER,
ADD COLUMN IF NOT EXISTS color_theme TEXT DEFAULT '#3B82F6';

-- Add constraints safely (AFTER columns exist)
ALTER TABLE public.membership_plans 
DROP CONSTRAINT IF EXISTS membership_plans_duration_type_check;

ALTER TABLE public.membership_plans 
ADD CONSTRAINT membership_plans_duration_type_check 
CHECK (duration_type IN ('daily', 'weekly', 'monthly', 'yearly', 'lifetime'));

ALTER TABLE public.membership_plans 
DROP CONSTRAINT IF EXISTS membership_plans_status_check;

ALTER TABLE public.membership_plans 
ADD CONSTRAINT membership_plans_status_check 
CHECK (status IN ('Active', 'Inactive', 'Discontinued'));

-- Create indexes ONLY for columns that exist
CREATE INDEX IF NOT EXISTS idx_membership_plans_gym_id ON public.membership_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_price ON public.membership_plans(price);

-- Create these indexes AFTER we know the columns exist
CREATE INDEX IF NOT EXISTS idx_membership_plans_status ON public.membership_plans(status);
CREATE INDEX IF NOT EXISTS idx_membership_plans_duration_type ON public.membership_plans(duration_type);

-- Verify what we have now
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'membership_plans'
ORDER BY ordinal_position;