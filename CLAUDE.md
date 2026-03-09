# CLAUDE.md — Otim Webhook Event Dashboard

## Project Overview
A full-stack webhook event dashboard that demonstrates how a developer platform 
built on Otim would receive, verify, persist, and display financial events in 
real time. Built as a portfolio project to address a documented gap in Otim's 
developer ecosystem — no webhook or event-handling examples exist anywhere in 
their playground or docs.

## What Otim Is
Otim (otim.com) is a fintech infrastructure API built by Julian Rachman. It lets 
any software platform hold, move, and earn yield on users' money via stablecoins 
and fiat rails — without becoming a bank. The core business model is aggregating 
float across platforms: idle money in escrow earns yield (via protocols like Aave), 
and the platform operator captures that spread. Think Stripe for the deposit and 
yield side of banking.

Target customer: B2B developers building platforms that handle money — marketplaces,
payroll tools, wallets, fintech products. Not end users.

## Why This Project Exists
Otim's docs (docs.otim.com) have no webhook documentation. Their playground 
(github.com/otimlabs/otim-playground) has settlement and vault examples but nothing 
showing event-driven architecture. Their Jan 2026 blog post describes Orchestrators 
as "webhooks for money" but there is no reference implementation anywhere.

This project fills that gap directly and was built after a full product analysis 
of Otim. The CLAUDE.md is intentionally public — this project was researched and 
scoped with AI assistance, which is consistent with how Otim's own team works 
(Claude is a listed contributor in their playground repo).

## Project Goal
Build a polished, deployable dashboard that:
- Exposes a /webhook POST endpoint that receives Otim-style event payloads
- Verifies webhook signatures using HMAC-SHA256 (prevents forged payloads)
- Persists events to SQLite so they survive page refresh
- Streams new events to the frontend in real time via Server-Sent Events (SSE)
- Includes a built-in event simulator so anyone can run it without Otim API keys
- Deploys to Vercel with zero configuration

## Tech Stack
- **Next.js (App Router)** — frontend + all API routes in one project, no separate backend
- **TypeScript** — consistent with Otim's ecosystem (96% of their playground is TS)
- **Tailwind CSS** — styling
- **SQLite via better-sqlite3** — lightweight local persistence, no external database
- **HMAC-SHA256 (Node crypto)** — webhook signature verification
- **Server-Sent Events (SSE)** — real-time push from server to frontend, no polling
- **Vercel** — deployment target

## Project Structure
```
otim-webhook-dashboard/
├── app/
│   ├── page.tsx                  # Main dashboard UI
│   ├── layout.tsx                # Root layout
│   └── api/
│       ├── webhook/
│       │   └── route.ts          # POST /api/webhook — receives + verifies events
│       ├── events/
│       │   └── route.ts          # GET /api/events — returns persisted events
│       ├── stream/
│       │   └── route.ts          # GET /api/stream — SSE endpoint for real-time push
│       └── simulate/
│           └── route.ts          # POST /api/simulate — fires a mock event payload
├── components/
│   ├── EventFeed.tsx             # Scrolling list of event cards
│   └── EventCard.tsx             # Individual event with badge, amount, timestamp
├── lib/
│   ├── mockEvents.ts             # Event type definitions + fake data generator
│   ├── db.ts                     # SQLite setup and query helpers
│   └── verify.ts                 # HMAC-SHA256 signature verification function
├── README.md
└── CLAUDE.md                     # This file
```

## Otim Event Types to Simulate
These are the five core events a real Otim webhook integration would receive:

| Event Type | Trigger |
|---|---|
| `transfer.settled` | Funds moved between two accounts |
| `yield.earned` | Yield accrued on an account balance |
| `iban.deposit` | Fiat received via IBAN into an account |
| `entity.verified` | KYC/KYB completed for an entity |
| `transfer.failed` | A transfer attempt that did not go through |

## Event Payload Shape
Every event follows this structure (modeled on Stripe/Plaid conventions):

```typescript
{
  id: "evt_01JXYZ...",           // unique event ID
  type: "transfer.settled",       // event type string
  created_at: "ISO timestamp",
  data: {
    account_id: "acc_01JA...",
    amount: "1250.00",
    currency: "USDC",
    // type-specific fields vary per event type
  }
}
```

## Key Engineering Features

### 1. HMAC-SHA256 Signature Verification (`lib/verify.ts`)
Webhook receivers must verify payloads actually came from Otim and weren't forged.
Uses `timingSafeEqual` to prevent timing attacks — a real security consideration
in financial integrations.

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  const sig = Buffer.from(signature);
  const exp = Buffer.from(expected);
  return sig.length === exp.length && timingSafeEqual(sig, exp);
}
```

### 2. SQLite Persistence (`lib/db.ts`)
Events are stored in a local SQLite database so they persist across page refreshes.
Uses `better-sqlite3` for synchronous, zero-config local storage.

### 3. Server-Sent Events (`app/api/stream/route.ts`)
New events are pushed to the frontend the moment they arrive at the webhook endpoint,
without polling. SSE is simpler than WebSockets for this one-directional use case.

### 4. Event Simulator (`app/api/simulate/route.ts`)
A POST endpoint that generates a realistic mock event payload and sends it to 
`/api/webhook` internally. The dashboard UI calls this on button click. Makes the 
entire project runnable with zero external dependencies or API keys.

## UI Design
- Developer-tool aesthetic — dark theme preferred
- Event feed is the primary focus — full width, scrollable, newest events on top
- Each EventCard shows: colored status badge, event type, amount, currency, 
  account ID, relative timestamp ("just now", "3s ago", etc.)
- "Simulate Event" button top right — fires a random event type on click
- Summary stats row at top: total events, total volume, events by type

## What Not to Build
- No separate Express/Fastify backend — Next.js API routes handle everything
- No authentication or user accounts
- No real Otim API integration (simulation only — v2 concern)
- No complex filtering UI (simple event type badges are sufficient)

## Deployment
- Vercel free tier, deploys directly from GitHub
- Zero required environment variables for sim-only mode
- Optional: `WEBHOOK_SECRET` env var to enable real signature verification
- Live URL goes in README and GitHub repo description

## Resume / Outreach Notes
Project demonstrates:
- Event-driven architecture understanding (SSE, webhook patterns)
- Security awareness in financial contexts (HMAC, timing attacks)
- Full-stack TypeScript (Next.js App Router, API routes, React)
- Product thinking — identified a real gap in a real company's ecosystem

Outreach target: julian@otim.com
Subject: "Webhook event dashboard for Otim — open source contribution"
Pitch: "I did a full product analysis of Otim and noticed there are no webhook or 
event-handling examples in the playground. I built a reference implementation with 
HMAC verification, SQLite persistence, and real-time SSE streaming — live demo 
here: [vercel url]. Happy to contribute it or use it as a conversation starter."
