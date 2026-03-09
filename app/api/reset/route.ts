import { NextResponse } from 'next/server';
import { clearEvents } from '@/lib/db';

export async function POST() {
  clearEvents();
  return NextResponse.json({ cleared: true });
}
