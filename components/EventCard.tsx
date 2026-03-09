'use client';

import { useState } from 'react';

interface EventCardProps {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
  signature?: string;
  verified?: boolean;
  isNew?: boolean;
}

const TYPE_COLORS: Record<string, { badge: string; icon: string }> = {
  'transfer.settled': {
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: '\u2713',
  },
  'yield.earned': {
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: '\u2191',
  },
  'iban.deposit': {
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: '\u2193',
  },
  'entity.verified': {
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: '\u2605',
  },
  'transfer.failed': {
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: '\u2717',
  },
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function EventCard({ id, type, created_at, data, signature, verified, isNew }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = TYPE_COLORS[type] || { badge: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', icon: '?' };
  const amount = data.amount as string | undefined;
  const currency = data.currency as string | undefined;
  const accountId = (data.account_id || data.entity_id) as string | undefined;

  return (
    <div
      className={`border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-all bg-zinc-900/50 cursor-pointer ${isNew ? 'animate-slide-in' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.badge}`}>
              <span>{colors.icon}</span>
              {type}
            </span>
            {amount && currency && (
              <span className="text-white font-mono font-semibold text-sm">
                {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {verified && (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <path d="M8 0L10 3L13.5 2L13 5.5L16 7.5L13.5 10L14.5 13.5L11 13L8 16L5 13L1.5 13.5L2.5 10L0 7.5L3 5.5L2.5 2L6 3L8 0Z" fill="currentColor" opacity="0.2"/>
                  <path d="M6 8L7.5 9.5L10.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                verified
              </span>
            )}
            <span className="text-zinc-500 text-xs">{timeAgo(created_at)}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
          <span className="font-mono truncate">{id}</span>
          {accountId && (
            <>
              <span className="text-zinc-700">|</span>
              <span className="font-mono truncate">{accountId}</span>
            </>
          )}
          <span className="ml-auto text-zinc-600 text-[10px]">{expanded ? 'click to collapse' : 'click to expand'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
          {signature && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">HMAC-SHA256 Signature</div>
              <div className="font-mono text-xs text-zinc-400 break-all bg-zinc-900 rounded px-3 py-2 border border-zinc-800">
                {signature}
              </div>
            </div>
          )}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Event Payload</div>
            <pre className="font-mono text-xs text-zinc-400 bg-zinc-900 rounded px-3 py-2 border border-zinc-800 overflow-x-auto">
              {JSON.stringify({ id, type, created_at, data }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
