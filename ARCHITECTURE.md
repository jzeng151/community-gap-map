# Architecture

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16.2.1 (App Router) | See `AGENTS.md` — read Next.js docs before writing code |
| UI | React 19 + Tailwind CSS v4 | Tailwind v4 uses `@import "tailwindcss"` not `@tailwind` directives |
| Map | Mapbox GL JS 3.x | Loaded client-side only; token via env var |
| Database | Supabase (Postgres + PostGIS) | Spatial queries via `ST_DWithin`, `ST_Distance`; GIST indexes required |
| Caching / rate limiting | Upstash Redis | IP rate limiting in Vercel middleware only; IPs not persisted to DB |
| Hosting | Vercel | Auto-deploy on merge to `main`; preview deploys on PRs |
| Language | TypeScript 5 | Strict mode |

---

## Environment variables

| Variable | Scope | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (browser + server) | Supabase anon client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser + server) | Supabase anon client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — never expose to browser | Service client, import scripts |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Public (browser) | Mapbox GL JS map init |
| `UPSTASH_REDIS_REST_URL` | Server only | Vercel middleware rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Server only | Vercel middleware rate limiting |

---

## Folder structure

```
src/
  app/
    api/
      search/route.ts          # Geo-search (ST_DWithin) — Person 4
      pulse/route.ts           # Pulse submission — Person 5
    layout.tsx
    page.tsx                   # Map shell
    globals.css
  components/
    map/
      MapView.tsx              # Mapbox GL wrapper (client component)
      PinLayer.tsx             # offerings pins
      PulseLayer.tsx           # pulse need-dots
      Legend.tsx               # always-visible upper-left legend
      PinTooltip.tsx           # offering tooltip with freshness
    finder/
      SearchBar.tsx
      CategoryChips.tsx
      ProviderTypeChips.tsx
      AvailabilityToggle.tsx
      ResultsSidebar.tsx       # desktop 300px right
      ResultsBottomSheet.tsx   # mobile
      ResultCard.tsx
    pulse/
      PulseForm.tsx            # submission form
      PulseFeed.tsx            # sidebar feed
      PulseCard.tsx
      FlagButton.tsx
    ui/                        # shared design system tokens
      Badge.tsx
      Chip.tsx
      BottomSheet.tsx
      FAB.tsx
  lib/
    supabase.ts                # anon + service clients (exists)
    redis.ts                   # Upstash Redis client
    jitter.ts                  # ±200m server-side jitter util
    nta.ts                     # NTA centroid lookup helpers
  data/
    nta-centroids.json         # { [ntaName]: { lat, lng, bboxDiagonalKm } }
  types/
    index.ts                   # Offering, PulsePost, enums, color maps (exists)
middleware.ts                  # IP rate limiting (Vercel Edge)
```

---

## Database schema

### `offerings` table

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` DEFAULT gen_random_uuid() | PK |
| `name` | `text NOT NULL` | |
| `category` | `category_enum NOT NULL` | food, housing, healthcare, childcare, legal, jobs |
| `provider_type` | `provider_type_enum NOT NULL` | gov, npo, mutual-aid |
| `address` | `text` | nullable |
| `lat` | `float8 NOT NULL` | |
| `lng` | `float8 NOT NULL` | |
| `location` | `geometry(Point, 4326)` | computed from lat/lng; GIST index |
| `hours_json` | `jsonb` | nullable; typed as `HoursJson { text: string; schedule?: [...] }` |
| `services` | `jsonb` | nullable; string array of human-readable service labels (e.g. `["Universal Pre-K (DOE)"]`) |
| `availability_status` | `availability_enum NOT NULL` DEFAULT 'unknown' | open, closed, unknown |
| `data_source` | `text` | nullable |
| `imported_at` | `timestamptz NOT NULL` DEFAULT now() | |
| `flagged` | `boolean NOT NULL` DEFAULT false | |

RLS: anon SELECT only.

### `pulse` table

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` DEFAULT gen_random_uuid() | PK |
| `category` | `category_enum NOT NULL` | |
| `neighborhood` | `text NOT NULL` | verbatim NTA name from dropdown |
| `lat` | `float8 NOT NULL` | jittered centroid |
| `lng` | `float8 NOT NULL` | jittered centroid |
| `location` | `geometry(Point, 4326)` | computed; GIST index |
| `created_at` | `timestamptz NOT NULL` DEFAULT now() | |
| `flag_count` | `int NOT NULL` DEFAULT 0 | |
| `status` | `pulse_status_enum NOT NULL` DEFAULT 'visible' | visible, hidden |

RLS: anon INSERT (no description in schema — never stored); anon SELECT where `status = 'visible'`; service_role unrestricted.

> **Note:** There is intentionally no `description` column in `pulse`. The submission form collects free text for context but it is **not stored**. This is the primary anonymity guarantee.

### Postgres RPC: `flag_pulse(post_id uuid)`

```sql
-- Atomically increments flag_count.
-- Sets status = 'hidden' and fires webhook only when flag_count reaches 3 exactly.
-- Returns the new flag_count.
```

---

## API routes

### `POST /api/pulse`
- Validates category, neighborhood, honeypot field
- Maps neighborhood → NTA centroid (from `nta-centroids.json`)
- Applies ±200m jitter server-side
- Inserts into `pulse` (no description stored)
- Rate-limited upstream by middleware

### `GET /api/search?q=...&lat=...&lng=...&categories=...&providers=...&open=true`
- Uses Supabase service client + PostGIS `ST_DWithin`
- Returns offerings sorted by distance, open first
- Accepts optional category/provider filters (OR within group, AND between groups)

---

## Key design decisions

1. **No description stored in DB** — free-text in submission form is discarded server-side; only category + neighborhood + jittered coordinates are persisted.
2. **Server-side jitter** — pulse dot positions are offset ±200m before insertion; frontend never receives the true centroid.
3. **NTA dropdown only** — no free-text neighborhood input and no reverse geocoding; this prevents re-identification.
4. **IP rate limiting in middleware** — IPs checked against Redis TTL counter but never written to DB; Redis TTL = 1 hour.
5. **Freshness indicator is mandatory** — every pin tooltip must show "Hours as of [imported_at]" so users understand data age.
6. **Availability label** — must read "Open per listed hours" (not "Open now") to avoid implying real-time data.
7. **Mapbox client-only** — `MapView` is a Client Component; server components fetch data and pass it as props.
8. **Teardrop pins** — SVG icons generated per `ProviderType` color, loaded via `map.addImage()` before `addLayer()`. Uses `symbol` layer with `icon-image: ['concat', 'pin-', provider_type]` expression. Falls back gracefully (early return) if image load fails.
9. **Data pipeline** — `scripts/seed_offerings.py` pulls FacDB + Workforce1 from NYC Open Data Socrata API. Minimum 1,000 row sanity check blocks truncate on partial fetch. Run monthly via service role key.
