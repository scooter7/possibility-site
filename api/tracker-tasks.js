/**
 * Tracker Tasks API (V2)
 * GET    /api/tracker-tasks?milestone_id=uuid  - List tasks for milestone
 * POST   /api/tracker-tasks                    - Create task
 * PATCH  /api/tracker-tasks                    - Update task
 * DELETE /api/tracker-tasks?id=uuid            - Delete task
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
      const { milestone_id } = req.query;

      let query = supabase
        .from('tracker_tasks')
        .select('*')
        .order('sort_order', { ascending: true });

      if (milestone_id) query = query.eq('milestone_id', milestone_id);

      const { data: tasks, error } = await query;
      if (error) throw error;

      // Get comment counts per task
      const taskIds = tasks.map(t => t.id);
      let commentCounts = {};
      if (taskIds.length > 0) {
        const { data: comments } = await supabase
          .from('tracker_comments')
          .select('task_id')
          .in('task_id', taskIds);

        (comments || []).forEach(c => {
          if (c.task_id) {
            commentCounts[c.task_id] = (commentCounts[c.task_id] || 0) + 1;
          }
        });
      }

      const result = tasks.map(t => ({
        ...t,
        comment_count: commentCounts[t.id] || 0
      }));

      return res.status(200).json(result);
    }

    if (req.method === 'POST') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const { milestone_id, title, description, assignee, days_before_launch, sort_order, depends_on, priority, effort_hours } = req.body;
      if (!milestone_id) return res.status(400).json({ error: 'milestone_id is required' });
      if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

      // Compute due_date from launch date
      const { data: config } = await supabase.from('tracker_config').select('launch_date').limit(1).single();
      if (!config) return res.status(500).json({ error: 'No config found. Set a launch date first.' });
      const ld = new Date(config.launch_date + 'T00:00:00');
      const dd = new Date(ld);
      dd.setDate(dd.getDate() - (days_before_launch || 0));

      const { data, error } = await supabase
        .from('tracker_tasks')
        .insert({
          milestone_id,
          title: title.trim(),
          description: description || null,
          assignee: assignee || null,
          status: 'draft',
          days_before_launch: days_before_launch || 0,
          due_date: dd.toISOString().split('T')[0],
          sort_order: sort_order || 0,
          depends_on: depends_on || null,
          priority: priority || 'medium',
          effort_hours: effort_hours || null,
          created_by: user.email
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
      if (updates.assignee !== undefined) allowed.assignee = updates.assignee;
      if (updates.depends_on !== undefined) allowed.depends_on = updates.depends_on;
      if (updates.status) {
        allowed.status = updates.status;
        if (updates.status === 'approved') {
          allowed.completed_at = new Date().toISOString();
        } else {
          allowed.completed_at = null;
        }
      }
      if (updates.days_before_launch !== undefined) {
        allowed.days_before_launch = updates.days_before_launch;
        const { data: config } = await supabase.from('tracker_config').select('launch_date').limit(1).single();
        if (!config) return res.status(500).json({ error: 'No config found' });
        const ld = new Date(config.launch_date + 'T00:00:00');
        const dd = new Date(ld);
        dd.setDate(dd.getDate() - updates.days_before_launch);
        allowed.due_date = dd.toISOString().split('T')[0];
      }
      if (updates.sort_order !== undefined) allowed.sort_order = updates.sort_order;
      if (updates.priority) allowed.priority = updates.priority;
      if (updates.effort_hours !== undefined) allowed.effort_hours = updates.effort_hours;

      const { data, error } = await supabase
        .from('tracker_tasks')
        .update(allowed)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If task was completed early, cascade dates for dependent tasks
      if (updates.status === 'approved') {
        await cascadeDates(supabase, id);
      }

      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const user = await getUser(req, supabase);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });

      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id query param required' });

      // Clear depends_on references first
      await supabase
        .from('tracker_tasks')
        .update({ depends_on: null })
        .eq('depends_on', id);

      const { error } = await supabase
        .from('tracker_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Tracker Tasks error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};

/**
 * When a task completes early, shift dependent tasks forward.
 * If task was due May 10 but completed May 7 (3 days early),
 * all tasks that depend on it shift 3 days earlier.
 * This cascades recursively through the dependency chain.
 */
async function cascadeDates(supabase, completedTaskId) {
  const { data: task } = await supabase
    .from('tracker_tasks')
    .select('due_date, completed_at')
    .eq('id', completedTaskId)
    .single();

  if (!task || !task.completed_at || !task.due_date) return;

  const dueDate = new Date(task.due_date + 'T00:00:00');
  const completedDate = new Date(task.completed_at);
  completedDate.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((dueDate - completedDate) / 86400000);
  if (daysDiff <= 0) return; // Not early, no cascade

  // Find all tasks that depend on this one and are not done
  const { data: dependents } = await supabase
    .from('tracker_tasks')
    .select('id, due_date, days_before_launch')
    .eq('depends_on', completedTaskId)
    .neq('status', 'approved');

  if (!dependents || !dependents.length) return;

  const { data: config } = await supabase
    .from('tracker_config')
    .select('launch_date')
    .limit(1)
    .single();

  if (!config) return;

  for (const dep of dependents) {
    if (!dep.due_date) continue;
    const oldDue = new Date(dep.due_date + 'T00:00:00');
    const newDue = new Date(oldDue);
    newDue.setDate(newDue.getDate() - daysDiff);

    const ld = new Date(config.launch_date + 'T00:00:00');
    const newDbl = Math.round((ld - newDue) / 86400000);

    await supabase
      .from('tracker_tasks')
      .update({
        due_date: newDue.toISOString().split('T')[0],
        days_before_launch: newDbl,
        updated_at: new Date().toISOString()
      })
      .eq('id', dep.id);

    // Recursively cascade
    await cascadeDates(supabase, dep.id);
  }
}
