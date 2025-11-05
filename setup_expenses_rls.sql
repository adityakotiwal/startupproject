-- RLS Setup for Expenses Table
-- Run this in Supabase SQL Editor

-- Enable RLS on expenses table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view expenses from their gyms" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses in their gyms" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses in their gyms" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses from their gyms" ON public.expenses;

-- Create RLS policies for expenses (same pattern as members/staff)
CREATE POLICY "Users can view expenses from their gyms" ON expenses 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create expenses in their gyms" ON expenses 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update expenses in their gyms" ON expenses 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete expenses from their gyms" ON expenses 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Grant basic permissions
GRANT ALL ON expenses TO authenticated;
GRANT ALL ON expenses TO service_role;

-- Verification query
SELECT 'Expenses RLS policies applied successfully' as status;