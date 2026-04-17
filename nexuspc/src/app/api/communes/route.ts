import { NextRequest, NextResponse } from 'next/server';
import { COMMUNES_BY_WILAYA } from '@/data/communes';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('wilaya');
  if (!code) return NextResponse.json([], { status: 400 });

  const wilayaId = parseInt(code, 10);
  if (isNaN(wilayaId) || wilayaId < 1 || wilayaId > 58) {
    return NextResponse.json([], { status: 400 });
  }

  const communes = COMMUNES_BY_WILAYA[wilayaId] ?? [];
  return NextResponse.json(communes);
}
