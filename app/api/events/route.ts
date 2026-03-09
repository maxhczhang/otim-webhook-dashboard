import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const events = getEvents();
  return NextResponse.json(events);
}
