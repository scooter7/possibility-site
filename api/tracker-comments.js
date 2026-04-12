/**
 * Tracker Comments API
 * GET    /api/tracker-comments?task_id=uuid         - Comments for a task
 * GET    /api/tracker-comments?milestone_id=uuid     - Comments for a milestone
 * POST   /api/tracker-comments                       - Create comment
 * DELETE /api/tracker-comments?id=uuid               - Delete own comment
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      const { task_id, milestone_id } = req.query;

      let query = supabase
        .from('tracker_comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (task_id) query = query.eq('task_id', task_id);
      else if (milestone_id) query = query.eq('milestone_id', milestone_id);
      else return res.status(400).json({ error: 'task_id or milestone_id required' });

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const { task_id, milestone_id, content } = req.body;
      if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });
      if (!task_id && !milestone_id) return res.status(400).json({ error: 'task_id or milestone_id required' });

      const { data, error } = await supabase
        .from('tracker_comments')
        .insert({
          task_id: task_id || null,
          milestone_id: milestone_id || null,
          content: content.trim(),
          author_email: user.email,
          author_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id query param required' });

      // Only allow author to delete their own comment
      const { data: comment } = await supabase
        .from('tracker_comments')
        .select('author_id')
        .eq('id', id)
        .single();

      if (!comment) return res.status(404).json({ error: 'Comment not found' });
      if (comment.author_id !== user.id) return res.status(403).json({ error: 'Can only delete your own comments' });

      const { error } = await supabase
        .from('tracker_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Tracker Comments error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
