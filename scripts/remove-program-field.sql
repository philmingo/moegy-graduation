-- Remove the duplicate 'program' field and keep 'programme'
-- This script will clean up the database schema

-- First, check if both fields exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('program', 'programme');

-- If 'program' field exists and has data, migrate it to 'programme' first
UPDATE students 
SET programme = program 
WHERE programme IS NULL 
AND program IS NOT NULL;

-- Now drop the 'program' column
ALTER TABLE students DROP COLUMN IF EXISTS program;

-- Verify the change
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('program', 'programme');
