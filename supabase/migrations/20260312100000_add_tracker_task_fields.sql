-- Add priority and effort fields to tracker_tasks
ALTER TABLE tracker_tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE tracker_tasks ADD COLUMN IF NOT EXISTS effort_hours NUMERIC(5,1) DEFAULT NULL;
