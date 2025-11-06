-- ============================================
-- Enable Real-Time for Guest Book Messages
-- ============================================
-- Run this in Supabase SQL Editor to fix realtime issues

-- 1. Check current realtime status
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'voceo_guest_book_messages';

-- 2. Enable Real-Time for the guest book table
-- This is the critical step that fixes the "mismatch between server and client bindings" error
ALTER PUBLICATION supabase_realtime ADD TABLE voceo_guest_book_messages;

-- 3. Verify it was added
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'voceo_guest_book_messages';

-- 4. Check RLS policies to ensure realtime can access the table
SELECT * FROM pg_policies 
WHERE tablename = 'voceo_guest_book_messages';

-- ============================================
-- Expected Output:
-- ============================================
-- After running step 2, you should see:
--   schemaname | tablename
--   -----------+---------------------------
--   public     | voceo_guest_book_messages
--
-- This confirms Real-Time is properly configured.
