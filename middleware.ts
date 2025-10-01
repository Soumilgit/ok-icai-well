import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/contact',
  '/beta-program',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)'
]);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/dashboard(.*)',
  '/api/content(.*)',
  '/api/automation(.*)',
  '/api/notifications(.*)'
]);

// Admin-only routes (company members only)
const isAdminRoute = createRouteMatcher([
  '/workflow-builder(.*)',
  '/api/workflow(.*)',
  '/api/socket(.*)',
  '/admin(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  
  // Redirect to sign-in if trying to access protected routes while unauthenticated
  if ((isProtectedRoute(req) || isAdminRoute(req)) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // Check for domain-based access to workflow builder (aminutemantechnologies.com only)
  if (isAdminRoute(req) && userId) {
    const userEmail = (sessionClaims?.email as string) || '';
    const aminuteDomainRegex = /^[a-zA-Z0-9._%+-]+@aminutemantechnologies\.com$/i;
    
    // Only allow users with @aminutemantechnologies.com email domain
    if (!aminuteDomainRegex.test(userEmail)) {
      return NextResponse.redirect(new URL('/dashboard?error=domain_access_denied', req.url));
    }
  }

  // Redirect authenticated users from public auth pages to dashboard
  if (userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect from root to dashboard if authenticated, otherwise to sign-in
  if (req.nextUrl.pathname === '/') {
    if (userId) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};