export const config = {
  matcher: ['/((?!_vercel|favicon\\.ico).*)'],
};

const PUBLIC_PATHS = ['/login', '/api/'];
const STATIC_EXT = /\.(jpg|jpeg|png|svg|gif|webp|ico|css|js|woff|woff2|ttf|eot|mp3|mp4|webm|json|html)$/i;

export default async function middleware(request) {
  try {
    const { pathname } = new URL(request.url);

    // Allow static assets
    if (STATIC_EXT.test(pathname)) {
      return;
    }

    // Allow public paths
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      return;
    }

    // Allow robots.txt
    if (pathname === '/robots.txt') {
      return;
    }

    // If Supabase env vars are missing, allow through
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return;
    }

    // Check auth cookie
    const cookie = request.headers.get('cookie') || '';
    const tokenMatch = cookie.match(/sb-access-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return Response.redirect(new URL('/login', request.url), 302);
    }

    // Verify token with Supabase
    const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.SUPABASE_ANON_KEY,
      },
    });

    if (!res.ok) {
      const redirect = Response.redirect(new URL('/login', request.url), 302);
      redirect.headers.append('Set-Cookie', 'sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
      redirect.headers.append('Set-Cookie', 'sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
      return redirect;
    }

    return;
  } catch (e) {
    // Fail open - don't block the site if auth check fails
    return;
  }
}
