-- ============================================
-- Tracker V2: Dependencies + Simplified Status
-- ============================================

-- Add dependency column (task depends on another task)
ALTER TABLE tracker_tasks ADD COLUMN IF NOT EXISTS depends_on UUID REFERENCES tracker_tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tracker_tasks_depends ON tracker_tasks (depends_on);

-- Add completed_at timestamp for velocity tracking
ALTER TABLE tracker_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

-- Drop the old check constraint first
ALTER TABLE tracker_tasks DROP CONSTRAINT IF EXISTS tracker_tasks_status_check;

-- Migrate existing data BEFORE adding new constraint
UPDATE tracker_tasks SET status = 'todo' WHERE status IN ('draft', 'in-progress', 'review');
UPDATE tracker_tasks SET status = 'done', completed_at = updated_at WHERE status = 'approved';

-- Now add the new constraint (all rows are already migrated)
ALTER TABLE tracker_tasks ADD CONSTRAINT tracker_tasks_status_check CHECK (status IN ('todo', 'done'));

-- Drop effort_hours (no longer needed)
ALTER TABLE tracker_tasks DROP COLUMN IF EXISTS effort_hours;

-- Drop priority (simplifying)
ALTER TABLE tracker_tasks DROP COLUMN IF EXISTS priority;
