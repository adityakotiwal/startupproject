-- ============================================
-- RESTORE ORIGINAL STAFF RLS (SAME AS MEMBERS)
-- ============================================
-- Copy and paste this into your Supabase SQL Editor to restore the simple RLS

-- Enable RLS on staff_details table
ALTER TABLE public.staff_details ENABLE ROW LEVEL SECURITY;

-- Drop all the complex policies we added
DROP POLICY IF EXISTS "gym_owners_can_view_staff" ON public.staff_details;
DROP POLICY IF EXISTS "gym_owners_can_insert_staff" ON public.staff_details;
DROP POLICY IF EXISTS "gym_owners_can_update_staff" ON public.staff_details;
DROP POLICY IF EXISTS "gym_owners_can_delete_staff" ON public.staff_details;

-- Create simple RLS policies (SAME PATTERN AS MEMBERS)
CREATE POLICY "Users can view staff from their gyms" ON staff_details 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create staff in their gyms" ON staff_details 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update staff in their gyms" ON staff_details 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete staff from their gyms" ON staff_details 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Grant basic permissions
GRANT ALL ON staff_details TO authenticated;
GRANT ALL ON staff_details TO service_role;

-- Verification query
SELECT 'Staff RLS restored to original simple pattern' as status;