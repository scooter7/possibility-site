-- ============================================
-- Tracker: Four-state status (draft, in-progress, review, approved)
-- Matches frontend status workflow
-- ============================================

-- Drop old constraint
ALTER TABLE tracker_tasks DROP CONSTRAINT IF EXISTS tracker_tasks_status_check;

-- Migrate old statuses to new ones
UPDATE tracker_tasks SET status = 'draft' WHERE status = 'not-started';
UPDATE tracker_tasks SET status = 'approved' WHERE status = 'done';

-- Add new constraint matching frontend statuses
ALTER TABLE tracker_tasks ADD CONSTRAINT tracker_tasks_status_check
  CHECK (status IN ('draft', 'in-progress', 'review', 'approved'));
