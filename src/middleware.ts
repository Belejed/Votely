import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt, AdminSession } from './lib/session';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';
  const path = url.pathname;

  // Skip static files, API routes, Next.js internals
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

  // Detect subdomain/tenant for custom domains
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

  // Resolve the effective path for auth checks
  // If subdomain request, compute the rewritten path FIRST, then check auth on it
  let effectivePath = path;
  let needsRewrite = false;

  if (subdomain && !isPublicRootPath && !path.startsWith('/org/')) {
    effectivePath = `/org/${subdomain}${path}`;
    needsRewrite = true;
  }

  // Route Protection & Session Checks — runs on EFFECTIVE path (including subdomain rewrites)
  const isAdminDashboard = 
    effectivePath.includes('/dashboard') || 
    effectivePath.includes('/events') || 
    effectivePath.includes('/voters') || 
    effectivePath.includes('/active-election') || 
    effectivePath.includes('/livecount') ||
    effectivePath.includes('/theme') ||
    effectivePath.includes('/users') ||
    effectivePath.includes('/audit') ||
    effectivePath.includes('/announcements');

  const isSuperAdmin = effectivePath.startsWith('/superadmin');

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
    const orgPathMatch = effectivePath.match(/^\/org\/([^/]+)/);
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

  // Perform subdomain rewrite AFTER auth checks pass
  if (needsRewrite) {
    url.pathname = effectivePath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

