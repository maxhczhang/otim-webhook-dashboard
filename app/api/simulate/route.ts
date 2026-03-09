import { NextRequest, NextResponse } from 'next/server';
import { generateMockEvent, OtimEventType } from '@/lib/mockEvents';
import { signPayload } from '@/lib/verify';
import { insertEvent } from '@/lib/db';
import { broadcast } from '@/lib/eventBus';

const VALID_TYPES = ['transfer.initiated', 'transfer.settled', 'transfer.failed', 'yield.earned', 'iban.deposit', 'entity.created', 'entity.verified'];

export async function POST(request: NextRequest) {
  let eventType: OtimEventType | undefined;

  try {
    const body = await request.json();
    if (body.type && VALID_TYPES.includes(body.type)) {
      eventType = body.type as OtimEventType;
    }
  } catch {
    // No body or invalid JSON — use random type
  }

  const event = generateMockEvent(eventType);
  const payload = JSON.stringify(event);
  const signature = signPayload(payload);

  const eventWithSig = { ...event, signature, verified: true };
  insertEvent(eventWithSig);
  broadcast(JSON.stringify(eventWithSig));

  return NextResponse.json({
    sent: true,
    event: eventWithSig,
  });
}
