-- ========================================
-- ADD USER_ID FIELD TO COMPLAINTS TABLE
-- ========================================

-- Add user_id column to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Update existing complaints to link to profiles based on registration_number
-- This assumes you have a way to match registration_number to profiles
-- You may need to adjust this based on your actual data structure

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);

-- Update the trigger function to include student notifications
CREATE OR REPLACE FUNCTION send_complaint_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify student when their complaint status changes (if user_id exists)
  IF NEW.status != OLD.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO notifications (
      title, 
      message, 
      type, 
      recipient_type, 
      recipient_id, 
      related_complaint_id,
      priority
    ) VALUES (
      'Complaint Status Updated',
      'Your complaint "' || NEW.title || '" has been updated to: ' || NEW.status,
      'complaint_update',
      'student',
      NEW.user_id,
      NEW.id,
      CASE 
        WHEN NEW.status = 'Resolved' THEN 'normal'
        WHEN NEW.status = 'Overdue' THEN 'urgent'
        ELSE 'normal'
      END
    );
  END IF;

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

-- Recreate the trigger with the updated function
DROP TRIGGER IF EXISTS trigger_complaint_notifications ON complaints;
CREATE TRIGGER trigger_complaint_notifications
  AFTER INSERT OR UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION send_complaint_notifications();

-- ========================================
-- SAMPLE DATA UPDATE (Optional)
-- ========================================

-- If you want to link existing complaints to users, you can run this:
-- UPDATE complaints SET user_id = (
--   SELECT id FROM profiles 
--   WHERE profiles.registration_number = complaints.registration_number 
--   LIMIT 1
-- ) WHERE user_id IS NULL;

-- ========================================
-- END OF USER_ID ADDITION SCRIPT
-- ========================================