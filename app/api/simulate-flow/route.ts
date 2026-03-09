import { NextRequest, NextResponse } from 'next/server';
import { generateFlow, FlowType } from '@/lib/mockEvents';
import { signPayload } from '@/lib/verify';
import { insertEvent } from '@/lib/db';

const VALID_FLOWS: FlowType[] = ['settlement', 'onboarding', 'deposit_yield'];

export async function POST(request: NextRequest) {
  let flowType: FlowType = 'settlement';

  try {
    const body = await request.json();
    if (body.flow && VALID_FLOWS.includes(body.flow)) {
      flowType = body.flow as FlowType;
    }
  } catch {
    // Default to settlement
  }

  const events = generateFlow(flowType);

  const signedEvents = events.map((event) => {
    const payload = JSON.stringify(event);
    const signature = signPayload(payload);
    const eventWithSig = { ...event, signature, verified: true };
    insertEvent(eventWithSig);
    return eventWithSig;
  });

  return NextResponse.json({
    sent: true,
    flow: flowType,
    events: signedEvents,
  });
}
