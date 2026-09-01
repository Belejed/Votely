import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt, AdminSession } from './lib/session';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';
  const path = url.pathname;

  // Skip static files, API routes, and Next.js internals
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/favicon.ico') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  // Detect subdomain/tenant
  // Local development hostnames: localhost:3000, school-a.localhost:3000
  // Production hostnames: votely.app, school-a.votely.app
  let hostnameParts = hostname.split('.');
  
  // Clean port numbers if they exist (e.g., localhost:3000)
  hostnameParts = hostnameParts.map((p: any) => p.split(':')[0]);

  let subdomain: string | null = null;

  if (hostnameParts.length > 1) {
    // For localhost: ["school-a", "localhost"]
    // For production: ["school-a", "votely", "app"]
    const firstPart = hostnameParts[0];
    if (firstPart !== 'localhost' && firstPart !== 'www' && firstPart !== 'votely') {
      subdomain = firstPart;
    }
  }

  // Rewrite subdomain requests to organization routes
  // e.g., school-a.localhost:3000/dashboard -> /org/school-a/dashboard
  if (subdomain && !path.startsWith('/org/')) {
    url.pathname = `/org/${subdomain}${path}`;
    return NextResponse.rewrite(url);
  }

  // Route Protection & Session Checks
  // Admin Routes (either direct /org/[slug]/dashboard or rewritten /dashboard)
  const isAdminDashboard = path.includes('/dashboard') || path.includes('/events') || path.includes('/voters');
  const isSuperAdmin = path.startsWith('/superadmin');

  if (isAdminDashboard) {
    const adminToken = req.cookies.get('votely_admin_session')?.value;
    if (!adminToken) {
      // Redirect to login
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    const adminSession = await decrypt<AdminSession>(adminToken);
    if (!adminSession) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check tenant boundary
    // If accessing via /org/[slug]/dashboard, ensure it matches their session organization
    const orgPathMatch = path.match(/^\/org\/([^/]+)/);
    if (orgPathMatch) {
      const pathOrg = orgPathMatch[1];
      if (adminSession.role !== 'SUPER_ADMIN' && adminSession.organizationSlug !== pathOrg) {
        // Forbidden - trying to access another organization's workspace
        return new NextResponse('Unauthorized tenant access', { status: 403 });
      }
    }
  }

  if (isSuperAdmin) {
    const adminToken = req.cookies.get('votely_admin_session')?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    const session = await decrypt<AdminSession>(adminToken);
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
