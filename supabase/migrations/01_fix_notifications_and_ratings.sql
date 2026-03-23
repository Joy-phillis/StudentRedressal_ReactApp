-- =====================================================
-- COMPLETE FIX FOR NOTIFICATIONS & RATINGS
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- PART 1: Fix Notifications Table Constraints
-- =====================================================

-- 1. Drop the old conflicting type_check constraint
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Ensure 'rating' is in the type check constraint
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS valid_notification_type;

-- Recreate with 'rating' included
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

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies
DROP POLICY IF EXISTS "authenticated_users_view_notifications" ON notifications;
DROP POLICY IF EXISTS "authenticated_users_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "authenticated_users_update_notifications" ON notifications;
DROP POLICY IF EXISTS "authenticated_users_delete_notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can delete any notification" ON notifications;

-- 5. Create new permissive RLS policies
-- Allow authenticated users to view their own notifications OR any admin notifications
CREATE POLICY "authenticated_users_view_notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() 
    OR recipient_type = 'admin'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow authenticated users to insert notifications (for ratings)
CREATE POLICY "authenticated_users_insert_notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own notifications (mark read/unread)
CREATE POLICY "authenticated_users_update_notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    recipient_id = auth.uid() 
    OR recipient_type = 'admin'
  );

-- Allow users to delete their own notifications
CREATE POLICY "authenticated_users_delete_notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (
    recipient_id = auth.uid() 
    OR recipient_type = 'admin'
  );

-- 6. Grant all permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated;


-- PART 2: Fix Ratings Table RLS
-- =====================================================

-- Enable RLS on ratings
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can insert own ratings" ON ratings;
DROP POLICY IF EXISTS "Staff can view all ratings" ON ratings;
DROP POLICY IF EXISTS "Admin can view all ratings" ON ratings;
DROP POLICY IF EXISTS "Admin can delete ratings" ON ratings;

-- Users can view their own ratings
CREATE POLICY "users_view_own_ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own ratings
CREATE POLICY "users_insert_own_ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Staff and Admin can view all ratings
CREATE POLICY "staff_admin_view_all_ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Admin can delete ratings
CREATE POLICY "admin_delete_ratings"
  ON ratings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ratings TO authenticated;


-- PART 3: Test the Setup
-- =====================================================

-- Test 1: Insert a test rating notification (should succeed)
INSERT INTO notifications (title, message, recipient_type, type, is_read)
VALUES (
  'Test Rating Notification',
  'This is a test to verify rating notifications work',
  'admin',
  'rating',
  false
);

-- Test 2: Verify it was inserted
SELECT * FROM notifications 
WHERE type = 'rating' 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 3: Show all notification types
SELECT type, COUNT(*) as count 
FROM notifications 
GROUP BY type;

-- =====================================================
-- If all tests pass, rating notifications will work!
-- =====================================================
