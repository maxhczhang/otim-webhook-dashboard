'use client';

import { useEffect, useState, useCallback } from 'react';
import EventCard from './EventCard';

interface Event {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown> | string;
}

function parseEventData(event: Event): Event & { data: Record<string, unknown> } {
  return {
    ...event,
    data: typeof event.data === 'string' ? JSON.parse(event.data) : event.data,
  };
}

export default function EventFeed() {
  const [events, setEvents] = useState<(Event & { data: Record<string, unknown> })[]>([]);
  const [simulating, setSimulating] = useState(false);

  // Load persisted events
  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data: Event[]) => setEvents(data.map(parseEventData)))
      .catch(console.error);
  }, []);

  // SSE subscription
  useEffect(() => {
    const source = new EventSource('/api/stream');
    source.onmessage = (msg) => {
      const event = parseEventData(JSON.parse(msg.data));
      setEvents((prev) => [event, ...prev]);
    };
    return () => source.close();
  }, []);

  const simulate = useCallback(async () => {
    setSimulating(true);
    try {
      await fetch('/api/simulate', { method: 'POST' });
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  }, []);

  // Stats
  const totalVolume = events.reduce((sum, e) => {
    const amt = e.data.amount as string | undefined;
    return sum + (amt ? parseFloat(amt) : 0);
  }, 0);

  const typeCounts: Record<string, number> = {};
  for (const e of events) {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Otim Webhook Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Real-time event stream</p>
        </div>
        <button
          onClick={simulate}
          disabled={simulating}
          className="px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {simulating ? 'Sending...' : 'Simulate Event'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
          <div className="text-zinc-500 text-xs uppercase tracking-wider">Total Events</div>
          <div className="text-white text-2xl font-bold mt-1">{events.length}</div>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
          <div className="text-zinc-500 text-xs uppercase tracking-wider">Total Volume</div>
          <div className="text-white text-2xl font-bold mt-1">
            ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
          <div className="text-zinc-500 text-xs uppercase tracking-wider">Event Types</div>
          <div className="text-white text-2xl font-bold mt-1">{Object.keys(typeCounts).length}</div>
        </div>
      </div>

      {/* Type breakdown */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(typeCounts).map(([type, count]) => (
            <span key={type} className="text-xs text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">
              {type}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Event feed */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <p className="text-lg">No events yet</p>
            <p className="text-sm mt-2">Click &quot;Simulate Event&quot; to generate a mock webhook event</p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard key={event.id} {...event} />
          ))
        )}
      </div>
    </div>
  );
}
