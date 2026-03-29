# Notes

Working notes, decisions, open questions, and operational details.
Update this file as the project progresses.

---

## Open questions

- [ ] What NYC borough(s) should v1 cover? Full five boroughs or a pilot area?
- [ ] Who is the product owner receiving flag notification emails?
- [ ] Should `offerings` support multiple categories per provider, or is one category per row the right model?
- [ ] Do we need i18n (Spanish is common in many NYC neighborhoods)?
- [ ] Mapbox free tier limits — confirm monthly active users estimate vs. map load quota

---

## Data sources

### NYC Open Data — Facilities Database (FacDB)
- **Resource ID:** `ji82-xba5`
- **URL:** `https://data.cityofnewyork.us/resource/ji82-xba5.json`
- **Status:** Audited 2026-03-29. Import script: `scripts/seed_offerings.py`.
- **Record count:** 15,425 after filtering (16,591 raw → 233 skipped no coords → 933 deduped)
- **Category mapping (facsubgrp → category):**
  - `SOUP KITCHENS AND FOOD PANTRIES`, `CHILD NUTRITION` → `food` (2,569)
  - `NON-RESIDENTIAL HOUSING AND HOMELESS SERVICES` → `housing` (253)
  - `HOSPITALS AND CLINICS`, `MENTAL HEALTH`, `SUBSTANCE USE DISORDER TREATMENT PROGRAMS`, etc. → `healthcare` (3,169)
  - `DAY CARE`, `DOE UNIVERSAL PRE-KINDERGARTEN`, `AFTER-SCHOOL PROGRAMS`, `PRESCHOOLS FOR STUDENTS WITH DISABILITIES` → `childcare` (5,204)
  - `LEGAL AND INTERVENTION SERVICES` → `legal` (266)
  - `WORKFORCE DEVELOPMENT`, `YOUTH CENTERS...`, `GED...`, `ADULT AND IMMIGRANT LITERACY` → `jobs` (3,964)
- **Provider type:** `optype = 'Public'` → `gov`; `Non-public`/blank → `npo`. No mutual-aid in FacDB.
- **Hours:** FacDB has no hours. All records get `availability_status = 'unknown'`, `hours_json = null`.
- **Coordinates:** Direct `latitude`/`longitude` string fields. Records with `0.0` skipped.

### NYC SBS Workforce1 Career Centers
- **Resource ID:** `6smc-7mk6`
- **URL:** `https://data.cityofnewyork.us/resource/6smc-7mk6.json`
- **Status:** Included in `scripts/seed_offerings.py`. 41 records, all with hours.
- **Hours format:** Plain text `"Mon - Fri: 8:30 AM - 5:00 PM; Sat: 9:00 AM - 1:00 PM"` — parsed into `{"schedule": [{"days": "...", "hours": "..."}], "text": "..."}`.
- **Category:** `jobs`, `provider_type`: `gov`. Merged before FacDB in pipeline so Workforce1 hours survive dedup.

### HRA Social Services dataset
- **Status:** Superseded by FacDB, which already includes HRA-source records. No separate import needed.

### NYC Planning NTA boundaries
- **Layer:** `geo_export`
- **Output file:** `src/data/nta-centroids.json`
- **Format:** `{ [ntaName: string]: { lat: number, lng: number, bboxDiagonalKm: number } }`
- **Status:** Not yet pulled

---

## Infrastructure

### Supabase
- **Project URL:** (fill in after creation)
- **Anon key:** stored in Vercel env vars as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service role key:** stored in Vercel env vars as `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- **Moderation queue access:** Supabase Table Editor → `pulse` table → filter `status = 'hidden'`; share direct link with product owner

### Upstash Redis
- **Instance:** (fill in after creation)
- **Connection:** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel env vars
- **Usage:** IP rate limiting only; keys are `ratelimit:ip:<hashed-ip>`; TTL = 3600s; max 3 hits per window

### Vercel
- **Project:** (fill in after creation)
- **Env var exposure check:** `NEXT_PUBLIC_` prefixed vars are intentionally public; all others must be server-only
- **Preview build check:** confirm service role key and Redis token are not accessible in preview build client bundles

---

## Data pipeline notes

### Import script decisions
- Dedupe key: `(name, address, category)` — on conflict, keep record with more complete `hours_json`
- `provider_type` classification logic: TBD (document heuristics here after audit)
- `availability_status` logic: parse hours where present; < 60% hours coverage → set `unknown`; < 30% → skip availability toggle entirely
- `imported_at` is set at script run time, not per-record fetch time

### Re-import procedure (monthly)
1. Run Python import script against latest NYC Open Data snapshot
2. Use service role key for upsert
3. Fields that refresh: `name`, `address`, `hours_json`, `availability_status`, `imported_at`
4. Fields that are preserved: `id`, `flagged` (manual flags survive re-import)
5. Verify row count delta; spot-check 5 records per borough

---

## Anonymity guarantees (audit checklist)

- [ ] No IP address written to any DB table
- [ ] Description field from submission form is never stored (no `description` column in `pulse` table)
- [ ] Pulse API response never includes description (there is none to include)
- [ ] `lat`/`lng` in `pulse` is jittered centroid, not user-provided location
- [ ] Neighborhood label stored as verbatim dropdown text (NTA name), not reverse-geocoded from coordinates
- [ ] Redis rate limit key uses IP but Redis TTL = 1 hour; after expiry no trace remains

---

## Design decisions log

| Date | Decision | Reason |
|---|---|---|
| 2026-03-25 | No `description` column in `pulse` table | Primary anonymity guarantee; free text could enable re-identification |
| 2026-03-25 | Server-side jitter before insert | Frontend never receives true centroid; prevents location triangulation |
| 2026-03-25 | NTA dropdown only, no free text | Prevents re-identification; ~200 names is usable UX |
| 2026-03-25 | "Open per listed hours" label | Avoids implying real-time data accuracy we don't have |
| 2026-03-25 | Freshness indicator mandatory on tooltips | Users must understand data age; data is updated monthly |
