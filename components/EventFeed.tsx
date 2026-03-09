'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import EventCard from './EventCard';

interface Event {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown> | string;
  signature?: string;
  verified?: boolean | number;
}

interface ParsedEvent {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
  signature?: string;
  verified?: boolean;
}

const EVENT_TYPES = [
  { type: 'transfer.settled', label: 'Transfer Settled', color: 'emerald' },
  { type: 'yield.earned', label: 'Yield Earned', color: 'blue' },
  { type: 'iban.deposit', label: 'IBAN Deposit', color: 'purple' },
  { type: 'entity.verified', label: 'Entity Verified', color: 'amber' },
  { type: 'transfer.failed', label: 'Transfer Failed', color: 'red' },
] as const;

const FLOW_STEPS = [
  { label: 'Event Received', desc: 'POST /api/webhook' },
  { label: 'Signature Verified', desc: 'HMAC-SHA256' },
  { label: 'Persisted', desc: 'SQLite' },
  { label: 'Streamed', desc: 'SSE Push' },
];

function parseEvent(event: Event): ParsedEvent {
  return {
    ...event,
    data: typeof event.data === 'string' ? JSON.parse(event.data) : event.data,
    verified: event.verified === true || event.verified === 1,
  };
}

export default function EventFeed() {
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const [simulating, setSimulating] = useState(false);


  const [activeStep, setActiveStep] = useState(-1);
  const initialLoadDone = useRef(false);

  // Load persisted events
  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data: Event[]) => {
        setEvents(data.map(parseEvent));
        initialLoadDone.current = true;
      })
      .catch(console.error);
  }, []);

  // SSE subscription
  useEffect(() => {
    const source = new EventSource('/api/stream');
    source.onmessage = (msg) => {
      const event = parseEvent(JSON.parse(msg.data));
      setNewEventIds((prev) => new Set(prev).add(event.id));
      setEvents((prev) => {
        if (prev.some((e) => e.id === event.id)) return prev;
        return [event, ...prev];
      });
      // Clear "new" status after animation
      setTimeout(() => {
        setNewEventIds((prev) => {
          const next = new Set(prev);
          next.delete(event.id);
          return next;
        });
      }, 500);
    };
    return () => source.close();
  }, []);

  const simulate = useCallback(async (type?: string) => {
    setSimulating(true);
    // Animate the flow steps
    for (let i = 0; i < FLOW_STEPS.length; i++) {
      setActiveStep(i);
      await new Promise((r) => setTimeout(r, 200));
    }
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type ? { type } : {}),
      });
      const { event } = await res.json();
      if (event) {
        const parsed = parseEvent(event);
        setNewEventIds((prev) => new Set(prev).add(parsed.id));
        setEvents((prev) => {
          // Avoid duplicate if SSE already delivered it
          if (prev.some((e) => e.id === parsed.id)) return prev;
          return [parsed, ...prev];
        });
        setTimeout(() => {
          setNewEventIds((prev) => {
            const next = new Set(prev);
            next.delete(parsed.id);
            return next;
          });
        }, 500);
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setTimeout(() => {
        setActiveStep(-1);
        setSimulating(false);
      }, 300);
    }
  }, []);

  // Stats
  const VOLUME_TYPES = ['transfer.settled', 'yield.earned', 'iban.deposit'];
  const volumeByCurrency: Record<string, number> = {};
  for (const e of events) {
    if (!VOLUME_TYPES.includes(e.type)) continue;
    const amt = e.data.amount as string | undefined;
    const cur = e.data.currency as string | undefined;
    if (!amt || !cur) continue;
    volumeByCurrency[cur] = (volumeByCurrency[cur] || 0) + parseFloat(amt);
  }

  const typeCounts: Record<string, number> = {};
  for (const e of events) {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Otim Webhook Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Reference implementation for Otim&apos;s event-driven architecture
          </p>
        </div>
        {events.length > 0 && (
          <button
            onClick={async () => {
              await fetch('/api/reset', { method: 'POST' });
              setEvents([]);
            }}
            className="px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Architecture Flow */}
      <div className="border border-zinc-800 rounded-lg p-4 mb-6 bg-zinc-900/30">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Webhook Pipeline</div>
        <div className="flex items-center gap-0">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className={`flex-1 rounded-md px-3 py-2 text-center transition-colors duration-200 ${
                activeStep === i
                  ? 'bg-emerald-500/20 border border-emerald-500/40'
                  : 'bg-zinc-800/50 border border-zinc-800'
              }`}>
                <div className={`text-xs font-medium ${activeStep === i ? 'text-emerald-400' : 'text-zinc-300'}`}>
                  {step.label}
                </div>
                <div className={`text-[10px] mt-0.5 ${activeStep === i ? 'text-emerald-500/70' : 'text-zinc-600'}`}>
                  {step.desc}
                </div>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div className={`mx-1 text-xs ${activeStep > i ? 'text-emerald-500' : 'text-zinc-700'}`}>&rarr;</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Event Type Simulator */}
      <div className="border border-zinc-800 rounded-lg p-4 mb-6 bg-zinc-900/30">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Simulate Webhook Event</div>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map(({ type, label, color }) => (
            <button
              key={type}
              onClick={() => simulate(type)}
              disabled={simulating}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                ${color === 'emerald' ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : ''}
                ${color === 'blue' ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10' : ''}
                ${color === 'purple' ? 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10' : ''}
                ${color === 'amber' ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : ''}
                ${color === 'red' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : ''}
              `}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => simulate()}
            disabled={simulating}
            className="px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Random
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Events Received</div>
          <div className="text-white text-2xl font-bold mt-1 font-mono">{events.length}</div>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Volume by Currency</div>
          {Object.keys(volumeByCurrency).length === 0 ? (
            <div className="text-white text-2xl font-bold mt-1 font-mono">0.00</div>
          ) : (
            <div className="mt-1.5 space-y-1">
              {Object.entries(volumeByCurrency)
                .sort(([, a], [, b]) => b - a)
                .map(([cur, vol]) => (
                  <div key={cur} className="flex items-baseline justify-between">
                    <span className="text-zinc-500 text-xs font-mono">{cur}</span>
                    <span className="text-white text-sm font-bold font-mono">
                      {vol.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Signatures Verified</div>
          <div className="text-emerald-400 text-2xl font-bold mt-1 font-mono">
            {events.filter(e => e.verified).length}
          </div>
        </div>
      </div>

      {/* Type breakdown */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(typeCounts).map(([type, count]) => (
            <span key={type} className="text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full font-mono">
              {type} <span className="text-zinc-500">{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Event feed */}
      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="border border-zinc-800 rounded-lg p-8 bg-zinc-900/30 text-center">
            <div className="text-zinc-400 text-lg font-medium mb-2">No events yet</div>
            <p className="text-zinc-600 text-sm max-w-md mx-auto mb-4">
              This dashboard demonstrates how a platform built on Otim would receive and process webhook events in real time.
              Each simulated event goes through HMAC-SHA256 signature verification, gets persisted to SQLite, and streams to this UI via Server-Sent Events.
            </p>
            <p className="text-zinc-600 text-sm">
              Use the event type buttons above to simulate a webhook delivery.
            </p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              {...event}
              isNew={newEventIds.has(event.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
