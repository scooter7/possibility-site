-- ============================================
-- Progress Tracker Tables
-- ============================================

-- 1. Config (single row for launch date)
CREATE TABLE IF NOT EXISTS tracker_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  launch_date DATE NOT NULL DEFAULT '2025-05-01',
  project_name TEXT DEFAULT 'The Possibility',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tracker_config ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tracker_config' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON tracker_config FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Seed single config row
INSERT INTO tracker_config (launch_date, project_name)
SELECT '2025-05-01', 'The Possibility'
WHERE NOT EXISTS (SELECT 1 FROM tracker_config);

-- 2. Milestones
CREATE TABLE IF NOT EXISTS tracker_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  days_before_launch INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#2E9E9E',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracker_milestones_sort ON tracker_milestones (sort_order);

ALTER TABLE tracker_milestones ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tracker_milestones' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON tracker_milestones FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Tasks
CREATE TABLE IF NOT EXISTS tracker_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES tracker_milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in-progress', 'review', 'approved')),
  due_date DATE,
  days_before_launch INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracker_tasks_milestone ON tracker_tasks (milestone_id);
CREATE INDEX IF NOT EXISTS idx_tracker_tasks_status ON tracker_tasks (status);

ALTER TABLE tracker_tasks ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tracker_tasks' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON tracker_tasks FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Comments
CREATE TABLE IF NOT EXISTS tracker_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID REFERENCES tracker_milestones(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tracker_tasks(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT comment_target CHECK (milestone_id IS NOT NULL OR task_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_tracker_comments_milestone ON tracker_comments (milestone_id);
CREATE INDEX IF NOT EXISTS idx_tracker_comments_task ON tracker_comments (task_id);

ALTER TABLE tracker_comments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tracker_comments' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON tracker_comments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- Seed Milestones
-- ============================================
INSERT INTO tracker_milestones (id, title, description, days_before_launch, sort_order, color) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Infrastructure', 'Backend services, analytics, push notifications, payment integration', 120, 1, '#2E9E9E'),
  ('a1000000-0000-0000-0000-000000000002', 'App Development', 'Core meditation player, session tracking, progress system', 100, 2, '#2E9E9E'),
  ('a1000000-0000-0000-0000-000000000003', 'Content Creation', 'Meditation recordings, guided sessions, ambient soundscapes', 90, 3, '#2E9E9E'),
  ('a1000000-0000-0000-0000-000000000004', 'Design & Polish', 'UI refinements, animations, accessibility, dark mode', 60, 4, '#2E9E9E'),
  ('a1000000-0000-0000-0000-000000000005', 'Onboarding Flow', 'First time user experience, tutorial, permissions', 45, 5, '#2E9E9E'),
  ('a1000000-0000-0000-0000-000000000006', 'Marketing & Launch', 'Pre launch campaigns, App Store assets, press kit', 30, 6, '#2E9E9E')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Seed Tasks
-- ============================================

-- Infrastructure
INSERT INTO tracker_tasks (milestone_id, title, status, days_before_launch, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Set up production Supabase instance', 'draft', 120, 1),
  ('a1000000-0000-0000-0000-000000000001', 'Configure analytics pipeline', 'draft', 115, 2),
  ('a1000000-0000-0000-0000-000000000001', 'Push notification service (APNs)', 'draft', 110, 3),
  ('a1000000-0000-0000-0000-000000000001', 'Payment integration (StoreKit 2)', 'draft', 105, 4),
  ('a1000000-0000-0000-0000-000000000001', 'CDN setup for audio content', 'draft', 100, 5)
ON CONFLICT DO NOTHING;

-- App Development
INSERT INTO tracker_tasks (milestone_id, title, status, days_before_launch, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Core meditation player (audio engine)', 'draft', 100, 1),
  ('a1000000-0000-0000-0000-000000000002', 'Session tracking and persistence', 'draft', 95, 2),
  ('a1000000-0000-0000-0000-000000000002', 'Progress and streak system', 'draft', 90, 3),
  ('a1000000-0000-0000-0000-000000000002', 'Favorites and library management', 'draft', 85, 4),
  ('a1000000-0000-0000-0000-000000000002', 'Background audio and lock screen controls', 'draft', 80, 5),
  ('a1000000-0000-0000-0000-000000000002', 'Download manager for offline sessions', 'draft', 75, 6)
ON CONFLICT DO NOTHING;

-- Content Creation
INSERT INTO tracker_tasks (milestone_id, title, status, days_before_launch, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Record core meditation series (10 sessions)', 'draft', 90, 1),
  ('a1000000-0000-0000-0000-000000000003', 'Guided breathwork sessions (5 sessions)', 'draft', 85, 2),
  ('a1000000-0000-0000-0000-000000000003', 'Ambient soundscapes (rain, ocean, forest)', 'draft', 80, 3),
  ('a1000000-0000-0000-0000-000000000003', 'Sleep stories (3 initial)', 'draft', 75, 4),
  ('a1000000-0000-0000-0000-000000000003', 'Audio mastering and normalization', 'draft', 70, 5),
  ('a1000000-0000-0000-0000-000000000003', 'Content metadata and tagging', 'draft', 65, 6)
ON CONFLICT DO NOTHING;

-- Design & Polish
INSERT INTO tracker_tasks (milestone_id, title, status, days_before_launch, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000004', 'Final UI polish pass (all screens)', 'draft', 60, 1),
  ('a1000000-0000-0000-0000-000000000004', 'Micro animations and transitions', 'draft', 55, 2),
  ('a1000000-0000-0000-0000-000000000004', 'Accessibility audit (VoiceOver, Dynamic Type)', 'draft', 50, 3),
  ('a1000000-0000-0000-0000-000000000004', 'Dark mode implementation', 'draft', 45, 4),
  ('a1000000-0000-0000-0000-000000000004', 'App icon and splash screen finalization', 'draft', 40, 5)
ON CONFLICT DO NOTHING;

-- Onboarding Flow
INSERT INTO tracker_tasks (milestone_id, title, status, days_before_launch, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000005', 'Welcome and value proposition screens', 'draft', 45, 1),
  ('a1000000-0000-0000-0000-000000000005', 'Goal selection (sleep, focus, stress, growth)', 'draft', 42, 2),
  ('a1000000-0000-0000-0000-000000000005', 'Notification permission prompt (contextual)', 'draft', 40, 3),
  ('a1000000-0000-0000-0000-000000000005', 'First session guided walkthrough', 'draft', 38, 4),
  ('a1000000-0000-0000-0000-000000000005', 'Personalization quiz', 'draft', 35, 5)
ON CONFLICT DO NOTHING;

-- Marketing & Launch
INSERT INTO tracker_tasks (milestone_id, title, status, days_before_launch, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000006', 'App Store listing (screenshots, description)', 'draft', 30, 1),
  ('a1000000-0000-0000-0000-000000000006', 'Press kit and media assets', 'draft', 28, 2),
  ('a1000000-0000-0000-0000-000000000006', 'Pre launch email campaign', 'draft', 25, 3),
  ('a1000000-0000-0000-0000-000000000006', 'Social media launch content', 'draft', 20, 4),
  ('a1000000-0000-0000-0000-000000000006', 'App Store Optimization (ASO) research', 'draft', 15, 5),
  ('a1000000-0000-0000-0000-000000000006', 'Launch day coordination plan', 'draft', 7, 6)
ON CONFLICT DO NOTHING;

-- ============================================
-- Compute initial target dates from launch date
-- ============================================
UPDATE tracker_milestones SET target_date = (
  SELECT launch_date FROM tracker_config LIMIT 1
) - (days_before_launch * INTERVAL '1 day')
WHERE target_date IS NULL;

UPDATE tracker_tasks SET due_date = (
  SELECT launch_date FROM tracker_config LIMIT 1
) - (days_before_launch * INTERVAL '1 day')
WHERE due_date IS NULL;
