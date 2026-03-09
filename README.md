# Otim Webhook Event Dashboard

A reference implementation for receiving, verifying, and displaying webhook events from [Otim](https://otim.com) — the fintech infrastructure API that lets platforms hold, move, and earn yield on money without becoming a bank.

**[Live Demo](https://otim-webhook-dashboard.vercel.app)**

## Why this exists

Otim's [docs](https://docs.otim.com) and [playground](https://github.com/otimlabs/otim-playground) have settlement and vault examples, but nothing showing event-driven architecture. Their blog describes Orchestrators as "webhooks for money" — but there's no reference implementation showing developers what that looks like in practice.

This project fills that gap: a working dashboard that demonstrates the full lifecycle of a webhook event in a financial platform.

## What it does

The dashboard simulates the webhook flow a real Otim integration would use:

```
Event arrives → HMAC-SHA256 signature verified → Persisted → Streamed to UI via SSE
```

### Multi-step flow simulations

Instead of isolated events, the dashboard simulates realistic correlated sequences:

| Flow | Events | What it models |
|---|---|---|
| **Settlement** | `transfer.initiated` → `transfer.settled` or `transfer.failed` | Funds moving between accounts, with compliance checks |
| **Onboarding** | `entity.created` → `entity.verified` | KYC/KYB verification completing for a new entity |
| **Deposit + Yield** | `iban.deposit` → `yield.earned` | Fiat arriving via IBAN, then yield accruing via Aave |

Events within a flow share the same `account_id` or `entity_id`, just like they would in production. The settlement flow has a 30% failure rate to show error handling.

### Event types

| Event | Description |
|---|---|
| `transfer.initiated` | Transfer request submitted |
| `transfer.settled` | Funds successfully moved |
| `transfer.failed` | Transfer rejected (insufficient funds, compliance hold, invalid destination) |
| `yield.earned` | Yield accrued on account balance via DeFi protocols |
| `iban.deposit` | Fiat received via IBAN into an account |
| `entity.created` | New entity registered for KYC/KYB |
| `entity.verified` | Entity passed identity, address, and sanctions checks |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Next.js App Router                                 │
│                                                     │
│  POST /api/webhook ──→ verify signature ──→ store   │
│  POST /api/simulate ──→ generate mock ──→ webhook   │
│  POST /api/simulate-flow ──→ correlated sequence    │
│  GET  /api/events ──→ return stored events          │
│  GET  /api/stream ──→ SSE push to frontend          │
│  POST /api/reset ──→ clear all events               │
│                                                     │
│  lib/verify.ts ──→ HMAC-SHA256 + timingSafeEqual    │
│  lib/db.ts ──→ in-memory event store                │
│  lib/mockEvents.ts ──→ event generation + flows     │
│  lib/eventBus.ts ──→ pub/sub for SSE broadcasting   │
└─────────────────────────────────────────────────────┘
```

**Signature verification** uses `crypto.createHmac` with `timingSafeEqual` to prevent timing attacks — a real security consideration for financial webhook receivers.

**Event payloads** follow Stripe/Plaid conventions: unique `evt_` prefixed IDs, ISO timestamps, and nested `data` objects with type-specific fields.

## Tech stack

- **Next.js 16** (App Router) — frontend + API in one project
- **TypeScript** — consistent with Otim's ecosystem
- **Tailwind CSS** — dark developer-tool aesthetic
- **Server-Sent Events** — real-time push without WebSocket complexity
- **HMAC-SHA256** — webhook signature verification
- **Vercel** — zero-config deployment

## Run locally

```bash
git clone https://github.com/maxhczhang/otim-webhook-dashboard.git
cd otim-webhook-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No API keys or environment variables required.

## License

MIT
