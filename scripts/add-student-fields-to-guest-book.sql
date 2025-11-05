-- Add student academic fields to guest book messages table
-- This allows the guest book to display student information without additional queries

ALTER TABLE voceo_guest_book_messages
ADD COLUMN IF NOT EXISTS student_photo_url TEXT,
ADD COLUMN IF NOT EXISTS student_university TEXT,
ADD COLUMN IF NOT EXISTS student_programme TEXT,
ADD COLUMN IF NOT EXISTS student_classification TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN voceo_guest_book_messages.student_photo_url IS 'Student photo URL from students table';
COMMENT ON COLUMN voceo_guest_book_messages.student_university IS 'Student university from students table';
COMMENT ON COLUMN voceo_guest_book_messages.student_programme IS 'Student programme from students table';
COMMENT ON COLUMN voceo_guest_book_messages.student_classification IS 'Student classification from students table';
