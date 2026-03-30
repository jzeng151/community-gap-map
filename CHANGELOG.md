# Changelog

## [0.1.1.0] - 2026-03-30

### Added
- NYC Open Data seed pipeline (`scripts/seed_offerings.py`): pulls FacDB (15k+ facilities) and Workforce1 Career Centers (41 records with hours); deduplicates by name/address/category; seeds Supabase via service role key
- Human-readable service type labels on every offering (e.g. "Soup Kitchen / Food Pantry", "Universal Pre-K (DOE)") with per-category color chips in both result cards and pin tooltips
- Hours display in result cards and pin tooltips when `hours_json.text` is present
- Google Maps-style teardrop pin shape — SVG icons loaded per provider type, `icon-anchor: bottom` so tip points at the coordinate
- `CATEGORY_COLORS` constant in `src/types/index.ts` for consistent category-to-color mapping
- `HoursJson` typed interface replacing `Record<string, unknown>` for `hours_json`
- `supabase/migrations/004_services.sql`: adds `services jsonb` column

### Changed
- Search bar now matches against `services` array labels in addition to name and address
- Category and provider filter chips switch from hidden horizontal scroll to `flex-wrap` — all filters visible without scrolling
- Service chips in result cards use `whitespace-nowrap` to prevent mid-text line breaks
- Address and hours text in result cards no longer truncated with ellipsis

### Fixed
- `scripts/seed_offerings.py`: minimum row sanity check (1,000) blocks truncate when Socrata returns partial data due to mid-pagination failure
- `scripts/seed_offerings.py`: `_title()` helper preserves apostrophes (Women's) and known acronyms (NYC, DOE, GED) that `str.title()` corrupts
- `scripts/seed_offerings.py`: `ZeroDivisionError` crash when both sources return zero records
- `MapView.tsx`: async image load errors caught with try/catch + early return so layers are not registered against missing images
- `PinTooltip.tsx`: freshness indicator restored to spec text "Hours as of [date] · Flag if inaccurate" per CLAUDE.md
- `PinTooltip.tsx`: `key={s}` replaced with `key={\`${s}-${i}\`}` to handle duplicate service strings without React key collisions

## [0.2.0] - 2026-03-28

### Added
- Full map dashboard: Mapbox GL JS map with color-coded provider pins, pulse need-dots with clustering, legend, and pin tooltip with freshness indicator
- Finder panel: debounced search bar, category/provider filter chips (OR logic), availability toggle (label: "Open per listed hours"), results list with selected-state highlight
- Pulse feature: anonymous need-signal form with honeypot, pulse feed with flag button, optimistic flagging UI
- UI primitives: Badge, Chip, FAB, BottomSheet (3-state swipeable)
- Responsive layout: desktop sidebar + modal pulse form; mobile bottom sheet + floating controls
- Vitest + @testing-library/react test infrastructure with 29 passing tests
- TESTING.md with framework docs and conventions

### Fixed
- `supabase/migrations/001_schema.sql`: added scalar `lat`/`lng` columns (absence caused zero map pins); removed `description` column from `pulse` table (anonymity violation); `location` is now a generated stored column
- `supabase/migrations/003_functions.sql`: pinned `search_path = public` on `flag_pulse` SECURITY DEFINER function to prevent schema injection
- `MapView.tsx`: XSS — `escapeHtml()` applied to `category` and `neighborhood` before `setHTML()` popup rendering; stale `onOfferingSelect` callback replaced with ref pattern
- `SearchBar.tsx`: switched from uncontrolled `defaultValue` to controlled `useState`/`useEffect` to correctly respond to parent-driven resets

## [0.1.0] - 2026-03-01

### Added
- Initial project scaffolding: Next.js 16 App Router, Tailwind CSS v4, Supabase with PostGIS
- Database schema: `offerings` and `pulse` tables with spatial indexes
- Row-level security policies
- `flag_pulse` RPC function for atomic flag count increments
- Vercel deployment configuration
