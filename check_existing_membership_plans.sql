-- Check existing membership_plans table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'membership_plans'
ORDER BY ordinal_position;

-- Also check if there's any existing data
SELECT COUNT(*) as total_records FROM public.membership_plans;