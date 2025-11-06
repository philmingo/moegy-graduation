-- =====================================================
-- Guest Book Table Configuration Check
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Check if table exists and get basic info
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'voceo_guest_book_messages';

-- 2. Check table structure and columns
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'voceo_guest_book_messages'
ORDER BY ordinal_position;

-- 3. Check for indexes (IMPORTANT for performance)
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'voceo_guest_book_messages';

-- 4. Check if Real-Time is enabled on the table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'voceo_guest_book_messages';

-- 5. Check RLS (Row Level Security) policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'voceo_guest_book_messages';

-- 6. Get table statistics (row count, size, etc.)
SELECT 
    schemaname,
    relname as table_name,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'voceo_guest_book_messages';

-- 7. Check for foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'voceo_guest_book_messages';

-- =====================================================
-- RECOMMENDED: Add indexes if missing
-- =====================================================

-- Index on created_at for faster ordering (newest first)
-- Uncomment to create if it doesn't exist:
-- CREATE INDEX IF NOT EXISTS idx_guest_book_created_at 
-- ON voceo_guest_book_messages(created_at DESC);

-- Index on approved for faster filtering
-- Uncomment to create if it doesn't exist:
-- CREATE INDEX IF NOT EXISTS idx_guest_book_approved 
-- ON voceo_guest_book_messages(approved) 
-- WHERE approved = true;

-- Composite index for approved + created_at (most common query)
-- Uncomment to create if it doesn't exist:
-- CREATE INDEX IF NOT EXISTS idx_guest_book_approved_created 
-- ON voceo_guest_book_messages(approved, created_at DESC) 
-- WHERE approved = true;

-- Index on student_id for lookups
-- Uncomment to create if it doesn't exist:
-- CREATE INDEX IF NOT EXISTS idx_guest_book_student_id 
-- ON voceo_guest_book_messages(student_id);

-- =====================================================
-- RECOMMENDED: Enable Real-Time if not enabled
-- =====================================================

-- Check current Real-Time publication
SELECT * FROM pg_publication_tables WHERE tablename = 'voceo_guest_book_messages';

-- If not in publication, you need to enable it in Supabase Dashboard:
-- Database > Replication > Enable for voceo_guest_book_messages table

-- =====================================================
-- OPTIONAL: Analyze query performance
-- =====================================================

-- Run EXPLAIN ANALYZE on your common query to see if indexes help
EXPLAIN ANALYZE
SELECT *
FROM voceo_guest_book_messages
WHERE approved = true
ORDER BY created_at DESC;
