-- Class Schedules Management Table Creation
-- Run this in Supabase SQL Editor first

-- Create class_schedules table following the same pattern as expenses/equipment/membership_plans
CREATE TABLE IF NOT EXISTS public.class_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    gym_id UUID NOT NULL,
    class_name TEXT NOT NULL,
    class_type TEXT NOT NULL,
    trainer_name TEXT NOT NULL,
    trainer_id UUID, -- Optional link to staff table
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER DEFAULT 20,
    enrolled_count INTEGER DEFAULT 0,
    description TEXT,
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Ongoing', 'Completed', 'Cancelled')),
    room_location TEXT,
    price NUMERIC DEFAULT 0, -- Additional cost for special classes
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern TEXT -- 'daily', 'weekly', 'monthly'
);

-- Create indexes for performance (same pattern)
CREATE INDEX IF NOT EXISTS idx_class_schedules_gym_id ON public.class_schedules(gym_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_date ON public.class_schedules(class_date);
CREATE INDEX IF NOT EXISTS idx_class_schedules_trainer ON public.class_schedules(trainer_name);
CREATE INDEX IF NOT EXISTS idx_class_schedules_status ON public.class_schedules(status);
CREATE INDEX IF NOT EXISTS idx_class_schedules_type ON public.class_schedules(class_type);

-- Add foreign key to gyms table (same pattern)
ALTER TABLE public.class_schedules 
ADD CONSTRAINT class_schedules_gym_id_fkey 
FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

-- Verify table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'class_schedules'
ORDER BY ordinal_position;