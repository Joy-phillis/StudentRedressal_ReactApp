-- Create ratings table for student feedback on resolved complaints
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS ratings_complaint_id_idx ON ratings(complaint_id);
CREATE INDEX IF NOT EXISTS ratings_user_id_idx ON ratings(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own ratings
CREATE POLICY "Users can view own ratings"
  ON ratings FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own ratings
CREATE POLICY "Users can insert own ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Staff and admin can view all ratings
CREATE POLICY "Staff can view all ratings"
  ON ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Policy: Admin can delete ratings
CREATE POLICY "Admin can delete ratings"
  ON ratings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add notification type for ratings (if not already exists)
-- Note: This assumes notifications table already exists
-- If type column doesn't exist, you may need to add it:
-- ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system';
