-- GymSync Pro - Staff Salary Payments Table
-- This table tracks all salary payments made to staff members
-- Run this in Supabase SQL Editor

-- Create staff_salary_payments table
CREATE TABLE IF NOT EXISTS public.staff_salary_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL,
    gym_id UUID NOT NULL,
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_month INTEGER NOT NULL CHECK (payment_month >= 1 AND payment_month <= 12),
    payment_year INTEGER NOT NULL CHECK (payment_year >= 2020 AND payment_year <= 2100),
    
    -- Payment method
    payment_mode TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other')),
    transaction_id TEXT,
    
    -- Additional details
    notes TEXT,
    bonus_amount DECIMAL(10, 2) DEFAULT 0 CHECK (bonus_amount >= 0),
    deduction_amount DECIMAL(10, 2) DEFAULT 0 CHECK (deduction_amount >= 0),
    deduction_reason TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'Paid' CHECK (status IN ('Paid', 'Pending', 'Cancelled')),
    
    -- Metadata
    paid_by UUID REFERENCES auth.users(id), -- User who recorded the payment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_salary_payments_staff_id ON public.staff_salary_payments(staff_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_gym_id ON public.staff_salary_payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_date ON public.staff_salary_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_salary_payments_month_year ON public.staff_salary_payments(payment_month, payment_year);
CREATE INDEX IF NOT EXISTS idx_salary_payments_status ON public.staff_salary_payments(status);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_salary_payments_gym_staff ON public.staff_salary_payments(gym_id, staff_id);

-- Enable Row Level Security
ALTER TABLE public.staff_salary_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their gym salary payments" ON public.staff_salary_payments;
DROP POLICY IF EXISTS "Users can insert their gym salary payments" ON public.staff_salary_payments;
DROP POLICY IF EXISTS "Users can update their gym salary payments" ON public.staff_salary_payments;
DROP POLICY IF EXISTS "Users can delete their gym salary payments" ON public.staff_salary_payments;

-- RLS Policies for multi-tenant isolation

-- SELECT: Users can view salary payments for their gym
CREATE POLICY "Users can view their gym salary payments" 
ON public.staff_salary_payments
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.gyms 
        WHERE gyms.id = staff_salary_payments.gym_id 
        AND gyms.owner_id = auth.uid()
    )
);

-- INSERT: Users can create salary payments for their gym
CREATE POLICY "Users can insert their gym salary payments" 
ON public.staff_salary_payments
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.gyms 
        WHERE gyms.id = staff_salary_payments.gym_id 
        AND gyms.owner_id = auth.uid()
    )
);

-- UPDATE: Users can update salary payments for their gym
CREATE POLICY "Users can update their gym salary payments" 
ON public.staff_salary_payments
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.gyms 
        WHERE gyms.id = staff_salary_payments.gym_id 
        AND gyms.owner_id = auth.uid()
    )
);

-- DELETE: Users can delete salary payments for their gym
CREATE POLICY "Users can delete their gym salary payments" 
ON public.staff_salary_payments
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.gyms 
        WHERE gyms.id = staff_salary_payments.gym_id 
        AND gyms.owner_id = auth.uid()
    )
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_staff_salary_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_staff_salary_payments_updated_at_trigger ON public.staff_salary_payments;
CREATE TRIGGER update_staff_salary_payments_updated_at_trigger
    BEFORE UPDATE ON public.staff_salary_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_salary_payments_updated_at();

-- Create a view for salary payment summary
CREATE OR REPLACE VIEW staff_salary_summary AS
SELECT 
    s.user_id as staff_id,
    s.full_name,
    s.salary as monthly_salary,
    COUNT(sp.id) as total_payments,
    COALESCE(SUM(sp.amount), 0) as total_paid,
    COALESCE(MAX(sp.payment_date), NULL) as last_payment_date,
    s.gym_id
FROM public.staff_details s
LEFT JOIN public.staff_salary_payments sp ON s.user_id = sp.staff_id AND sp.status = 'Paid'
GROUP BY s.user_id, s.full_name, s.salary, s.gym_id;

-- Grant necessary permissions
GRANT SELECT ON staff_salary_summary TO authenticated;

COMMENT ON TABLE public.staff_salary_payments IS 'Tracks salary payments made to staff members';
COMMENT ON COLUMN public.staff_salary_payments.payment_month IS 'Month for which salary is paid (1-12)';
COMMENT ON COLUMN public.staff_salary_payments.payment_year IS 'Year for which salary is paid';
COMMENT ON COLUMN public.staff_salary_payments.bonus_amount IS 'Any bonus amount added to base salary';
COMMENT ON COLUMN public.staff_salary_payments.deduction_amount IS 'Any deductions from base salary';
