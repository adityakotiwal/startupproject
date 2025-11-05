-- Membership Plans Table
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for membership_plans
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_membership_plans_updated_at 
  BEFORE UPDATE ON membership_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for membership_plans
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Gym owners can manage their own gym's membership plans
CREATE POLICY "Gym owners can manage their membership plans" ON membership_plans
  FOR ALL USING (
    gym_id IN (
      SELECT id FROM gyms WHERE owner_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_membership_plans_gym_id ON membership_plans(gym_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_is_active ON membership_plans(is_active);