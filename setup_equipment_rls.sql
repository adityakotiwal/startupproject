-- RLS Setup for Equipment Table - Same Pattern as Staff/Expenses
-- Run this AFTER creating the table

-- Enable RLS on equipment table
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view equipment from their gyms" ON public.equipment;
DROP POLICY IF EXISTS "Users can create equipment in their gyms" ON public.equipment;
DROP POLICY IF EXISTS "Users can update equipment in their gyms" ON public.equipment;
DROP POLICY IF EXISTS "Users can delete equipment from their gyms" ON public.equipment;

-- Create RLS policies for equipment (EXACT same pattern as expenses/staff)
CREATE POLICY "Users can view equipment from their gyms" ON equipment 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create equipment in their gyms" ON equipment 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update equipment in their gyms" ON equipment 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete equipment from their gyms" ON equipment 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Grant basic permissions
GRANT ALL ON equipment TO authenticated;
GRANT ALL ON equipment TO service_role;

-- Verification query
SELECT 'Equipment RLS policies applied successfully' as status;