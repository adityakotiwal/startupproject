-- GymSync Pro Payments Table Creation Script
-- Copy and paste this into Supabase SQL Editor

-- Create payments table with correct schema
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'card', 'upi', 'bank_transfer')),
    transaction_id TEXT,
    notes TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON public.payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_mode ON public.payments(payment_mode);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own gym payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own gym payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own gym payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete own gym payments" ON public.payments;

-- Create RLS policies for multi-tenant isolation
CREATE POLICY "Users can view own gym payments" ON public.payments
    FOR SELECT USING (
        gym_id IN (
            SELECT id FROM public.gyms WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own gym payments" ON public.payments
    FOR INSERT WITH CHECK (
        gym_id IN (
            SELECT id FROM public.gyms WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own gym payments" ON public.payments
    FOR UPDATE USING (
        gym_id IN (
            SELECT id FROM public.gyms WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own gym payments" ON public.payments
    FOR DELETE USING (
        gym_id IN (
            SELECT id FROM public.gyms WHERE owner_id = auth.uid()
        )
    );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.payments;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- Insert some sample data for testing (optional)
-- Uncomment these lines if you want sample data
/*
INSERT INTO public.payments (gym_id, member_id, amount, payment_mode, notes, payment_date)
SELECT 
    g.id as gym_id,
    m.id as member_id,
    2000 as amount,
    'cash' as payment_mode,
    'Initial membership payment' as notes,
    NOW() as payment_date
FROM public.gyms g
CROSS JOIN public.members m
WHERE g.owner_id = auth.uid()
LIMIT 1;
*/