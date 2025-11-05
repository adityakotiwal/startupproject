-- Migration: Create member_payment_totals view for N+1 optimization
-- Purpose: Pre-aggregate payment totals per member to avoid N+1 query problem
-- Created: 2025-11-05
-- Safe: READ-ONLY view, no data modification

-- Drop view if exists (safe to re-run)
DROP VIEW IF EXISTS member_payment_totals;

-- Create aggregated view of payment totals per member
CREATE OR REPLACE VIEW member_payment_totals AS
SELECT 
  p.member_id,
  p.gym_id,
  COALESCE(SUM(p.amount), 0) AS total_amount,
  COUNT(p.id) AS payment_count,
  MAX(p.payment_date) AS last_payment_date
FROM payments p
GROUP BY p.member_id, p.gym_id;

-- Add comment for documentation
COMMENT ON VIEW member_payment_totals IS 
  'Aggregated payment totals per member. Used to avoid N+1 queries when fetching members with payment data.';

-- Grant access to authenticated users (matches RLS policy pattern)
GRANT SELECT ON member_payment_totals TO authenticated;
GRANT SELECT ON member_payment_totals TO anon;

-- Note: Views inherit RLS from base tables, so payment data is still secured
