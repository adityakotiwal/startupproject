-- GymSync Pro Staff Details Table Creation Script
-- Copy and paste this into Supabase SQL Editor

-- Create staff_details table
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

-- Enable Row Level Security
ALTER TABLE public.staff_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their gym staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can insert their gym staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can update their gym staff" ON public.staff_details;
DROP POLICY IF EXISTS "Users can delete their gym staff" ON public.staff_details;

-- Create RLS policies for multi-tenant isolation
CREATE POLICY "Users can view their gym staff" ON public.staff_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE gyms.id = staff_details.gym_id 
            AND gyms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their gym staff" ON public.staff_details
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE gyms.id = staff_details.gym_id 
            AND gyms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their gym staff" ON public.staff_details
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE gyms.id = staff_details.gym_id 
            AND gyms.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their gym staff" ON public.staff_details
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE gyms.id = staff_details.gym_id 
            AND gyms.owner_id = auth.uid()
        )
    );

-- Create trigger for updated_at (reuse existing function)
DROP TRIGGER IF EXISTS set_updated_at_staff ON public.staff_details;
CREATE TRIGGER set_updated_at_staff
    BEFORE UPDATE ON public.staff_details
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.staff_details TO authenticated;
GRANT ALL ON public.staff_details TO service_role;

-- Add some helpful comments
COMMENT ON TABLE public.staff_details IS 'Stores staff member information for gym management';
COMMENT ON COLUMN public.staff_details.employment_details IS 'JSONB field containing flexible employment information like name, phone, email, address, role, salary, etc.';
COMMENT ON COLUMN public.staff_details.gym_id IS 'References the gym this staff member belongs to for multi-tenant security';