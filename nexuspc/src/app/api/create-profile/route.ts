import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Uses service role key — bypasses RLS entirely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { id, email, full_name, phone } = await request.json();

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('profiles').upsert(
      {
        id,
        email,
        full_name: full_name ?? null,
        phone: phone ?? null,
        role: 'customer',
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error('[create-profile] upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[create-profile] unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
