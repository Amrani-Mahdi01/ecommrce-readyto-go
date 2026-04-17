'use client';

import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/user';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

// Auth state comes entirely from the server (passed via layout props).
// No client-side subscriptions needed since all auth changes use full page reloads.
export function useAuth(initialUser?: User | null, initialProfile?: Profile | null): AuthState {
  return {
    user: initialUser ?? null,
    profile: initialProfile ?? null,
    loading: false,
  };
}
