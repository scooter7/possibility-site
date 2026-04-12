#!/usr/bin/env node
/**
 * One-time setup script for The Workshop.
 * Creates the ideas table and storage bucket in Supabase.
 *
 * Usage: node api/setup-workshop.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pkrgkzypflfsbwpducjb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env or pass as env var.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setup() {
  console.log('Setting up The Workshop...\n');

  // Test if table exists by querying it
  const { data, error } = await supabase.from('workshop_ideas').select('id').limit(1);

  if (error && error.code === '42P01') {
    console.log('Table "workshop_ideas" does not exist yet.');
    console.log('\nPlease run this SQL in your Supabase SQL Editor:\n');
    console.log(`
-- The Workshop: Ideas table
CREATE TABLE workshop_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  audio_url TEXT,
  audio_duration REAL,
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'text' CHECK (source IN ('voice', 'text', 'transcript')),
  verified BOOLEAN DEFAULT false,
  verification JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workshop_ideas_created ON workshop_ideas (created_at DESC);
CREATE INDEX idx_workshop_ideas_tags ON workshop_ideas USING GIN (tags);

-- Full-text search
ALTER TABLE workshop_ideas ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;
CREATE INDEX idx_workshop_ideas_fts ON workshop_ideas USING GIN (fts);

-- RLS: allow service_role full access, block anon
ALTER TABLE workshop_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON workshop_ideas
  FOR ALL USING (true) WITH CHECK (true);
`);
  } else if (error) {
    console.log('Error checking table:', error.message);
  } else {
    console.log('Table "workshop_ideas" already exists.');
  }

  // 2. Create storage bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === 'workshop-audio');

  if (!exists) {
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('workshop-audio', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
    });
    if (bucketError) {
      console.log('Error creating bucket:', bucketError.message);
    } else {
      console.log('Created storage bucket: workshop-audio');
    }
  } else {
    console.log('Storage bucket "workshop-audio" already exists.');
  }

  console.log('\nSetup complete!');
}

setup().catch(console.error);
