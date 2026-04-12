-- Copy Review tables
-- Tracks status per screenshot and threaded comments for copy feedback

create table if not exists copy_review_screenshots (
  id uuid primary key default gen_random_uuid(),
  flow text not null,
  filename text not null,
  status text not null default 'open' check (status in ('open','progress','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (flow, filename)
);

create index if not exists copy_review_screenshots_flow_idx
  on copy_review_screenshots (flow);

create table if not exists copy_review_comments (
  id uuid primary key default gen_random_uuid(),
  screenshot_id uuid not null references copy_review_screenshots(id) on delete cascade,
  author_id uuid,
  author_email text,
  author_name text,
  body text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists copy_review_comments_screenshot_idx
  on copy_review_comments (screenshot_id, created_at);
