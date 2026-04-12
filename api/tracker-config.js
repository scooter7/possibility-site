/**
 * Tracker Config API
 * GET  /api/tracker-config         - Get launch date and project config
 * PATCH /api/tracker-config        - Update launch date (recalculates all dates)
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('tracker_config')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'PATCH') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const { launch_date, project_name } = req.body;
      const updates = { updated_at: new Date().toISOString() };
      if (launch_date) updates.launch_date = launch_date;
      if (project_name) updates.project_name = project_name;

      // Get existing config row ID first
      const { data: existing } = await supabase.from('tracker_config').select('id').limit(1).single();
      if (!existing) return res.status(500).json({ error: 'No config row found' });

      // Update config
      const { data: config, error } = await supabase
        .from('tracker_config')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      // Recalculate all milestone target_dates and task due_dates
      if (launch_date) {
        const ld = new Date(launch_date + 'T00:00:00');

        const { data: milestones } = await supabase.from('tracker_milestones').select('id, days_before_launch');
        const mUpdates = (milestones || []).map(m => {
          const td = new Date(ld);
          td.setDate(td.getDate() - m.days_before_launch);
          return supabase.from('tracker_milestones').update({
            target_date: td.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          }).eq('id', m.id);
        });
        await Promise.all(mUpdates);

        const { data: tasks } = await supabase.from('tracker_tasks').select('id, days_before_launch');
        const tUpdates = (tasks || []).map(t => {
          const dd = new Date(ld);
          dd.setDate(dd.getDate() - t.days_before_launch);
          return supabase.from('tracker_tasks').update({
            due_date: dd.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          }).eq('id', t.id);
        });
        await Promise.all(tUpdates);
      }

      return res.status(200).json(config);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Tracker Config error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
