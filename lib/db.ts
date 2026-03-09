export interface WebhookEvent {
  id: string;
  type: string;
  created_at: string;
  data: string; // JSON string
  signature: string;
  verified: number; // 0 or 1
  received_at: string;
}

interface StoredEvent {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
  signature?: string;
  verified?: boolean;
}

const events: WebhookEvent[] = [];

export function insertEvent(event: StoredEvent): void {
  // Avoid duplicates
  if (events.some((e) => e.id === event.id)) return;
  events.unshift({
    id: event.id,
    type: event.type,
    created_at: event.created_at,
    data: JSON.stringify(event.data),
    signature: event.signature || '',
    verified: event.verified !== false ? 1 : 0,
    received_at: new Date().toISOString(),
  });
  // Cap at 200 events
  if (events.length > 200) events.pop();
}

export function clearEvents(): void {
  events.length = 0;
}

export function getEvents(limit = 50): WebhookEvent[] {
  return events.slice(0, limit);
}
