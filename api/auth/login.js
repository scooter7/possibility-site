const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check if user must change password on first login
  const mustChange = data.user?.user_metadata?.must_change_password === true;

  if (mustChange) {
    // Don't set session cookies yet. Return the token so the client
    // can call /api/auth/change-password with it.
    return res.status(200).json({
      mustChangePassword: true,
      accessToken: data.session.access_token,
    });
  }

  const cookieOpts = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800';

  res.setHeader('Set-Cookie', [
    `sb-access-token=${data.session.access_token}; ${cookieOpts}`,
    `sb-refresh-token=${data.session.refresh_token}; ${cookieOpts}`,
  ]);

  return res.status(200).json({ success: true });
};
