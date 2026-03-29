# Changelog

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
