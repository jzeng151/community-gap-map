# Roadmap

## Status legend
- [ ] Not started
- [~] In progress
- [x] Done

---

## Person 1 — Infrastructure & CI/CD

- [ ] 1.1 Create Supabase project; enable PostGIS (`create extension postgis`)
- [ ] 1.2 Create `offerings` and `pulse` tables per schema spec (all columns, enums, defaults, GIST indexes)
- [ ] 1.3 Write and apply RLS policies
  - `offerings`: anon SELECT only
  - `pulse`: anon INSERT + SELECT where `status = 'visible'`; service_role for admin ops
- [ ] 1.4 Write Postgres RPC `flag_pulse(id)` — atomic UPDATE…RETURNING; trigger sets `status = 'hidden'` and fires webhook only when `flag_count = 3` exactly
- [ ] 1.5 Configure Supabase webhook → email notification on flag trigger; test with manual flag sequence
- [ ] 1.6 Stand up Upstash Redis instance (free tier); document connection string in NOTES.md
- [ ] 1.7 Set up Vercel project + connect GitHub repo; configure all env vars (see ARCHITECTURE.md)
- [ ] 1.8 Configure CI/CD pipeline — auto-deploy on merge to `main`; preview deploys on PRs; confirm no secrets in preview builds
- [ ] 1.9 Create Supabase Table Editor saved view for moderation queue (`status = 'hidden'`); document access in NOTES.md

---

## Person 2 — Data Pipeline

- [ ] 2.1 Audit NYC Open Data Facilities & Providers API — field coverage by borough/category; document mapping in NOTES.md
- [ ] 2.2 Audit HRA Social Services dataset — same audit; note overlap with Facilities dataset
- [ ] 2.3 Pull NYC Planning NTA boundaries (`geo_export` layer) — extract centroid lat/lng per NTA; compute bounding box diagonal for neighborhoods < 0.5 km²; output as `src/data/nta-centroids.json`
- [ ] 2.4 Write Python import script — normalize fields, classify `provider_type`, dedupe on `(name, address, category)`, keep more-complete hours on conflict
- [ ] 2.5 Implement hours quality check — < 60%: set `availability_status = 'unknown'` + report; < 30%: flag decision to skip availability toggle
- [ ] 2.6 Set `availability_status` at import time; record `imported_at` timestamp
- [ ] 2.7 Run one-time seed into Supabase via service role key; verify row count + spot-check per borough
- [ ] 2.8 Document re-import procedure in NOTES.md (monthly; which fields refresh vs. preserve)

---

## Person 3 — Map Core

- [x] 3.1 Scaffold Next.js project (App Router, Tailwind, TypeScript, folder structure)
- [x] 3.2 Integrate Mapbox GL JS — load map centered on NYC; configure token via env var
- [ ] 3.3 Render service pins from `offerings` — blue = gov, green = npo, orange = mutual-aid; solid = open, dashed outline = closed, gray = unknown
- [ ] 3.4 Pin tooltip — name, address, provider type, availability badge, freshness indicator ("Hours as of [imported_at] · Flag if inaccurate")
- [ ] 3.5 Map legend — always visible, upper-left; all 3 provider colors + open/closed/unknown symbols
- [ ] 3.6 Pulse need-dots layer — semi-transparent circles; fetch visible pulse records; hover shows category + neighborhood only
- [ ] 3.7 Jitter logic for need-dot positioning — ±200m server-side; use NTA bounding box diagonal for neighborhoods < 0.5 km²
- [ ] 3.8 Clustering at zoom < 12 — Mapbox supercluster for need-dots; expand to individual dots at zoom ≥ 12
- [ ] 3.9 Mobile full-screen layout — floating search pill (top), horizontal-scroll filter bar, FAB bottom-center above bottom sheet handle
- [ ] 3.10 FAB "Report an unmet need" — opens Pulse submission form (bottom sheet mobile / sidebar panel desktop)

---

## Person 4 — Finder Feature

- [ ] 4.1 Search bar component — free-text, debounced; accepts service type, neighborhood name, or zip
- [ ] 4.2 Geo-search API route — `POST /api/search`; Supabase + PostGIS `ST_DWithin`; returns offerings sorted by distance
- [ ] 4.3 Category filter chips — Food, Housing, Healthcare, Childcare, Legal, Jobs; multi-select OR
- [ ] 4.4 Provider type filter chips — Government, Nonprofit, Mutual Aid; multi-select OR
- [ ] 4.5 "Open per listed hours" toggle — filters `availability_status = 'open'`; label must read exactly "Open per listed hours"
- [ ] 4.6 Filter logic wiring — `WHERE (category IN [...]) AND (provider_type IN [...])`; default = no filter = show all
- [ ] 4.7 Results sidebar (desktop) — 300px fixed right; sort: open → closed → by `ST_Distance` ASC within group
- [ ] 4.8 Results bottom sheet (mobile) — collapsed at 15% height; drag to 60% for results; full-screen for Pulse form; same sort order
- [ ] 4.9 Result card — name, distance, open/closed badge, provider type tag, address
- [ ] 4.10 Performance — p95 < 3s to first pin; verify with Lighthouse (mobile, 4G throttle); optimize via spatial index/pagination/lazy tiles if needed

---

## Person 5 — Pulse Feature

- [ ] 5.1 NTA neighborhood dropdown — ~200 names from `nta-centroids.json`, alphabetically sorted; no free-text fallback
- [ ] 5.2 Pulse submission form — category dropdown, description textarea (max 280 chars), neighborhood dropdown, honeypot hidden field, "Submit anonymously" button
- [ ] 5.3 Submission API route — validate fields; map neighborhood → NTA centroid + jitter server-side; insert into `pulse`
- [ ] 5.4 IP rate limiting via Vercel middleware — Upstash Redis; reject 429 if > 3/hour; TTL = 1 hour; IP not persisted past TTL
- [ ] 5.5 Honeypot validation — non-empty hidden field → return 200 silently, do not insert
- [ ] 5.6 Pulse feed in sidebar — `status = 'visible'` ordered by `created_at DESC` within map viewport; display: category, neighborhood, time ago only
- [ ] 5.7 Flag button on each Pulse post — calls `flag_pulse(id)` RPC; optimistic UI update; no auth required
- [ ] 5.8 Anonymity audit — no IP in DB; description never in any API response; location = centroid only; neighborhood = verbatim dropdown text
- [ ] 5.9 Pulse form states — loading, success ("Your post was submitted anonymously"), network error, rate-limit ("Try again in an hour")

---

## Shared / Cross-cutting

- [x] X.2 Supabase client setup — `src/lib/supabase.ts`: anon client (frontend) + service client (server routes)
- [ ] X.1 Design system / component tokens — pin colors, chip styles, badge styles (do early so all teams build consistently)
- [ ] X.3 NTA centroid lookup table — `src/data/nta-centroids.json` checked into repo; used by P3 (jitter) and P5 (dropdown)
- [ ] X.4 Integration test: submit Pulse → appears in feed; flag 3×→ hidden; verify no description leak
- [ ] X.5 Integration test: 100+ pins render; freshness tooltip date correct; at least one pin per borough

---

## Sequencing

```
Week 1:  Person 1 (schema + RLS) + Person 2 (data audit + NTA table) + Person 3 (scaffold ✓ → Mapbox)
Week 2:  Person 2 (import script + seed) → unblocks Person 4 + 5 real queries
         Person 3 (pins + legend + pulse dots)
         Person 4 (search bar + filter chips UI — mock data ok)
         Person 5 (submission form UI — mock data ok)
Week 3:  Wire real data; rate limiting; flag flow; integration tests
Week 4:  Performance audit; mobile polish; CI/CD verification; anonymity audit
```
