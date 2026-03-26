@AGENTS.md

# Project: Community Gap Map

An interactive Mapbox map of NYC community services (offerings) alongside anonymous community-submitted need signals (pulse posts).

## Key files
- `ARCHITECTURE.md` — tech stack, schema, API routes, folder structure, design decisions
- `ROADMAP.md` — full task list with status tracking (update checkboxes as work completes)
- `NOTES.md` — working notes, data source details, open questions, decisions log

## Rules

### Before writing any Next.js code
Read the relevant guide in `node_modules/next/dist/docs/` — this is Next.js 16 which has breaking changes from prior versions. Heed deprecation notices.

### TypeScript
- All new files must be TypeScript. No `.js` files in `src/`.
- Use types from `src/types/index.ts`; extend that file rather than defining duplicate types elsewhere.

### Components
- Mapbox GL must only be used in Client Components (`'use client'`). Never import `mapbox-gl` in a Server Component.
- Server Components fetch data and pass it as props to Client Components — do not use `useEffect` to fetch data that could be fetched server-side.

### Environment variables
- Variables prefixed `NEXT_PUBLIC_` are exposed to the browser — only use this prefix for values that are safe to be public (Supabase URL, anon key, Mapbox token).
- `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` are server-only. Never reference them in Client Components or pass them to the browser.

### Anonymity — non-negotiable constraints
- There is no `description` column in the `pulse` table. Do not add one.
- Never return or log pulse submission content beyond: category, neighborhood label, jittered coordinates, timestamps.
- Pulse API route must apply ±200m jitter server-side before inserting coordinates. Never insert a raw centroid.
- IP addresses must never be written to any database table.

### Availability copy
- The filter toggle label must read exactly **"Open per listed hours"** — not "Open now" or any variation.

### Data freshness
- Every pin tooltip must include the freshness indicator: `"Hours as of [imported_at] · Flag if inaccurate"`.

### Security
- Validate all user input at API route boundaries.
- The pulse submission form includes a honeypot field. If it is non-empty: return HTTP 200 silently, do not insert.
- Rate limiting is enforced in `middleware.ts` via Upstash Redis — do not duplicate this logic inside API routes.
