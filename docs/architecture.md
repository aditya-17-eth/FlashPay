# FlashPay Architecture

> Pay-per-use AI toolkit built on Stellar with x402 micropayments

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User (Browser)                         │
│                                                             │
│  ┌───────────┐    ┌──────────────────────────────────────┐  │
│  │ Freighter  │◄──►│         Next.js 14 Frontend          │  │
│  │  Wallet    │    │     (Vercel — App Router + SSR)       │  │
│  └───────────┘    └──────────────┬───────────────────────┘  │
└──────────────────────────────────┼──────────────────────────┘
                                   │
                    ┌──── HTTP 402 ─┤── x-payment-nonce ────┐
                    ▼              ▼                        ▼
        ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
        │  Next.js API      │  │   Soroban     │  │    Stellar       │
        │  Routes           │  │   Contract    │  │    Horizon/RPC   │
        │  (Serverless)     │  │  (Testnet)    │  │    (Testnet)     │
        │                   │  │              │  │                  │
        │ /api/tools/*      │──► lock_payment │  │  Tx confirmation │
        │ /api/assistant    │  │ release_pmt  │  │  Contract data   │
        │ /api/feebump      │  │ refund_pmt   │  │                  │
        │ /api/metrics      │  │ get_stats    │  │                  │
        │ /api/users        │  │ get_users    │  │                  │
        │ /api/transactions │  │              │  │                  │
        └────────┬──────────┘  └──────────────┘  └──────────────────┘
                 │
       ┌─────────┼──────────┐
       ▼         ▼          ▼
┌───────────┐ ┌────────┐ ┌───────────┐
│   Groq    │ │Pollin. │ │  Supabase │
│ Llama 3.3 │ │  .ai   │ │    DB     │
│ 70B (Free)│ │ (Free) │ │ (Metrics) │
└───────────┘ └────────┘ └───────────┘
```

---

## Component Layers

### 1. Frontend — Next.js 14 App Router (Vercel)

- **7 pages:** Landing, 4 tool pages, AI assistant, dashboard
- **Wallet integration:** `@stellar/freighter-api` for connect + tx signing
- **x402 client:** `lib/stellar.ts` — wraps all tool API calls with payment intercept
- **State management:** React Query (TanStack v5) for data fetching + polling
- **Styling:** Tailwind CSS 3, dark theme, mobile-responsive (375px+)

### 2. Backend — Next.js API Routes (Serverless)

- **9 API routes** handling tool execution, assistant chat, fee bumping, and metrics
- **Input validation:** Zod schemas on every endpoint
- **Rate limiting:** Next.js middleware — 20 req/min (tools), 30 req/min (assistant)
- **Payment verification:** Server-side on-chain check via `get_payment(nonce)`
- **Price enforcement:** `TOOL_PRICES` constant — never trust frontend amounts
- **Logging:** Winston structured JSON logs on every operation

### 3. Smart Contract — Soroban (Stellar Testnet)

- **Trustless USDC escrow** using Stellar Asset Contract (SAC)
- **Three mutable functions:** `lock_payment()`, `release_payment()`, `refund_payment()`
- **Authorization:** `require_auth()` on all mutable calls — Soroban native auth
- **Nonce deduplication:** Temporary storage with TTL prevents replay attacks
- **Per-tool counters:** Stats struct tracks image, summarise, pdf, code counts
- **User registry:** Unique payer addresses stored in instance storage
- **Events:** Emitted on lock, release, and refund for off-chain indexing

### 4. Database — Supabase

- **`users` table:** Wallet addresses, first/last seen timestamps
- **`transactions` table:** Nonce, tool, payer, amount, status (pending/released/refunded)
- **`metrics_snapshots` table:** Daily rollup for dashboard charts
- **RLS enabled:** Public read-only, all writes via server-side service role key

### 5. AI APIs (Both Free)

| Service | Used For | Cost |
|---|---|---|
| Groq (Llama 3.3 70B) | Text summariser, PDF analyser, code generator, AI assistant | Free — 14,400 req/day |
| Pollinations.ai | Image generation | Free — no key required |

### 6. Monitoring

- **Sentry:** Client + server error tracking with wallet address scrubbing
- **Winston:** Structured JSON logging — request metadata, payment nonces, AI latency
- **Dashboard:** Real-time metrics from Supabase displayed on `/dashboard`

---

## Payment Flow — x402 HTTP Protocol

```
Frontend                    Backend                   Soroban             AI API
   │                          │                         │                   │
   │─── POST /api/tools/X ───►│                         │                   │
   │                          │                         │                   │
   │◄── HTTP 402 + nonce ─────│                         │                   │
   │                          │                         │                   │
   │── Freighter sign ───────────► lock_payment() ──────►│                   │
   │                          │                         │                   │
   │── Poll for confirmation ─────────────────────────► │                   │
   │◄── Confirmed ────────────────────────────────────── │                   │
   │                          │                         │                   │
   │── POST + nonce header ──►│                         │                   │
   │                          │── verify on-chain ─────►│                   │
   │                          │◄── payment valid ───────│                   │
   │                          │                         │                   │
   │                          │── call AI ──────────────────────────────────►│
   │                          │◄── result ──────────────────────────────────│
   │                          │                         │                   │
   │                          │── release_payment() ───►│                   │
   │                          │                         │                   │
   │◄── Result ───────────────│                         │                   │
   │                          │                         │                   │
   │         (On AI error: refund_payment() is called instead)              │
```

---

## Fee Sponsorship

Users with 0 XLM can still use FlashPay (they only need USDC). The `/api/feebump` endpoint:

1. Receives the user's inner transaction XDR
2. Validates it only calls `lock_payment` on the FlashPay contract
3. Rate limits: max 5 fee-bumped txns per wallet per hour
4. Wraps in a fee-bump transaction signed by the sponsor keypair
5. Submits to network — user pays 0 XLM in fees

---

*For security details, see [security.md](security.md). For x402 protocol details, see [x402-spec.md](x402-spec.md).*
