import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/verify';
import { insertEvent } from '@/lib/db';
import { broadcast } from '@/lib/eventBus';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-otim-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
  }

  const verified = verifyWebhookSignature(body, signature);
  if (!verified) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!event.id || !event.type || !event.created_at || !event.data) {
    return NextResponse.json({ error: 'Invalid event payload' }, { status: 400 });
  }

  const eventWithSig = { ...event, signature, verified: true };
  insertEvent(eventWithSig);
  broadcast(JSON.stringify(eventWithSig));

  return NextResponse.json({ received: true, id: event.id });
}
