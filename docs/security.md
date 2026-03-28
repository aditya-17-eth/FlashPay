# FlashPay — Security Checklist

> Complete security audit checklist. All items must be verified before mainnet deployment.

---

## Smart Contract

- [x] `payer.require_auth()` on `lock_payment` — no one can lock funds on behalf of another
- [x] `payee.require_auth()` on `release_payment` and `refund_payment`
- [x] Nonce deduplication in temporary storage — prevents replay attacks
- [x] Nonce expiry: reject nonces older than 60 seconds (timestamp verified in contract)
- [x] `refund_payment()` implemented — no funds ever permanently locked on AI failure
- [x] TTL extensions on all persistent storage — prevents data loss from archival
- [ ] External audit before mainnet deployment

## Backend / API Routes

- [x] Server-side price enforcement — `TOOL_PRICES` in backend only, never trust frontend amount
- [x] PDF: never written to disk, discarded immediately after text extraction
- [x] Groq/Pollinations API keys server-side only (never in `NEXT_PUBLIC_` vars)
- [x] All inputs validated with Zod before any processing
- [x] Rate limiting: 20 req/min per IP on paid tools, 30 req/min on assistant
- [x] HTML tags stripped from all text inputs before processing
- [x] Prompt injection prevention: system prompt prepended, user input never in system role
- [x] PDF upload: MIME type validated as `application/pdf`, max 10 MB enforced
- [x] Wallet addresses: 56 chars, must start with `G`
- [x] CORS restricted to known frontend origin
- [x] HTTPS enforced, HSTS header set via Next.js config

## Frontend

- [x] Freighter only — private keys never touch the app
- [x] Fee bump API validates contract ID whitelist — rejects unknown contracts
- [x] Sentry strips wallet addresses from all error payloads
- [x] No user content rendered as dangerouslySetInnerHTML (XSS prevention)
- [x] CSP headers configured in `next.config.mjs`

## Keys & Secrets

- [x] `GROQ_API_KEY` — server-side API route only
- [x] `SUPABASE_SERVICE_ROLE_KEY` — server-side only
- [x] `FEE_SPONSOR_SECRET_KEY` — server-side only
- [x] `STELLAR_SECRET_KEY` — only in CI secrets, never in code
- [ ] `git log -p | grep -i secret` returns nothing (verify before each release)

## Monitoring

- [x] Sentry captures: Groq API errors, Pollinations fetch failures, Soroban invocation failures, Supabase write failures, Freighter connection errors, PDF parse failures, payment timeout errors
- [x] Winston structured JSON logging on every API route: request metadata, payment details (nonce only, never full wallet), AI call latency, release/refund outcome

---

*Last reviewed: March 2026*
