-- Find the specific transactions that differ between created_at and completed_at on those dates
SELECT 
    id, 
    transaction_number, 
    created_at, 
    completed_at, 
    total_amount, 
    status,
    shift_id
FROM transactions 
WHERE (DATE(created_at) = '2026-04-16' AND (DATE(completed_at) != '2026-04-16' OR completed_at IS NULL))
   OR (DATE(created_at) = '2026-04-23' AND (DATE(completed_at) != '2026-04-23' OR completed_at IS NULL));
