# TriageBoard

TriageBoard is a tiny production incident dashboard used to demonstrate Claude Code project setup. It has no runtime dependencies: Node serves static files and a small JSON API, while the browser app renders a triage queue from fixture data.

## Commands

```sh
pnpm run dev
pnpm test
pnpm run lint
pnpm run format:check
pnpm run verify
```

The dev server runs on `http://localhost:4173`.

## Project Shape

- `src/server.mjs` - Node HTTP server and API routes.
- `src/triage/rules.mjs` - incident severity, SLA, filtering, and sorting rules.
- `src/data/incidents.mjs` - fixture incidents used by the dashboard.
- `src/public/` - browser UI.
- `test/` - Node test runner coverage for domain rules.
- `.claude/` and `CLAUDE.md` - Claude Code setup for the tutorial.

## Recording Path

Start with this configured repo next to `../triageboard-before`. Ask the same prompt in both sessions:

```text
Add an "SLA breached" filter to the incident queue and verify the app still works.
```

The configured session should discover the domain skill, follow the root project context, respect hooks, and run the verification routine.
