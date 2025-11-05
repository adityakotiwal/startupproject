-- Membership Plans Management Table Creation
-- Run this in Supabase SQL Editor first

-- Create membership_plans table following the same pattern as expenses/equipment/staff
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    gym_id UUID NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    duration_months INTEGER NOT NULL DEFAULT 1,
    duration_type TEXT DEFAULT 'monthly' CHECK (duration_type IN ('daily', 'weekly', 'monthly', 'yearly', 'lifetime')),
    features TEXT[], -- Array of features/benefits
    description TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Discontinued')),
    is_popular BOOLEAN DEFAULT false,
    max_members INTEGER, -- Optional member limit
    color_theme TEXT DEFAULT '#3B82F6' -- For UI display
);

-- Create indexes for performance (same pattern)
CREATE INDEX IF NOT EXISTS idx_membership_plans_gym_id ON public.membership_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_status ON public.membership_plans(status);
CREATE INDEX IF NOT EXISTS idx_membership_plans_duration_type ON public.membership_plans(duration_type);
CREATE INDEX IF NOT EXISTS idx_membership_plans_price ON public.membership_plans(price);

-- Add foreign key to gyms table (same pattern)
ALTER TABLE public.membership_plans 
ADD CONSTRAINT membership_plans_gym_id_fkey 
FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

-- Verify table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'membership_plans'
ORDER BY ordinal_position;