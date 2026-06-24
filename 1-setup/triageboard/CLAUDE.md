# CLAUDE.md

## Project Identity
TriageBoard is a dependency-free Node/browser demo app for incident triage. It is intentionally not React, Next.js, Express, or a package-heavy frontend.

## Key Commands
- `pnpm run dev` - start the app at `http://localhost:4173`.
- `pnpm test` - run Node test runner tests.
- `pnpm run lint` - run repository lint checks.
- `pnpm run format:check` - check whitespace formatting.
- `pnpm run verify` - start an in-process server and verify health, API, HTML, and static assets.
- `just verify` - full local verification if `just` is installed.

## Conventions 
@docs/conventions.md

## Hard Stops 
- Do not install dependencies without explicit approval. The demo is dependency-free on purpose.
- Do not read `.env`, private keys, keypairs, or secret files. Use `.env.example` only.
- Do not run production, mainnet, or destructive shell commands unless the user explicitly approves the exact action.
- Do not replace the app with a framework. The point is to keep setup concepts visible.

## Known Gotchas
- `customerImpact: "outage"` must always produce `SEV1`, even with low report counts.
- The queue sort is domain-specific: severity score first, then SLA state, then revenue at risk.
- Browser code should stay in `src/public/app.mjs`; domain logic belongs in `src/triage/rules.mjs`.
- The dev server uses built-in Node APIs, so API routes live in `src/server.mjs`.
- `pnpm run verify` starts its own temporary server. It does not require a separate dev server.

## Links
- Domain rules: `src/triage/rules.mjs`
- Domain reference skill: `.claude/skills/triage-domain/reference.md`
- Demo prompts: `docs/demo-prompts.md`
- Script review notes: `../SCRIPT_REVIEW.md`
