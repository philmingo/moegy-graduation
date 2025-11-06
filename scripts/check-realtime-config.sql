-- Check if Real-Time is enabled for the guest_book table
-- Run this in your Supabase SQL Editor

-- 1. Check if the table is in the realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'voceo_guest_book_messages';

-- 2. Check if realtime is enabled at all
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- 3. Check RLS policies on the table
SELECT * FROM pg_policies 
WHERE tablename = 'voceo_guest_book_messages';

-- 4. If Real-Time is not enabled, run this to enable it:
-- ALTER PUBLICATION supabase_realtime ADD TABLE voceo_guest_book_messages;
