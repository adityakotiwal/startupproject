# Add Notes Column to Equipment Table

## Problem
When using the Equipment Action Modal (Maintenance/Warranty actions), you get this error:
```
Failed to complete action: Could not find the 'notes' column of 'equipment' in the schema cache
```

## Solution
Run the migration to add the `notes` column to the equipment table.

## How to Fix

### Option 1: Run SQL in Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Add notes column to equipment table
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS notes TEXT;
```

5. Click **Run** or press `Ctrl+Enter`
6. You should see: "Success. No rows returned"

### Option 2: Using Migration File
```bash
# Make the script executable
chmod +x add-equipment-notes.sh

# Run the script
./add-equipment-notes.sh
```

## What This Does
- Adds a `notes` TEXT column to the `equipment` table
- Allows storing maintenance history, warranty notes, and equipment updates
- Enables full functionality of the Equipment Action Modal

## Verification
After running the migration, you can verify it worked by:
1. Go to Supabase Dashboard → Table Editor → equipment
2. You should see a new "notes" column
3. Try using the Equipment Action Modal - it should work now!

## Features Enabled
Once the notes column is added, you can:
- ✅ Mark maintenance as completed with notes
- ✅ Reschedule maintenance with reasons
- ✅ Skip maintenance with explanation
- ✅ Extend warranty with details
- ✅ File warranty claims with information
- ✅ Acknowledge warranty expiry with notes
- ✅ Track complete equipment history

## Need Help?
If you still see errors after running the migration:
1. Refresh your browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear Supabase cache if needed
3. Check the equipment table has the notes column in Table Editor
