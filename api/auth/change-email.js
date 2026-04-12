const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { newEmail } = req.body || {};
  if (!newEmail) return res.status(400).json({ error: 'New email is required' });

  // Get token from cookie
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  if (!match) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get user from token
  const { data: { user }, error: userError } = await supabase.auth.getUser(match[1]);
  if (userError || !user) return res.status(401).json({ error: 'Invalid session' });

  // Update email via admin API (skips confirmation for this private site)
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    email: newEmail,
  });

  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.status(200).json({ success: true });
};
