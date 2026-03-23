-- Fix notifications table constraints and RLS policies for rating support

-- 1. Drop the old type_check constraint that doesn't include 'rating'
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Add the correct type_check constraint with 'rating' included
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS valid_notification_type;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (
  type IS NULL OR
  type = ANY (ARRAY[
    'complaint'::varchar,
    'system'::varchar,
    'announcement'::varchar,
    'update'::varchar,
    'urgent'::varchar,
    'rating'::varchar
  ])
);

-- 3. Ensure RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can delete any notification" ON notifications;

-- 5. Create new RLS policies

-- Policy: Anyone authenticated can view notifications where they are the recipient OR all admin notifications
CREATE POLICY "authenticated_users_view_notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() 
    OR recipient_type = 'admin'
  );

-- Policy: Anyone authenticated can insert notifications (needed for rating submissions)
CREATE POLICY "authenticated_users_insert_notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update their own notifications (mark as read/unread)
CREATE POLICY "authenticated_users_update_notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    recipient_id = auth.uid() 
    OR recipient_type = 'admin'
  );

-- Policy: Users can delete their own notifications
CREATE POLICY "authenticated_users_delete_notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (
    recipient_id = auth.uid() 
    OR recipient_type = 'admin'
  );

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated;

-- 7. Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Test query - verify rating notifications can be inserted
-- Run this manually after migration to test:
/*
INSERT INTO notifications (title, message, recipient_type, type, is_read)
VALUES (
  'Test Rating',
  'This is a test rating notification',
  'admin',
  'rating',
  false
);
*/
