/**
 * Copy Review Screenshots API
 * GET   /api/copy-review-screenshots                       - List all screenshot rows
 * POST  /api/copy-review-screenshots                       - Upsert one (flow + filename) and return row
 * PATCH /api/copy-review-screenshots                       - Update status { id, status }
 */

const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getUser(req, supabase) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  if (!match) return null;
  const { data: { user }, error } = await supabase.auth.getUser(match[1]);
  if (error || !user) return null;
  return user;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('copy_review_screenshots')
        .select('*');
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const { flow, filename } = req.body || {};
      if (!flow || !filename) return res.status(400).json({ error: 'flow and filename required' });

      const { data: existing } = await supabase
        .from('copy_review_screenshots')
        .select('*')
        .eq('flow', flow)
        .eq('filename', filename)
        .maybeSingle();

      if (existing) return res.status(200).json(existing);

      const { data, error } = await supabase
        .from('copy_review_screenshots')
        .insert({ flow, filename })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PATCH') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const { id, status } = req.body || {};
      if (!id || !status) return res.status(400).json({ error: 'id and status required' });
      if (!['open', 'progress', 'resolved'].includes(status)) {
        return res.status(400).json({ error: 'invalid status' });
      }

      const { data, error } = await supabase
        .from('copy_review_screenshots')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('copy-review-screenshots error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
