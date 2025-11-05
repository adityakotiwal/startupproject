-- RLS Setup for Membership Plans Table - Same Pattern as Staff/Expenses/Equipment
-- Run this AFTER creating the table

-- Enable RLS on membership_plans table
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view membership plans from their gyms" ON public.membership_plans;
DROP POLICY IF EXISTS "Users can create membership plans in their gyms" ON public.membership_plans;
DROP POLICY IF EXISTS "Users can update membership plans in their gyms" ON public.membership_plans;
DROP POLICY IF EXISTS "Users can delete membership plans from their gyms" ON public.membership_plans;

-- Create RLS policies for membership_plans (EXACT same pattern as expenses/staff/equipment)
CREATE POLICY "Users can view membership plans from their gyms" ON membership_plans 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create membership plans in their gyms" ON membership_plans 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update membership plans in their gyms" ON membership_plans 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete membership plans from their gyms" ON membership_plans 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Grant basic permissions
GRANT ALL ON membership_plans TO authenticated;
GRANT ALL ON membership_plans TO service_role;

-- Verification query
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'membership_plans';