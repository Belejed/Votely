import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt, AdminSession } from './lib/session';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';
  const path = url.pathname;

  // Skip static files, API routes, Next.js internals, and public root routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/favicon.ico') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  // Never rewrite root public paths
  const isPublicRootPath = 
    path === '/' || 
    path === '/login' || 
    path === '/signup' || 
    path.startsWith('/superadmin');

  // Detect subdomain/tenant for custom domains (e.g., sman71.votely.id or sman71.localhost:3000)
  // Do NOT treat vercel.app default project names (e.g. votely-sooty.vercel.app) as subdomains
  let subdomain: string | null = null;
  const isVercelApp = hostname.endsWith('.vercel.app');

  if (!isVercelApp) {
    let hostnameParts = hostname.split('.').map((p: string) => p.split(':')[0]);
    if (hostnameParts.length > 1) {
      const firstPart = hostnameParts[0];
      if (firstPart !== 'localhost' && firstPart !== 'www' && firstPart !== 'votely' && firstPart !== '127') {
        subdomain = firstPart;
      }
    }
  }

  // Rewrite subdomain requests to organization routes only if not already under /org/ and not a public path
  if (subdomain && !isPublicRootPath && !path.startsWith('/org/')) {
    url.pathname = `/org/${subdomain}${path}`;
    return NextResponse.rewrite(url);
  }

  // Route Protection & Session Checks
  const isAdminDashboard = path.includes('/dashboard') || path.includes('/events') || path.includes('/voters') || path.includes('/active-election') || path.includes('/livecount');
  const isSuperAdmin = path.startsWith('/superadmin');

  if (isAdminDashboard) {
    const adminToken = req.cookies.get('votely_admin_session')?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    const adminSession = await decrypt<AdminSession>(adminToken);
    if (!adminSession) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check tenant boundary if accessing via /org/[slug]/*
    const orgPathMatch = path.match(/^\/org\/([^/]+)/);
    if (orgPathMatch) {
      const pathOrg = orgPathMatch[1];
      if (adminSession.role !== 'SUPER_ADMIN' && adminSession.organizationSlug !== pathOrg) {
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
