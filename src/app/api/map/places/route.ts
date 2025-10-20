import { NextResponse } from 'next/server';

import { MEETUP_PLACES } from '@/data/campus-map/places';

export function GET() {
  return NextResponse.json(MEETUP_PLACES, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}