-- Add new columns to the students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS seat_no TEXT,
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS programme TEXT,
ADD COLUMN IF NOT EXISTS classification TEXT;

-- Update the table to ensure all columns exist
-- This is safe to run multiple times
DO $$ 
BEGIN
    -- Check if seat_no column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'seat_no') THEN
        ALTER TABLE students ADD COLUMN seat_no TEXT;
    END IF;
    
    -- Check if university column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'university') THEN
        ALTER TABLE students ADD COLUMN university TEXT;
    END IF;
    
    -- Check if programme column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'programme') THEN
        ALTER TABLE students ADD COLUMN programme TEXT;
    END IF;
    
    -- Check if classification column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'classification') THEN
        ALTER TABLE students ADD COLUMN classification TEXT;
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
