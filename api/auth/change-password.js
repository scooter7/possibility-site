const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { newPassword, accessToken } = req.body || {};

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Accept token from body (first-login flow) or cookie (settings flow)
  let token = accessToken;
  if (!token) {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/sb-access-token=([^;]+)/);
    token = match ? match[1] : null;
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Use service role to update user and clear the flag
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get user ID from the access token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  // Update password and clear the must_change_password flag
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
    user_metadata: { must_change_password: false },
  });

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update password' });
  }

  // Re-authenticate with new password to get fresh tokens
  const anonSupabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data, error: signInError } = await anonSupabase.auth.signInWithPassword({
    email: user.email,
    password: newPassword,
  });

  if (signInError) {
    return res.status(500).json({ error: 'Password changed but re-auth failed. Please sign in again.' });
  }

  const cookieOpts = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800';

  res.setHeader('Set-Cookie', [
    `sb-access-token=${data.session.access_token}; ${cookieOpts}`,
    `sb-refresh-token=${data.session.refresh_token}; ${cookieOpts}`,
  ]);

  return res.status(200).json({ success: true });
};
