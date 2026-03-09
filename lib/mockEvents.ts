export interface OtimEvent {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
}

const EVENT_TYPES = [
  'transfer.initiated',
  'transfer.settled',
  'transfer.failed',
  'yield.earned',
  'iban.deposit',
  'entity.created',
  'entity.verified',
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

function generateEventData(type: OtimEventType, overrides?: Record<string, unknown>): Record<string, unknown> {
  const accountId = (overrides?.account_id as string) || randomId('acc_');
  const currency = (overrides?.currency as string) || CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];

  switch (type) {
    case 'transfer.initiated':
      return {
        account_id: accountId,
        amount: (overrides?.amount as string) || randomAmount(100, 50000),
        currency,
        destination_account_id: (overrides?.destination_account_id as string) || randomId('acc_'),
        reference: (overrides?.reference as string) || randomId('ref_'),
      };
    case 'transfer.settled':
      return {
        account_id: accountId,
        amount: (overrides?.amount as string) || randomAmount(100, 50000),
        currency,
        destination_account_id: (overrides?.destination_account_id as string) || randomId('acc_'),
        reference: (overrides?.reference as string) || randomId('ref_'),
      };
    case 'transfer.failed':
      return {
        account_id: accountId,
        amount: (overrides?.amount as string) || randomAmount(100, 25000),
        currency,
        error_code: (overrides?.error_code as string) || ['insufficient_funds', 'compliance_hold', 'invalid_destination'][
          Math.floor(Math.random() * 3)
        ],
        destination_account_id: (overrides?.destination_account_id as string) || randomId('acc_'),
        reference: (overrides?.reference as string) || randomId('ref_'),
      };
    case 'yield.earned':
      return {
        account_id: accountId,
        amount: (overrides?.amount as string) || randomAmount(0.5, 50),
        currency: 'USDC',
        apy: (overrides?.apy as string) || (Math.random() * 5 + 1).toFixed(2) + '%',
        protocol: 'Aave v3',
      };
    case 'iban.deposit':
      return {
        account_id: accountId,
        amount: (overrides?.amount as string) || randomAmount(500, 100000),
        currency: 'EUR',
        sender_iban: (overrides?.sender_iban as string) || `DE${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        sender_name: (overrides?.sender_name as string) || 'External Sender',
      };
    case 'entity.created':
      return {
        entity_id: (overrides?.entity_id as string) || randomId('ent_'),
        entity_type: (overrides?.entity_type as string) || (Math.random() > 0.5 ? 'individual' : 'business'),
        status: 'pending',
      };
    case 'entity.verified':
      return {
        entity_id: (overrides?.entity_id as string) || randomId('ent_'),
        entity_type: (overrides?.entity_type as string) || (Math.random() > 0.5 ? 'individual' : 'business'),
        verification_level: 'full',
        checks_passed: ['identity', 'address', 'sanctions'],
      };
  }
}

export function generateMockEvent(type?: OtimEventType, overrides?: Record<string, unknown>): OtimEvent {
  const eventType = type || EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  return {
    id: randomId('evt_'),
    type: eventType,
    created_at: new Date().toISOString(),
    data: generateEventData(eventType, overrides),
  };
}

export type FlowType = 'settlement' | 'onboarding' | 'deposit_yield';

export function generateFlow(flowType: FlowType): OtimEvent[] {
  switch (flowType) {
    case 'settlement': {
      const accountId = randomId('acc_');
      const destId = randomId('acc_');
      const amount = randomAmount(1000, 50000);
      const currency = CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)];
      const reference = randomId('ref_');
      const shared = { account_id: accountId, destination_account_id: destId, amount, currency, reference };

      const succeeds = Math.random() > 0.3; // 70% success rate
      return [
        generateMockEvent('transfer.initiated', shared),
        succeeds
          ? generateMockEvent('transfer.settled', shared)
          : generateMockEvent('transfer.failed', { ...shared, error_code: 'compliance_hold' }),
      ];
    }
    case 'onboarding': {
      const entityId = randomId('ent_');
      const entityType = Math.random() > 0.5 ? 'individual' : 'business';
      return [
        generateMockEvent('entity.created', { entity_id: entityId, entity_type: entityType }),
        generateMockEvent('entity.verified', { entity_id: entityId, entity_type: entityType }),
      ];
    }
    case 'deposit_yield': {
      const accountId = randomId('acc_');
      const depositAmount = randomAmount(5000, 100000);
      const yieldAmount = (parseFloat(depositAmount) * (Math.random() * 0.005 + 0.001)).toFixed(2);
      return [
        generateMockEvent('iban.deposit', { account_id: accountId, amount: depositAmount }),
        generateMockEvent('yield.earned', { account_id: accountId, amount: yieldAmount }),
      ];
    }
  }
}
