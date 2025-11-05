You can now copy and paste these SQL scripts into your Supabase SQL Editor:

**Step 1: Create Equipment Table**
```sql
-- Equipment Management Table Creation
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
```

**Step 2: Setup RLS Policies**
```sql
-- Enable RLS on equipment table
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for equipment
CREATE POLICY "Users can view equipment from their gyms" ON equipment 
FOR SELECT 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create equipment in their gyms" ON equipment 
FOR INSERT 
WITH CHECK (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update equipment in their gyms" ON equipment 
FOR UPDATE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete equipment from their gyms" ON equipment 
FOR DELETE 
USING (
  gym_id IN (
    SELECT id FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON equipment TO authenticated;
GRANT ALL ON equipment TO service_role;
```

After running these SQL scripts, your Equipment Management System will be fully functional!