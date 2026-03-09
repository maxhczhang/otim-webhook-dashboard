import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_SECRET = 'otim_whsec_dev_secret_key';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  const key = secret || process.env.WEBHOOK_SECRET || DEFAULT_SECRET;
  const expected = createHmac('sha256', key)
    .update(payload)
    .digest('hex');
  const sig = Buffer.from(signature);
  const exp = Buffer.from(expected);
  return sig.length === exp.length && timingSafeEqual(sig, exp);
}

export function signPayload(payload: string, secret?: string): string {
  const key = secret || process.env.WEBHOOK_SECRET || DEFAULT_SECRET;
  return createHmac('sha256', key).update(payload).digest('hex');
}
