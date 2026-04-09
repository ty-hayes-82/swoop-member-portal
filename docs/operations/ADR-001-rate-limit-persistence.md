# ADR-001: Rate Limit Persistence Strategy

> **Status:** Proposed
> **Date:** 2026-04-09
> **Owner:** DevOps / Platform
> **Related tickets:** B6 (re-enable onboard-club rate limit), B7 (this ADR)

## Context

`api/lib/rateLimit.js` is an in-memory `Map`-backed rate limiter. On Vercel's
serverless runtime, every cold start gets a fresh JS module instance with an
empty `store`, and concurrent invocations of the same function may run on
different instances. Net effect: the limiter only catches **same-instance,
hot-path abuse**. An attacker hitting the same endpoint repeatedly will be
distributed across instances and effectively bypass the cap.

This is acceptable for friction (slowing accidental form spam) but **does not
satisfy the intent of a rate limit** (preventing brute-force, scraping, or
abuse-pricing). It is currently the only thing standing between
`api/onboard-club.js`, `api/auth.js`, `api/forgot-password.js`, and
`api/reset-password.js` and unbounded abuse.

## Forces

- **Correctness:** A real rate limiter must share state across all serverless
  instances of a function. Local memory does not.
- **Latency:** A Postgres-backed limiter adds an extra DB round trip on every
  guarded call. Authentication endpoints are latency-sensitive.
- **Cost:** Each guarded call should cost ~$0.000001 or less. KV-backed
  limiters at ~$0.30/million ops are tractable; Postgres-backed limiters
  add billed compute time per call.
- **Operability:** The limiter should be observable — operators need to see
  block rates per endpoint and per IP without grepping function logs.
- **Compliance:** No PII in the rate-limit store. IP hashing is preferred.
- **Lock-in:** Vercel KV (Upstash Redis) is currently the path of least
  resistance because we already host on Vercel; abstracting to a
  vendor-agnostic interface is a small premium.

## Options considered

### Option A — Vercel KV (Upstash Redis) — RECOMMENDED
- **How:** `@vercel/kv` package + `INCR` + `EXPIRE` per `(ip, endpoint)` key
- **Pros:**
  - Native to our hosting platform; one-click provisioning in the Vercel dashboard
  - Atomic INCR avoids race conditions
  - Sub-millisecond p50, well below auth-endpoint budget
  - Built-in TTL handles window expiry — no cleanup loop needed
  - $0.20/100k commands at the time of writing
- **Cons:**
  - Adds a vendor dependency on Upstash
  - One more env var to configure (`KV_REST_API_URL`, `KV_REST_API_TOKEN`)
  - Not portable to non-Vercel hosting without porting effort

### Option B — Vercel Postgres-backed
- **How:** A `rate_limit_buckets` table with `(key TEXT PRIMARY KEY, count INT, reset_at TIMESTAMPTZ)`. UPSERT on each call.
- **Pros:**
  - No new vendor — uses our existing DB
  - Persistent and queryable for ops dashboards
- **Cons:**
  - Adds a write to the auth path on every call (Postgres write latency 5-30ms p50)
  - Postgres connection pool pressure under sustained traffic
  - We'd need to clean up expired buckets on a schedule
  - DB outage knocks out auth — couples two failure domains

### Option C — Cloudflare Workers / Edge Middleware
- **How:** Move auth endpoints to Edge runtime, use Cloudflare's native rate limiting
- **Pros:**
  - Free, included in the platform
  - Runs before the function executes (cheapest possible block)
- **Cons:**
  - Significant migration effort — Edge runtime has different APIs and constraints
  - Requires a Cloudflare account, possibly fronting Vercel
  - Not on the critical path for productionization

### Option D — Status quo (in-memory)
- **Pros:** No work
- **Cons:** Doesn't actually rate limit. Accepting this is a security debt that
  must be disclosed in any pen-test or compliance review.

## Decision

**Adopt Option A (Vercel KV / Upstash Redis)** before the first paid pilot's
production traffic ramps up. Option B is the contingency if the team explicitly
wants to avoid a new vendor.

## Implementation plan

1. **Provision** Vercel KV via the dashboard. Add `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` to `.env.example` and the Vercel project's environment
   variables (production + preview).
2. **Add `@vercel/kv`** to `package.json` dependencies.
3. **Refactor `api/lib/rateLimit.js`** to export the same `rateLimit(req, opts)`
   signature but back it with KV. Behavior:
   ```js
   const key = `rl:${hash(ip)}:${endpoint}`;
   const count = await kv.incr(key);
   if (count === 1) await kv.expire(key, windowSec);
   if (count > maxAttempts) return { limited: true, retryAfter: ... };
   ```
   Use a SHA-256 hash of the IP rather than the raw IP — IPs are PII in some
   jurisdictions and we don't need the cleartext for the limit check.
4. **Fall back to in-memory** if `KV_REST_API_URL` is unset (for local
   development) — log a single warning per cold start so operators know.
5. **Add a metrics counter:** export the limit/block counts to function logs
   in a structured format so they can be aggregated downstream.
6. **Update RUNBOOK.md** § 6 "Monitoring" to include rate-limit dashboards.
7. **Add a unit test** for the KV-backed path (mock `@vercel/kv`).
8. **Smoke test in dev preview** before promoting to production.

## Consequences

- **Positive:**
  - Real rate limits across all function instances
  - Zero-config local dev still works (in-memory fallback)
  - Operationally observable
  - Closes the abuse vector before paid pilots
- **Negative:**
  - One more env var, one more dependency
  - +1 KV round trip per guarded call (~1ms)
  - $$ for KV usage at scale (negligible until pilot count > 100)
- **Neutral:**
  - Future Edge migration (Option C) is still possible — KV is also Edge-
    accessible
  - The `api/lib/rateLimit.js` interface stays the same; callers don't change

## Open questions

- Should `req.url` be normalized before being included in the key?
  (e.g., `/api/auth?foo=1` vs `/api/auth?foo=2` should share a limit)
- Should we expose a "trusted IP" allowlist for known monitoring services?
- What's the right alert threshold for "too many blocks per minute on
  /api/auth"? (Indicates active credential stuffing.)

## References

- [Vercel KV docs](https://vercel.com/docs/storage/vercel-kv)
- `api/lib/rateLimit.js` — current implementation
- `api/onboard-club.js` line 33-39 — first guarded endpoint (re-enabled in B6)
- `docs/operations/RUNBOOK.md` § 6 — monitoring TODOs
