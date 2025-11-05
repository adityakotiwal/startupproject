-- RLS Setup for Class Schedules Table - Same Pattern as Staff/Expenses/Equipment/Membership Plans
-- Run this AFTER creating the table

-- Enable RLS on class_schedules table
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view class schedules from their gyms" ON public.class_schedules;
DROP POLICY IF EXISTS "Users can create class schedules in their gyms" ON public.class_schedules;
DROP POLICY IF EXISTS "Users can update class schedules in their gyms" ON public.class_schedules;
DROP POLICY IF EXISTS "Users can delete class schedules from their gyms" ON public.class_schedules;

-- Create RLS policies for class_schedules (EXACT same pattern as expenses/staff/equipment/membership_plans)
CREATE POLICY "Users can view class schedules from their gyms" ON class_schedules 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create class schedules in their gyms" ON class_schedules 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update class schedules in their gyms" ON class_schedules 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete class schedules from their gyms" ON class_schedules 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Grant basic permissions
GRANT ALL ON class_schedules TO authenticated;
GRANT ALL ON class_schedules TO service_role;

-- Verification query
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'class_schedules';