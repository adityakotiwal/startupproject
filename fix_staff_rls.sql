-- Simple RLS policies for staff_details table
-- Run this in Supabase SQL Editor

-- Enable RLS on staff_details table
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable read access for gym owners" ON staff_details;
DROP POLICY IF EXISTS "Enable insert access for gym owners" ON staff_details;
DROP POLICY IF EXISTS "Enable update access for gym owners" ON staff_details;
DROP POLICY IF EXISTS "Enable delete access for gym owners" ON staff_details;

-- Create simple policies for staff_details
CREATE POLICY "Enable read access for gym owners" ON staff_details
    FOR SELECT USING (
        gym_id IN (
            SELECT id FROM gyms WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert access for gym owners" ON staff_details
    FOR INSERT WITH CHECK (
        gym_id IN (
            SELECT id FROM gyms WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Enable update access for gym owners" ON staff_details
    FOR UPDATE USING (
        gym_id IN (
            SELECT id FROM gyms WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete access for gym owners" ON staff_details
    FOR DELETE USING (
        gym_id IN (
            SELECT id FROM gyms WHERE owner_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON staff_details TO authenticated;
GRANT ALL ON staff_details TO service_role;