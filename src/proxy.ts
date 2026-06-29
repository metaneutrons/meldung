import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  if (process.env.AUTH_ENABLED === 'true') {
    const sessionToken =
      request.cookies.get('authjs.session-token') ??
      request.cookies.get('__Secure-authjs.session-token');
    const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');

    if (!sessionToken && !isAuthRoute) {
      const signInUrl = new URL('/api/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Run on every path except API routes, Next internals and static files.
  // Locale handling is delegated to next-intl, so there is no locale list to
  // keep in sync here (single source of truth: routing.locales).
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
