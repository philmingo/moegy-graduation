-- Check all indexes on the guest book table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'voceo_guest_book_messages'
ORDER BY indexname;

-- Check table statistics
SELECT 
    relname as table_name,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'voceo_guest_book_messages';

-- Force the query planner to consider using indexes
-- Run with more data to see index usage
SET enable_seqscan = OFF;

EXPLAIN ANALYZE
SELECT *
FROM voceo_guest_book_messages
WHERE approved = true
ORDER BY created_at DESC;

-- Reset the setting
SET enable_seqscan = ON;
