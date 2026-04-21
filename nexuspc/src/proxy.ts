import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth callback — bypass intl middleware so the route isn't locale-prefixed
  if (pathname.startsWith('/auth/callback')) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Handle admin routes — always in English, requires admin role
  if (pathname.startsWith('/admin')) {
    const { supabaseResponse, user } = await updateSession(request);

    if (!user) {
      const loginUrl = new URL('/en/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Note: role check happens in the admin layout via server component
    return supabaseResponse;
  }

  // Refresh Supabase session for locale routes
  const { supabaseResponse } = await updateSession(request);

  // Run next-intl middleware for locale routing
  const intlResponse = intlMiddleware(request);

  // Merge cookies from Supabase into intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)',
  ],
};
