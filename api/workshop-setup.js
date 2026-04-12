/**
 * One-time setup endpoint for The Workshop.
 * Creates the workshop_ideas table in Supabase.
 * Call once: POST /api/workshop-setup
 */

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-workshop-pin');
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const pin = req.headers['x-workshop-pin'];
  if (pin !== process.env.IDEAS_PIN) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Use the Supabase SQL endpoint (available with service role)
  const sql = `
    CREATE TABLE IF NOT EXISTS workshop_ideas (
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

    CREATE INDEX IF NOT EXISTS idx_workshop_ideas_created ON workshop_ideas (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_workshop_ideas_tags ON workshop_ideas USING GIN (tags);
  `;

  // Execute via the postgres REST endpoint
  const resp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!resp.ok) {
    // Fallback: try creating by inserting and letting PostgREST auto-detect
    // The table needs to be created via SQL editor
    return res.status(200).json({
      message: 'Cannot run DDL via REST API. Please run this SQL in your Supabase SQL Editor:',
      sql: sql.trim()
    });
  }

  return res.status(200).json({ success: true, message: 'Table created' });
};
