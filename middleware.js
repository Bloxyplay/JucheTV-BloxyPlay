// Vercel Edge Middleware
// Mobile visitors get redirected to clean /m/... URLs (e.g. /m/, /m/kctv)
// Desktop visitors stay on the root URL and get the desktop-optimized pages.

export const config = {
  // Runs on every request except: paths already under /m/, and any path
  // with a file extension (assets, and .html requests get handled by
  // Vercel's cleanUrls redirect before hitting this again as extensionless).
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

  // Already on a /m/ path — don't touch it.
  if (url.pathname === '/m' || url.pathname.startsWith('/m/')) {
    return;
  }

  // '/'        -> '/m/'
  // '/kctv'    -> '/m/kctv'
  // '/schedules' -> '/m/schedules'
  url.pathname = url.pathname === '/' ? '/m/' : '/m' + url.pathname;

  return Response.redirect(url, 307);
}
