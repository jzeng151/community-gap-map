# Testing

100% test coverage is the goal — tests let you move fast, trust your instincts, and ship with confidence. Without them, vibe coding is yolo coding. With tests, it's a superpower.

## Framework

**vitest v3** + **@testing-library/react** + **jsdom**

## Running tests

```bash
npm test          # single run
npm run test:watch  # watch mode
```

Test files live in `src/__tests__/`.

## Test layers

### Unit tests (`src/__tests__/*.test.tsx`)
Components and utilities tested in isolation. Mock all external dependencies (fetch, Supabase, Mapbox).

### Integration tests (future)
Full user flows: submit pulse → appears in feed, flag 3× → hidden.

### E2E tests (future)
Playwright — verify map renders, pins clickable, form submission works end-to-end.

## Conventions

- File naming: `ComponentName.test.tsx` mirroring `src/components/...`
- Use `screen.getByRole` over `getByLabelText` for better accessibility testing
- Test **behavior**, not implementation: what the component does, not how
- Anonymity-sensitive tests: verify no description field rendered in PulseCard, honeypot hidden in PulseForm
- Availability toggle label: must test exact string "Open per listed hours" (spec requirement)

## What to test when adding code

| What you're adding | Write a test for |
|---|---|
| New component | Renders correctly + key interactions |
| Async form submission | success / error / rate-limit states |
| Filter/sort logic | both paths (with + without filters) |
| Privacy-sensitive display | verify sensitive data NOT shown |
| Conditional rendering | both true and false branches |
