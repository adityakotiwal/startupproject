-- Add notes column to equipment table for maintenance and warranty tracking
-- This allows gym owners to add notes when taking actions on equipment

ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.equipment.notes IS 'Notes for maintenance history, warranty actions, and equipment updates';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'equipment'
AND column_name = 'notes';
