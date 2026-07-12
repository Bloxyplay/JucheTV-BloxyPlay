// Vercel Edge Middleware
// Mobile visitors get redirected to /m/... (URL bar shows /m/)
// Desktop visitors stay on the root URL and get the desktop-optimized pages.

export const config = {
  // Runs on every request except: files already under /m/, static assets
  // (anything with a file extension), and Next/Vercel internals.
  matcher: ['/((?!m/|_next/|api/|.*\\..*).*)'],
};

const MOBILE_UA = /Android|iPhone|iPod|IEMobile|BlackBerry|Opera Mini|Mobile(?!.*iPad)/i;

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const isMobile = MOBILE_UA.test(ua);

  if (!isMobile) {
    // Desktop / tablet: do nothing, serve the normal root-level pages.
    return;
  }

  const url = new URL(request.url);

  // Avoid double-prefixing and let it fall through if already under /m/
  if (url.pathname.startsWith('/m/')) {
    return;
  }

  url.pathname = url.pathname === '/' ? '/m/index.html' : '/m' + url.pathname;

  return Response.redirect(url, 307);
}
