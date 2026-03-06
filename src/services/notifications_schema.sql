-- ========================================
-- NOTIFICATION SYSTEM SQL SCHEMA FOR SUPABASE
-- ========================================

-- Create notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('complaint_update', 'complaint_assigned', 'complaint_resolved', 'announcement', 'system', 'status_change')),
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('student', 'staff', 'admin')),
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  related_complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
  related_announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create indexes for performance
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_recipient_type ON notifications(recipient_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_related_complaint_id ON notifications(related_complaint_id);
CREATE INDEX idx_notifications_related_announcement_id ON notifications(related_announcement_id);

-- Create RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
FOR SELECT USING (auth.uid() = recipient_id);

-- Allow admins to read all notifications
CREATE POLICY "Admins can read all notifications" ON notifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = recipient_id);

-- Allow admins to create notifications
CREATE POLICY "Admins can create notifications" ON notifications
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow admins to delete notifications
CREATE POLICY "Admins can delete notifications" ON notifications
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ========================================
-- TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- ========================================

-- Function to send notifications when complaints are updated
CREATE OR REPLACE FUNCTION send_complaint_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify assigned staff when complaint is assigned to them
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR NEW.assigned_to != OLD.assigned_to) THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      recipient_type,
      recipient_id,
      related_complaint_id,
      priority
    ) VALUES (
      'New Complaint Assigned',
      'You have been assigned a new complaint: ' || NEW.title,
      'complaint_assigned',
      'staff',
      NEW.assigned_to,
      NEW.id,
      'high'
    );
  END IF;

  -- Notify admin when new complaint is created
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      recipient_type,
      recipient_id,
      related_complaint_id,
      priority
    ) VALUES (
      'New Complaint Received',
      'A new complaint has been submitted: ' || NEW.title,
      'complaint_update',
      'admin',
      (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
      NEW.id,
      'normal'
    );
  END IF;

  -- Notify admin when complaint status changes to Overdue
  IF NEW.status = 'Overdue' AND (OLD.status IS NULL OR OLD.status != 'Overdue') THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      recipient_type,
      recipient_id,
      related_complaint_id,
      priority
    ) VALUES (
      'Urgent: Complaint Overdue',
      'Complaint "' || NEW.title || '" is now overdue and requires immediate attention',
      'status_change',
      'admin',
      (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
      NEW.id,
      'urgent'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for complaint notifications
DROP TRIGGER IF EXISTS trigger_complaint_notifications ON complaints;
CREATE TRIGGER trigger_complaint_notifications
  AFTER INSERT OR UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION send_complaint_notifications();

-- Function to send announcement notifications
CREATE OR REPLACE FUNCTION send_announcement_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all users when a new announcement is created
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    -- Notify students
    INSERT INTO notifications (
      title,
      message,
      type,
      recipient_type,
      recipient_id,
      related_announcement_id,
      priority
    )
    SELECT 
      'New Announcement: ' || NEW.title,
      SUBSTRING(NEW.content FROM 1 FOR 100) || '...',
      'announcement',
      'student',
      p.id,
      NEW.id,
      NEW.priority
    FROM profiles p WHERE p.role = 'student';

    -- Notify staff
    INSERT INTO notifications (
      title,
      message,
      type,
      recipient_type,
      recipient_id,
      related_announcement_id,
      priority
    )
    SELECT 
      'New Announcement: ' || NEW.title,
      SUBSTRING(NEW.content FROM 1 FOR 100) || '...',
      'announcement',
      'staff',
      p.id,
      NEW.id,
      NEW.priority
    FROM profiles p WHERE p.role = 'staff';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for announcement notifications
DROP TRIGGER IF EXISTS trigger_announcement_notifications ON announcements;
CREATE TRIGGER trigger_announcement_notifications
  AFTER INSERT ON announcements
  FOR EACH ROW EXECUTE FUNCTION send_announcement_notifications();

-- ========================================
-- VIEWS FOR EASY QUERYING
-- ========================================

-- View to get unread notification count for current user
CREATE VIEW user_unread_notifications_count AS
SELECT 
  COUNT(*) as unread_count
FROM notifications 
WHERE recipient_id = auth.uid() 
  AND is_read = false;

-- View to get recent notifications for current user
CREATE VIEW user_recent_notifications AS
SELECT 
  id,
  title,
  message,
  type,
  recipient_type,
  related_complaint_id,
  related_announcement_id,
  is_read,
  created_at,
  priority
FROM notifications 
WHERE recipient_id = auth.uid()
ORDER BY created_at DESC
LIMIT 50;

-- ========================================
-- FUNCTIONS FOR MANUAL NOTIFICATION CREATION
-- ========================================

-- Function for admins to send manual notifications to specific users
CREATE OR REPLACE FUNCTION send_manual_notification(
  p_title VARCHAR(200),
  p_message TEXT,
  p_type VARCHAR(50),
  p_recipient_id UUID,
  p_related_complaint_id INTEGER DEFAULT NULL,
  p_related_announcement_id INTEGER DEFAULT NULL,
  p_priority VARCHAR(20) DEFAULT 'normal'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_recipient_type VARCHAR(20);
BEGIN
  -- Get recipient type
  SELECT role INTO v_recipient_type FROM profiles WHERE id = p_recipient_id;
  
  IF v_recipient_type IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO notifications (
    title, message, type, recipient_type, recipient_id,
    related_complaint_id, related_announcement_id, priority
  ) VALUES (
    p_title, p_message, p_type, v_recipient_type, p_recipient_id,
    p_related_complaint_id, p_related_announcement_id, p_priority
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admins to send broadcast notifications
CREATE OR REPLACE FUNCTION send_broadcast_notification(
  p_title VARCHAR(200),
  p_message TEXT,
  p_type VARCHAR(50),
  p_recipient_type VARCHAR(20),
  p_priority VARCHAR(20) DEFAULT 'normal'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert notifications for all users of specified type
  INSERT INTO notifications (
    title, message, type, recipient_type, recipient_id, priority
  )
  SELECT 
    p_title, p_message, p_type, p_recipient_type, p.id, p_priority
  FROM profiles p 
  WHERE p.role = p_recipient_type;

  -- Return number of notifications sent
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SAMPLE DATA (OPTIONAL)
-- ========================================

-- Insert some sample notifications (uncomment if needed)
-- INSERT INTO notifications (title, message, type, recipient_type, recipient_id, priority) VALUES
-- ('Welcome to Student Redressal', 'Your account has been successfully created', 'system', 'student', 'user-uuid-here', 'normal'),
-- ('New Feature Available', 'Check out our new complaint tracking system', 'system', 'student', 'user-uuid-here', 'normal');

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- END OF NOTIFICATION SYSTEM SCHEMA
-- ========================================