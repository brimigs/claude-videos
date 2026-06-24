# TriageBoard Conventions

## Code Organization

- Keep domain calculations in `src/triage/rules.mjs`.
- Keep fixture data in `src/data/incidents.mjs`.
- Keep browser rendering in `src/public/app.mjs`.
- Keep server route behavior in `src/server.mjs`.
- Use named exports only.

## Style

- Use modern ESM.
- Prefer object arguments when a function needs more than two inputs.
- Validate inputs at module boundaries.
- Return new objects and arrays instead of mutating fixtures.
- Keep UI text concise. This is a dashboard, not a landing page.

## Testing

- Add or update tests in `test/rules.test.mjs` when scoring, filtering, sorting, or SLA logic changes.
- Use `node:test` and `node:assert/strict`.
- Test the happy path and at least one edge case for domain changes.

## UI

- Use the existing light operational dashboard style.
- Use 8px radii or less.
- Keep cards dense and scannable.
- Do not add gradients, decorative blobs, or framework dependencies.
- Show errors near the affected UI region.
