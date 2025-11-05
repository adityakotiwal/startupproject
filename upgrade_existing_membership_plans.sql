-- SAFE TABLE MODIFICATION - Keeps your existing 16 records!
-- Run this to upgrade your membership_plans table to work with the new system

-- First, let's see what columns you currently have
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'membership_plans'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist (safe operation)
ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 1;

ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS duration_type TEXT DEFAULT 'monthly';

ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';

ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS max_members INTEGER;

ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS color_theme TEXT DEFAULT '#3B82F6';

-- Add constraints (safe - won't affect existing data)
DO $$
BEGIN
    -- Add duration_type constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'membership_plans' 
        AND constraint_name = 'membership_plans_duration_type_check'
    ) THEN
        ALTER TABLE public.membership_plans 
        ADD CONSTRAINT membership_plans_duration_type_check 
        CHECK (duration_type IN ('daily', 'weekly', 'monthly', 'yearly', 'lifetime'));
    END IF;
    
    -- Add status constraint if it doesn't exist and status column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'membership_plans' 
        AND column_name = 'status'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'membership_plans' 
        AND constraint_name = 'membership_plans_status_check'
    ) THEN
        ALTER TABLE public.membership_plans 
        ADD CONSTRAINT membership_plans_status_check 
        CHECK (status IN ('Active', 'Inactive', 'Discontinued'));
    END IF;
END $$;

-- Create indexes for performance (safe operation)
CREATE INDEX IF NOT EXISTS idx_membership_plans_gym_id ON public.membership_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_status ON public.membership_plans(status);
CREATE INDEX IF NOT EXISTS idx_membership_plans_duration_type ON public.membership_plans(duration_type);
CREATE INDEX IF NOT EXISTS idx_membership_plans_price ON public.membership_plans(price);

-- Verify the update
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'membership_plans'
ORDER BY ordinal_position;