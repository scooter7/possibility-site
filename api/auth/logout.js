module.exports = async (req, res) => {
  res.setHeader('Set-Cookie', [
    'sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    'sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
  ]);

  res.writeHead(302, { Location: '/login' });
  res.end();
};
