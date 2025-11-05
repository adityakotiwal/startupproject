-- GymSync Pro Members Table Creation Script
-- Copy and paste this into Supabase SQL Editor

-- Create members table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'overdue', 'quit')),
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_phone_per_user UNIQUE(user_id, phone)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_join_date ON public.members(join_date);

-- Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own members" ON public.members;
DROP POLICY IF EXISTS "Users can insert own members" ON public.members;
DROP POLICY IF EXISTS "Users can update own members" ON public.members;
DROP POLICY IF EXISTS "Users can delete own members" ON public.members;

-- Create RLS policies for multi-tenant isolation
CREATE POLICY "Users can view own members" ON public.members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own members" ON public.members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own members" ON public.members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own members" ON public.members
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.members;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;