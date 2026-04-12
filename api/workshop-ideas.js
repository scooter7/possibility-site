/**
 * Workshop Ideas API - CRUD operations
 * GET    /api/workshop-ideas?page=1&limit=20&tag=x&q=search&category=idea&priority=high
 * POST   /api/workshop-ideas  { content, audio_url?, audio_duration?, tags[], source, category }
 * PATCH  /api/workshop-ideas  { id, tags?, content?, verified?, verification?, synthesis?, notes?, priority?, category? }
 * DELETE /api/workshop-ideas?id=uuid
 */

const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-workshop-pin');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = getSupabase();

  try {
    // GET - list ideas
    if (req.method === 'GET') {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;
      const { tag, q, verified, category, priority } = req.query;

      let query = supabase
        .from('workshop_ideas')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (tag) query = query.contains('tags', [tag]);
      if (q) query = query.textSearch('fts', q, { type: 'websearch' });
      if (verified === 'true') query = query.eq('verified', true);
      if (verified === 'false') query = query.eq('verified', false);
      if (category) query = query.eq('category', category);
      if (priority) query = query.eq('priority', priority);

      const { data: ideas, error, count } = await query;
      if (error) throw error;

      // Get all unique tags + category counts
      const { data: allIdeas } = await supabase
        .from('workshop_ideas')
        .select('tags, category');

      const tagSet = new Set();
      const categoryCounts = { idea: 0, note: 0, meeting: 0 };
      (allIdeas || []).forEach(i => {
        (i.tags || []).forEach(t => tagSet.add(t));
        if (i.category && categoryCounts[i.category] !== undefined) categoryCounts[i.category]++;
      });

      return res.status(200).json({
        ideas,
        tags: Array.from(tagSet).sort(),
        categoryCounts,
        total: count,
        page,
        limit
      });
    }

    // POST - create idea
    if (req.method === 'POST') {
      const { content, audio_url, audio_duration, tags, source, category, synthesis, priority } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const { doc_url, doc_name } = req.body;

      const { data, error } = await supabase
        .from('workshop_ideas')
        .insert({
          content: content.trim(),
          audio_url: audio_url || null,
          audio_duration: audio_duration || null,
          doc_url: doc_url || null,
          doc_name: doc_name || null,
          tags: (tags || []).map(t => t.toLowerCase().trim()).filter(Boolean),
          source: source || 'text',
          category: category || 'idea',
          synthesis: synthesis || null,
          priority: priority || 'medium'
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // PATCH - update idea
    if (req.method === 'PATCH') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const allowed = {};
      if (updates.tags) allowed.tags = updates.tags.map(t => t.toLowerCase().trim()).filter(Boolean);
      if (updates.content) allowed.content = updates.content.trim();
      if (typeof updates.verified === 'boolean') allowed.verified = updates.verified;
      if (updates.verification) allowed.verification = updates.verification;
      if (updates.synthesis) allowed.synthesis = updates.synthesis;
      if (updates.notes !== undefined) allowed.notes = updates.notes;
      if (updates.priority) allowed.priority = updates.priority;
      if (updates.category) allowed.category = updates.category;
      allowed.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('workshop_ideas')
        .update(allowed)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    // DELETE - remove idea
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id query param required' });

      const { data: idea } = await supabase
        .from('workshop_ideas')
        .select('audio_url')
        .eq('id', id)
        .single();

      if (idea?.audio_url) {
        const filename = idea.audio_url.split('/').pop()?.split('?')[0];
        if (filename) {
          await supabase.storage.from('workshop-audio').remove([filename]);
        }
      }

      const { error } = await supabase
        .from('workshop_ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Workshop Ideas error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
};
