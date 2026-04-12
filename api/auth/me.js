const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);

  if (!match) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error } = await supabase.auth.getUser(match[1]);

  if (error || !user) return res.status(401).json({ error: 'Invalid session' });

  return res.status(200).json({
    email: user.email,
    id: user.id,
  });
};
