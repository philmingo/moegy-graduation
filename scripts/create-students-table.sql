-- Create students table with all required columns
-- This will create the table if it doesn't exist, or add missing columns if it does

CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seat_no TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    name TEXT,
    university TEXT,
    programme TEXT,
    classification TEXT,
    email TEXT,
    phonetic_spelling TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Graduated', 'Absent')),
    shared BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    -- Add seat_no if it doesn't exist
    BEGIN
        ALTER TABLE students ADD COLUMN seat_no TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add university if it doesn't exist
    BEGIN
        ALTER TABLE students ADD COLUMN university TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add programme if it doesn't exist
    BEGIN
        ALTER TABLE students ADD COLUMN programme TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add classification if it doesn't exist
    BEGIN
        ALTER TABLE students ADD COLUMN classification TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
    
    -- Add name if it doesn't exist
    BEGIN
        ALTER TABLE students ADD COLUMN name TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_name ON students(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_students_university ON students(university);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);

-- Show the final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
