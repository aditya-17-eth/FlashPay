<p align="center">
  <h1 align="center">⚡ FlashPay</h1>
  <p align="center"><strong>Pay-Per-Use AI Toolkit on Stellar</strong></p>
  <p align="center">
    AI tools for everyone — no subscription, no account, just Freighter wallet<br/>
    and a fraction of a cent per task, settled on Stellar.
  </p>
</p>

<p align="center">
  <a href="https://github.com/aditya-17-eth/FlashPay/actions/workflows/contracts-ci.yml">
    <img src="https://github.com/aditya-17-eth/FlashPay/actions/workflows/contracts-ci.yml/badge.svg" alt="Contracts CI" />
  </a>
  <a href="https://github.com/aditya-17-eth/FlashPay/actions/workflows/frontend-ci.yml">
    <img src="https://github.com/aditya-17-eth/FlashPay/actions/workflows/frontend-ci.yml/badge.svg" alt="Frontend CI" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
  <img src="https://img.shields.io/badge/Stellar-Testnet-brightgreen" alt="Stellar Testnet" />
  <img src="https://img.shields.io/badge/Soroban_SDK-23.4.1-purple" alt="Soroban SDK" />
  <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/x402-Protocol-orange" alt="x402 Protocol" />
</p>

---

## What is FlashPay?

FlashPay is a **consumer-facing dApp** where users access AI tools and pay per use via micro-USDC payments on Stellar. No subscription. No credit card. No account creation. Just connect [Freighter wallet](https://www.freighter.app/) and go.

The payment layer uses the **[x402 HTTP payment protocol](https://github.com/coinbase/x402)** (open-sourced by Coinbase) running on a **Soroban smart contract** for trustless USDC escrow — if the AI fails, you get an instant refund.

---

## 🌐 Demo App

🔗 **Live app:** https://flash-payx402.vercel.app/

---

## 🛠️ The Five Tabs

| Tab                | Tool               | Price      | AI Backend                               | What You Provide       |
| ------------------ | ------------------ | ---------- | ---------------------------------------- | ---------------------- |
| `/tools/image`     | 🎨 Image Generator | 0.005 USDC | black-forest-labs/FLUX.1-schnell         | Text prompt            |
| `/tools/summarise` | 📝 Text Summariser | 0.001 USDC | [Groq](https://groq.com) — Llama 3.3 70B | Pasted text + mode     |
| `/tools/pdf`       | 📄 PDF Analyser    | 0.002 USDC | Groq — Llama 3.3 70B                     | PDF upload + question  |
| `/tools/code`      | 💻 Code Generator  | 0.003 USDC | Groq — Llama 3.3 70B                     | Description + language |
| `/assistant`       | 🤖 AI Assistant    | **Free**   | Groq — Llama 3.3 70B                     | Chat message           |

The **AI Assistant** is a free chat that helps users decide which tool to use — it suggests tools via clickable cards but **never fires payments autonomously**.

---

## ⚡ How It Works — x402 Payment Flow

```
1. User clicks action button (Generate / Run / Analyse)
2. Frontend POST → /api/tools/{tool}
3. Backend returns HTTP 402 with price + nonce + contract ID
4. x402 middleware intercepts → Freighter popup: "Approve X USDC?"
5. User approves → Soroban lock_payment() invoked on-chain
6. Frontend polls for tx confirmation
7. Frontend retries request with x-payment-nonce header
8. Backend verifies payment on-chain → calls AI API
9. Backend calls release_payment() (or refund_payment() on error)
10. Result displayed to user
```

**Key guarantee:** If the AI call fails after payment is locked, `refund_payment()` is called immediately — **no funds are ever permanently locked**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User (Browser)                       │
│  Freighter Wallet  ←→  Next.js 14 Frontend (Vercel)     │
└────────────┬────────────────────────┬───────────────────┘
             │ x402 (HTTP 402)        │ Wallet Sign
             ▼                        ▼
┌─────────────────────┐   ┌──────────────────────────────┐
│  Next.js API Routes │   │  Soroban Smart Contract      │
│  (Serverless)       │   │  (Stellar Testnet)           │
│                     │   │                              │
│  • /api/tools/*     │──▶│  • lock_payment()            │
│  • /api/assistant   │   │  • release_payment()         │
│  • /api/feebump     │   │  • refund_payment()          │
│  • /api/metrics     │   │  • get_stats() / get_users() │
└────────┬────────────┘   └──────────────────────────────┘
         │
    ┌────┴─────┐    ┌──────────┐
    │  Groq    │    │ Supabase │
    │ (LLM)    │    │ (Metrics)│
    └──────────┘    └──────────┘
    ┌──────────┐
    │FLUX.1    │
    │ (Images) │
    └──────────┘
```

---

## 📁 Repository Structure

```
flashpay/
├── contracts/                    # Soroban smart contract (Rust)
│   ├── Cargo.toml
│   └── flashpay-escrow/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs            # lock_payment, release_payment, refund_payment, get_stats
│           ├── storage.rs        # Storage key definitions
│           ├── events.rs         # Event emission (lock, release, refund)
│           ├── errors.rs         # Custom contract errors
│           └── test.rs           # 9 unit tests
├── frontend/                     # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── tools/                # 4 paid tool pages
│   │   ├── assistant/            # Free AI assistant chat
│   │   ├── dashboard/            # Metrics & transaction monitoring
│   │   └── api/                  # 9 API routes (tools, assistant, feebump, metrics, etc.)
│   ├── components/               # Reusable UI (PaymentGate, ChatInterface, etc.)
│   ├── lib/                      # Stellar, Groq, Supabase, Sentry helpers
│   └── middleware.ts             # Rate limiting
├── docs/
│   ├── security.md               # Security checklist
│   ├── architecture.md           # Architecture overview
│   └── x402-spec.md              # x402 protocol specification
├── .github/workflows/
│   ├── contracts-ci.yml          # Rust build + test + testnet deploy
│   └── frontend-ci.yml           # Node build + test + Playwright
├── LICENSE                       # MIT
└── README.md
```

---

## 🧰 Tech Stack

| Layer          | Technology                             | Purpose                                |
| -------------- | -------------------------------------- | -------------------------------------- |
| Smart Contract | Rust + `soroban-sdk 23.4.1`            | Trustless USDC escrow                  |
| Frontend       | Next.js 14, TypeScript, Tailwind CSS 3 | UI + routing                           |
| Wallet         | `@stellar/freighter-api`               | Transaction signing                    |
| Text AI        | Groq API (Llama 3.3 70B) — free tier   | Summarise, PDF, Code, Assistant        |
| Image AI       | black-forest-labs/FLUX.1-schnell       | Image generation                       |
| Database       | Supabase                               | Users, transactions, dashboard metrics |
| Monitoring     | Sentry + Winston                       | Error tracking + structured logging    |
| CI/CD          | GitHub Actions + Vercel                | Auto-test + auto-deploy                |
| Data Fetching  | React Query (TanStack v5)              | Polling, caching                       |
| Charts         | Recharts                               | Dashboard visualizations               |

---

## 📸 Screenshots

Landing Page ![Landing Page](assets/landing-page.png)
AI Assistant ![AI Assistant](assets/ai-assistant.png)
Dashboard ![Dashboard](assets/dashboard.png)

Mobile View

<img src="assets/mobile-view.jpeg" width="40%">

---

## 🎬 Demo Video

> _A walkthrough video demonstrating the full x402 payment flow — from wallet connection to AI tool usage and refund._

🔗 **Video link:** _https://youtu.be/uwUJiIQjnYE_

---

## 🔄 CI/CD Pipelines

The project runs two independent GitHub Actions workflows to ensure quality across the entire stack:

| Workflow                              | Trigger       | What it validates                                                                                                                                                                       |
| ------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend CI** (`frontend-ci.yml`)   | Any push / PR | Installs Node.js 20 + pnpm 9, injects mock environment variables, runs `pnpm build` for production bundle, and executes `pnpm test`                                                     |
| **Contracts CI** (`contracts-ci.yml`) | Any push / PR | Installs Rust + `wasm32-unknown-unknown` target, builds each Soroban contract to WASM, runs `cargo test`, and auto-deploys to Stellar Testnet on `main` (when secret key is configured) |

Both pipelines must pass before a pull request can be merged.

---

## 🚀 Quick Start

### Prerequisites

| Tool                                                                                     | Version | Purpose                    |
| ---------------------------------------------------------------------------------------- | ------- | -------------------------- |
| [Node.js](https://nodejs.org/)                                                           | 20+     | Frontend runtime           |
| [pnpm](https://pnpm.io/)                                                                 | 9+      | Package manager            |
| [Rust](https://rustup.rs/)                                                               | stable  | Smart contract compilation |
| [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli) | latest  | Contract build & deploy    |
| [Freighter](https://www.freighter.app/)                                                  | latest  | Browser wallet extension   |

### 1. Clone & Install

```bash
git clone https://github.com/aditya-17-eth/FlashPay.git
cd FlashPay
```

### 2. Smart Contract

```bash
# Build the WASM binary
cd contracts
stellar contract build

# Run all 9 unit tests
cargo test

# Deploy to testnet (requires funded keypair)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/flashpay_escrow.wasm \
  --source-account $STELLAR_SECRET_KEY \
  --network testnet

# Initialize with USDC SAC + your payee wallet
stellar contract invoke \
  --id $CONTRACT_ID \
  --source-account $STELLAR_SECRET_KEY \
  --network testnet \
  -- initialize \
  --usdc_token GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 \
  --payee $YOUR_PUBLIC_KEY
```

### 3. Frontend

```bash
cd frontend

# Copy environment template and fill in your keys
cp .env.local.example .env.local
# Edit .env.local — add: contract ID, Groq API key, Supabase keys, etc.

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser with Freighter installed.

### 4. Supabase Setup

Create the following tables in your Supabase project (see [docs/architecture.md](docs/architecture.md)):

- `users` — wallet addresses, first/last seen
- `transactions` — every tool payment with nonce, tool, amount, status
- `metrics_snapshots` — daily rollup for dashboard charts

Enable Row Level Security with public read-only policies.

---

## 💬 User Feedback

> _User feedback Excel link:_

| User          | Feedback      | Rating     |
| ------------- | ------------- | ---------- |
| _placeholder_ | _placeholder_ | ⭐⭐⭐⭐⭐ |
| _placeholder_ | _placeholder_ | ⭐⭐⭐⭐⭐ |
| _placeholder_ | _placeholder_ | ⭐⭐⭐⭐⭐ |

---

## 🔒 Security

See the full checklist in [docs/security.md](docs/security.md). Key highlights:

- **Smart Contract:** `require_auth()` on all mutable calls, nonce deduplication, refund on failure
- **Backend:** Server-side price enforcement, Zod validation, rate limiting (20 req/min), PDFs never written to disk
- **Frontend:** Freighter-only key management, Sentry strips wallet addresses, CSP headers
- **Secrets:** All API keys server-side only; `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FEE_SPONSOR_SECRET_KEY` never exposed in client bundle

---

## 🌟 What Makes It Novel

- **First consumer-facing dApp** using x402 HTTP payment protocol on Stellar
- **Real users, real tools, real USDC transactions** — not a demo
- x402 demonstrated in both **human-triggered AND agent-assisted** modes simultaneously
- **Refund mechanism in Soroban** — production-safe, no locked funds on AI failure
- **Groq + Pollinations = zero API cost** during judge review period

---

## 📚 Documentation

- [Architecture Overview](docs/architecture.md) — system design and payment flow
- [Security Checklist](docs/security.md) — smart contract, backend, and frontend security
- [x402 Protocol Spec](docs/x402-spec.md) — HTTP 402 headers and flow

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <strong>FlashPay —  Open Track — MIT License — March 2026</strong>
</p>
