export interface OtimEvent {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
}

const EVENT_TYPES = [
  'transfer.settled',
  'yield.earned',
  'iban.deposit',
  'entity.verified',
  'transfer.failed',
] as const;

export type OtimEventType = (typeof EVENT_TYPES)[number];

function randomId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomAmount(min: number, max: number): string {
  return (Math.random() * (max - min) + min).toFixed(2);
}

const CURRENCIES = ['USDC', 'USDT', 'EUR', 'USD'];

function generateEventData(type: OtimEventType): Record<string, unknown> {
  const accountId = randomId('acc_');
  const currency = CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];

  switch (type) {
    case 'transfer.settled':
      return {
        account_id: accountId,
        amount: randomAmount(100, 50000),
        currency,
        destination_account_id: randomId('acc_'),
        reference: randomId('ref_'),
      };
    case 'yield.earned':
      return {
        account_id: accountId,
        amount: randomAmount(0.01, 50),
        currency: 'USDC',
        apy: (Math.random() * 5 + 1).toFixed(2) + '%',
        protocol: 'Aave v3',
      };
    case 'iban.deposit':
      return {
        account_id: accountId,
        amount: randomAmount(500, 100000),
        currency: 'EUR',
        sender_iban: `DE${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        sender_name: 'External Sender',
      };
    case 'entity.verified':
      return {
        entity_id: randomId('ent_'),
        entity_type: Math.random() > 0.5 ? 'individual' : 'business',
        verification_level: 'full',
        checks_passed: ['identity', 'address', 'sanctions'],
      };
    case 'transfer.failed':
      return {
        account_id: accountId,
        amount: randomAmount(100, 25000),
        currency,
        error_code: ['insufficient_funds', 'compliance_hold', 'invalid_destination'][
          Math.floor(Math.random() * 3)
        ],
        destination_account_id: randomId('acc_'),
      };
  }
}

export function generateMockEvent(type?: OtimEventType): OtimEvent {
  const eventType = type || EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  return {
    id: randomId('evt_'),
    type: eventType,
    created_at: new Date().toISOString(),
    data: generateEventData(eventType),
  };
}
