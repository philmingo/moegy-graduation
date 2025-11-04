-- Create Storage Bucket for Guest Book Message Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('voceo-guest-book-messages', 'voceo-guest-book-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for guest book messages bucket
CREATE POLICY "Allow public read access to guest book messages"
ON storage.objects FOR SELECT
USING (bucket_id = 'voceo-guest-book-messages');

CREATE POLICY "Allow authenticated users to upload guest book messages"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voceo-guest-book-messages');

CREATE POLICY "Allow authenticated users to update guest book messages"
ON storage.objects FOR UPDATE
USING (bucket_id = 'voceo-guest-book-messages');

CREATE POLICY "Allow authenticated users to delete guest book messages"
ON storage.objects FOR DELETE
USING (bucket_id = 'voceo-guest-book-messages');

-- Create guest_book_messages table
CREATE TABLE IF NOT EXISTS voceo_guest_book_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_location TEXT NOT NULL, -- University field
  message_image_url TEXT NOT NULL, -- Storage URL for the image
  approved BOOLEAN DEFAULT true, -- For future moderation if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_voceo_guest_book_messages_created_at ON voceo_guest_book_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voceo_guest_book_messages_student_id ON voceo_guest_book_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_voceo_guest_book_messages_approved ON voceo_guest_book_messages(approved);

-- Enable Row Level Security (RLS)
ALTER TABLE voceo_guest_book_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we're using service role)
-- Adjust policies based on your security requirements
CREATE POLICY "Allow all operations on voceo_guest_book_messages" ON voceo_guest_book_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_voceo_guest_book_messages_updated_at
  BEFORE UPDATE ON voceo_guest_book_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
