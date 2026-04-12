/**
 * Copy Review Comments API
 * GET    /api/copy-review-comments?screenshot_id=uuid  - Comments for one screenshot
 * GET    /api/copy-review-comments                     - All comments (counts/dashboards)
 * POST   /api/copy-review-comments                     - Create comment { screenshot_id, body }
 * PATCH  /api/copy-review-comments                     - Toggle done { id, done }
 * DELETE /api/copy-review-comments?id=uuid             - Delete own comment
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

function nameFromUser(user) {
  const meta = user.user_metadata || {};
  return meta.name || meta.full_name || (user.email ? user.email.split('@')[0] : 'User');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      const { screenshot_id } = req.query;
      let query = supabase
        .from('copy_review_comments')
        .select('*')
        .order('created_at', { ascending: true });
      if (screenshot_id) query = query.eq('screenshot_id', screenshot_id);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const { screenshot_id, body } = req.body || {};
      if (!screenshot_id) return res.status(400).json({ error: 'screenshot_id required' });
      if (!body || !body.trim()) return res.status(400).json({ error: 'body required' });

      const { data, error } = await supabase
        .from('copy_review_comments')
        .insert({
          screenshot_id,
          body: body.trim(),
          author_id: user.id,
          author_email: user.email,
          author_name: nameFromUser(user)
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PATCH') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const { id, done } = req.body || {};
      if (!id || typeof done !== 'boolean') return res.status(400).json({ error: 'id and done required' });

      const { data, error } = await supabase
        .from('copy_review_comments')
        .update({ done })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id query param required' });

      const { data: row } = await supabase
        .from('copy_review_comments')
        .select('author_id')
        .eq('id', id)
        .single();

      if (!row) return res.status(404).json({ error: 'Not found' });
      if (row.author_id !== user.id) return res.status(403).json({ error: 'Can only delete your own comments' });

      const { error } = await supabase
        .from('copy_review_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('copy-review-comments error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
