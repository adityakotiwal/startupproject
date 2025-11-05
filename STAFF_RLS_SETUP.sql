-- ============================================
-- STAFF RLS SETUP FOR GYMSYNC PRO
-- ============================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- and click "Run" to set up staff table RLS policies

-- Enable RLS on staff_details table
ALTER TABLE public.staff_details ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "gym_owners_can_view_staff" ON public.staff_details;
DROP POLICY IF EXISTS "gym_owners_can_insert_staff" ON public.staff_details;
DROP POLICY IF EXISTS "gym_owners_can_update_staff" ON public.staff_details;
DROP POLICY IF EXISTS "gym_owners_can_delete_staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can view their gym staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can insert their gym staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can update their gym staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can delete their gym staff" ON public.staff_details;

-- Create comprehensive RLS policies for staff_details
CREATE POLICY "gym_owners_can_view_staff" ON public.staff_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE gyms.id = staff_details.gym_id 
            AND gyms.owner_id = auth.uid()
        )
    );

CREATE POLICY "gym_owners_can_insert_staff" ON public.staff_details
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE gyms.id = staff_details.gym_id 
            AND gyms.owner_id = auth.uid()
        )
    );

CREATE POLICY "gym_owners_can_update_staff" ON public.staff_details
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE gyms.id = staff_details.gym_id 
            AND gyms.owner_id = auth.uid()
        )
    );

CREATE POLICY "gym_owners_can_delete_staff" ON public.staff_details
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE gyms.id = staff_details.gym_id 
            AND gyms.owner_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.staff_details TO authenticated;
GRANT ALL ON public.staff_details TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at field
DROP TRIGGER IF EXISTS staff_details_updated_at ON public.staff_details;
CREATE TRIGGER staff_details_updated_at
    BEFORE UPDATE ON public.staff_details
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Test query to verify setup
SELECT 
    'RLS Status' as check_type,
    CASE WHEN relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_class 
WHERE relname = 'staff_details';

SELECT 
    'Policy Count' as check_type,
    COUNT(*)::text as status
FROM pg_policies 
WHERE tablename = 'staff_details';

-- Display all policies for verification
SELECT 
    policyname as policy_name,
    cmd as command_type,
    permissive as policy_type
FROM pg_policies 
WHERE tablename = 'staff_details'
ORDER BY policyname;