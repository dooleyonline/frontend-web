import { NextResponse } from 'next/server';

import { CAMPUS_ZONES } from '@/data/campus-map/zones';

export function GET() {
  return NextResponse.json(CAMPUS_ZONES, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}