-- Equipment Management Table Creation
-- Run this in Supabase SQL Editor first

-- Create equipment table following the same pattern as expenses
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    gym_id UUID NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    purchase_date DATE,
    cost NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Maintenance', 'Retired', 'Broken')),
    maintenance_due DATE,
    description TEXT,
    serial_number TEXT,
    warranty_expires DATE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_gym_id ON public.equipment(gym_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);

-- Add foreign key to gyms table
ALTER TABLE public.equipment 
ADD CONSTRAINT equipment_gym_id_fkey 
FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

-- Verify table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'equipment'
ORDER BY ordinal_position;