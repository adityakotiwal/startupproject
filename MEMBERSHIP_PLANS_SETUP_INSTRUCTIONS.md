You can now copy and paste these SQL scripts into your Supabase SQL Editor:

**Step 1: Create Membership Plans Table**
```sql
-- Membership Plans Management Table Creation
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    gym_id UUID NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    duration_months INTEGER NOT NULL DEFAULT 1,
    duration_type TEXT DEFAULT 'monthly' CHECK (duration_type IN ('daily', 'weekly', 'monthly', 'yearly', 'lifetime')),
    features TEXT[], -- Array of features/benefits
    description TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Discontinued')),
    is_popular BOOLEAN DEFAULT false,
    max_members INTEGER, -- Optional member limit
    color_theme TEXT DEFAULT '#3B82F6' -- For UI display
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_membership_plans_gym_id ON public.membership_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_status ON public.membership_plans(status);
CREATE INDEX IF NOT EXISTS idx_membership_plans_duration_type ON public.membership_plans(duration_type);
CREATE INDEX IF NOT EXISTS idx_membership_plans_price ON public.membership_plans(price);
```

**Step 2: Setup RLS Policies**
```sql
-- Enable RLS on membership_plans table
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for membership_plans (EXACT same pattern as expenses/staff/equipment)
CREATE POLICY "Users can view membership plans from their gyms" ON membership_plans 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create membership plans in their gyms" ON membership_plans 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update membership plans in their gyms" ON membership_plans 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete membership plans from their gyms" ON membership_plans 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON membership_plans TO authenticated;
GRANT ALL ON membership_plans TO service_role;
```

After running these SQL scripts, your Membership Plans Management System will be fully functional!