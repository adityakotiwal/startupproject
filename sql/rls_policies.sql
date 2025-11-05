-- Row Level Security (RLS) Policies for Data Isolation
-- This SQL script ensures that each gym can only access its own data

-- Enable RLS on all tables
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Gyms table: Users can only see gyms they own
CREATE POLICY "Users can view their own gyms" ON gyms 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own gyms" ON gyms 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own gyms" ON gyms 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own gyms" ON gyms 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Members table: Users can only see members from gyms they own
CREATE POLICY "Users can view members from their gyms" ON members 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create members in their gyms" ON members 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update members in their gyms" ON members 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete members in their gyms" ON members 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Membership Plans table: Users can only see plans from gyms they own
CREATE POLICY "Users can view plans from their gyms" ON membership_plans 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create plans in their gyms" ON membership_plans 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update plans in their gyms" ON membership_plans 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete plans in their gyms" ON membership_plans 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Payments table: Users can only see payments from gyms they own
CREATE POLICY "Users can view payments from their gyms" ON payments 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create payments in their gyms" ON payments 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update payments in their gyms" ON payments 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete payments in their gyms" ON payments 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Profiles table: Users can only see their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Staff Details table: Users can only see staff from gyms they own
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view staff from their gyms" ON staff_details 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create staff in their gyms" ON staff_details 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update staff in their gyms" ON staff_details 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete staff from their gyms" ON staff_details 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);