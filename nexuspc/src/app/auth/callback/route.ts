import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const locale = searchParams.get('locale') ?? 'en';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // For Google OAuth, `locale` param is set; for email confirmation, fall back to `next`
      const destination = next !== '/' ? `/${locale}${next}` : `/${locale}`;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Something went wrong
  return NextResponse.redirect(`${origin}/${locale}/login?error=confirmation_failed`);
}
