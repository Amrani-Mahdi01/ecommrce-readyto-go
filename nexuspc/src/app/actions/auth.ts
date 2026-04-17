'use server';

import { createClient } from '@/lib/supabase/server';

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}

export async function registerAction(_: unknown, formData: FormData) {
  const email    = formData.get('email')    as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phone    = formData.get('phone')    as string;
  const locale   = formData.get('locale')   as string;

  const supabase = await createClient();

  // 1. Sign up
  const { data, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  });

  if (signUpErr) return { error: signUpErr.message };

  if (!data.user) {
    return { error: 'Email already registered — try logging in instead' };
  }

  // 2. Sign in immediately — sets the session cookie server-side
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });

  if (signInErr) return { error: signInErr.message };

  // 3. Return the redirect path — client will navigate
  return { success: true, redirect: `/${locale}` };
}

export async function loginAction(_: unknown, formData: FormData) {
  const email    = formData.get('email')    as string;
  const password = formData.get('password') as string;
  const locale   = formData.get('locale')   as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Please confirm your email first' };
    }
    return { error: 'Invalid email or password' };
  }

  return { success: true, redirect: `/${locale}` };
}
