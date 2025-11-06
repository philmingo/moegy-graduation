-- =====================================================
-- Optimize Guest Book Table Indexes
-- Run this to improve query performance
-- =====================================================

-- Drop the existing created_at index (will be replaced with composite)
-- Only run if you want to optimize further
-- DROP INDEX IF EXISTS idx_voceo_guest_book_messages_created_at;

-- Create composite index for the most common query:
-- WHERE approved = true ORDER BY created_at DESC
-- This is better than separate indexes
CREATE INDEX IF NOT EXISTS idx_guest_book_approved_created 
ON voceo_guest_book_messages(approved, created_at DESC) 
WHERE approved = true;

-- Add index on student_id for faster lookups when enriching with student data
CREATE INDEX IF NOT EXISTS idx_guest_book_student_id 
ON voceo_guest_book_messages(student_id);

-- Analyze the table to update statistics
ANALYZE voceo_guest_book_messages;

-- =====================================================
-- Verify the new indexes are being used
-- =====================================================

-- Run this to see if the composite index is now used
EXPLAIN ANALYZE
SELECT *
FROM voceo_guest_book_messages
WHERE approved = true
ORDER BY created_at DESC;

-- Expected result after optimization:
-- Should use "Index Scan using idx_guest_book_approved_created"
-- Should have LOWER cost and potentially faster execution
