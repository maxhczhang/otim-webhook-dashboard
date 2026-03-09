'use client';

interface EventCardProps {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
}

const TYPE_COLORS: Record<string, string> = {
  'transfer.settled': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'yield.earned': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'iban.deposit': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'entity.verified': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'transfer.failed': 'bg-red-500/20 text-red-400 border-red-500/30',
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function EventCard({ id, type, created_at, data }: EventCardProps) {
  const colorClass = TYPE_COLORS[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  const amount = data.amount as string | undefined;
  const currency = data.currency as string | undefined;
  const accountId = (data.account_id || data.entity_id) as string | undefined;

  return (
    <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors bg-zinc-900/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
            {type}
          </span>
          {amount && currency && (
            <span className="text-white font-mono font-semibold text-sm">
              {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
            </span>
          )}
        </div>
        <span className="text-zinc-500 text-xs shrink-0">{timeAgo(created_at)}</span>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
        <span className="font-mono truncate">{id}</span>
        {accountId && <span className="font-mono truncate">{accountId}</span>}
      </div>
    </div>
  );
}
