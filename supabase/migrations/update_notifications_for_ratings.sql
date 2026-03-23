-- Update notifications table to support rating notifications

-- 1. Add type column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system';

-- 2. Add index on type for faster filtering
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);

-- 3. Add index on recipient_type for faster filtering
CREATE INDEX IF NOT EXISTS notifications_recipient_type_idx ON notifications(recipient_type);

-- 4. Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can view notifications" ON notifications;
DROP POLICY IF EXISTS "Staff can view notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can delete notifications" ON notifications;

-- 6. Create new RLS policies

-- Policy: Users (students, staff) can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (
    auth.uid() = recipient_id 
    OR recipient_type = 'admin'
  );

-- Policy: System can insert notifications for any user
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (
    auth.uid() = recipient_id 
    OR recipient_type = 'admin'
  );

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (
    auth.uid() = recipient_id 
    OR recipient_type = 'admin'
  );

-- Policy: Admin can view all notifications
CREATE POLICY "Admin can view all notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admin can delete any notification
CREATE POLICY "Admin can delete any notification"
  ON notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 7. Create a function to get notification count by type
CREATE OR REPLACE FUNCTION get_notification_count_by_type()
RETURNS TABLE (
  notification_type TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT n.type, COUNT(*)::BIGINT
  FROM notifications n
  GROUP BY n.type;
END;
$$ LANGUAGE plpgsql;

-- 8. Add check constraint for valid notification types
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS valid_notification_type;

ALTER TABLE notifications
ADD CONSTRAINT valid_notification_type 
CHECK (type IN ('complaint', 'system', 'announcement', 'update', 'urgent', 'rating'));

-- 9. Add created_at index for faster sorting
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT USAGE ON SEQUENCE notifications_id_seq TO authenticated;
