import { NextResponse } from 'next/server';
import { generateMockEvent } from '@/lib/mockEvents';
import { signPayload } from '@/lib/verify';
import { insertEvent } from '@/lib/db';
import { broadcast } from '@/lib/eventBus';

export async function POST() {
  const event = generateMockEvent();
  const payload = JSON.stringify(event);
  const signature = signPayload(payload);

  // Insert directly instead of making an HTTP call to ourselves
  insertEvent(event);
  broadcast(payload);

  return NextResponse.json({
    sent: true,
    event_id: event.id,
    event_type: event.type,
    signature,
  });
}
