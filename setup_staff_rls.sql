-- Complete Staff RLS Setup for GymSync Pro
-- Run this in Supabase SQL Editor

-- First, ensure the staff_details table exists with correct structure
CREATE TABLE IF NOT EXISTS public.staff_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    gym_id UUID NOT NULL,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Terminated')),
    employment_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_details_user_id ON public.staff_details(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_details_gym_id ON public.staff_details(gym_id);
CREATE INDEX IF NOT EXISTS idx_staff_details_status ON public.staff_details(status);

-- Enable RLS
ALTER TABLE public.staff_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their gym staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can insert their gym staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can update their gym staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can delete their gym staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can view staff from their gyms" ON public.staff_details;
DROP POLICY IF EXISTS "Users can create staff in their gyms" ON public.staff_details;
DROP POLICY IF EXISTS "Users can update staff in their gyms" ON public.staff_details;
DROP POLICY IF EXISTS "Users can delete staff from their gyms" ON public.staff_details;
DROP POLICY IF EXISTS "Enable read access for gym owners" ON public.staff_details;
DROP POLICY IF EXISTS "Enable insert access for gym owners" ON public.staff_details;
DROP POLICY IF EXISTS "Enable update access for gym owners" ON public.staff_details;
DROP POLICY IF EXISTS "Enable delete access for gym owners" ON public.staff_details;

-- Create comprehensive RLS policies
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

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER staff_details_updated_at
    BEFORE UPDATE ON public.staff_details
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Verification queries (run these to test)
-- SELECT 'staff_details table exists' as status, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_details') as result;
-- SELECT 'RLS is enabled' as status, relrowsecurity as result FROM pg_class WHERE relname = 'staff_details';
-- SELECT policyname FROM pg_policies WHERE tablename = 'staff_details';