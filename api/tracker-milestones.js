/**
 * Tracker Milestones API
 * GET    /api/tracker-milestones              - List all milestones with task counts
 * POST   /api/tracker-milestones              - Create milestone
 * PATCH  /api/tracker-milestones              - Update milestone
 * DELETE /api/tracker-milestones?id=uuid      - Delete milestone
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      const { data: milestones, error } = await supabase
        .from('tracker_milestones')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Get task counts per milestone
      const { data: tasks } = await supabase
        .from('tracker_tasks')
        .select('milestone_id, status');

      const counts = {};
      (tasks || []).forEach(t => {
        if (!counts[t.milestone_id]) counts[t.milestone_id] = { total: 0, approved: 0 };
        counts[t.milestone_id].total++;
        if (t.status === 'approved') counts[t.milestone_id].approved++;
      });

      const result = milestones.map(m => ({
        ...m,
        task_count: counts[m.id]?.total || 0,
        approved_count: counts[m.id]?.approved || 0
      }));

      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const { title, description, days_before_launch, sort_order, color } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

      // Get launch date to compute target_date
      const { data: config } = await supabase.from('tracker_config').select('launch_date').limit(1).single();
      if (!config) return res.status(500).json({ error: 'No config found. Set a launch date first.' });
      const ld = new Date(config.launch_date + 'T00:00:00');
      const td = new Date(ld);
      td.setDate(td.getDate() - (days_before_launch || 0));

      const { data, error } = await supabase
        .from('tracker_milestones')
        .insert({
          title: title.trim(),
          description: description || null,
          days_before_launch: days_before_launch || 0,
          target_date: td.toISOString().split('T')[0],
          sort_order: sort_order || 0,
          color: color || '#2E9E9E'
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PATCH') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const allowed = { updated_at: new Date().toISOString() };
      if (updates.title) allowed.title = updates.title.trim();
      if (updates.description !== undefined) allowed.description = updates.description;
      if (updates.days_before_launch !== undefined) {
        allowed.days_before_launch = updates.days_before_launch;
        const { data: config } = await supabase.from('tracker_config').select('launch_date').limit(1).single();
        if (!config) return res.status(500).json({ error: 'No config found' });
        const ld = new Date(config.launch_date + 'T00:00:00');
        const td = new Date(ld);
        td.setDate(td.getDate() - updates.days_before_launch);
        allowed.target_date = td.toISOString().split('T')[0];
      }
      if (updates.sort_order !== undefined) allowed.sort_order = updates.sort_order;
      if (updates.color) allowed.color = updates.color;

      const { data, error } = await supabase
        .from('tracker_milestones')
        .update(allowed)
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

      const { error } = await supabase
        .from('tracker_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Tracker Milestones error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
