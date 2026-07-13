---
name: triage-domain
description: Use when changing incident severity, SLA status, queue sorting, owner-team filters, or TriageBoard API responses.
---

# Triage Domain Skill

Use this skill for any change that affects incident priority or what appears in the queue.

## Workflow

1. Read `src/triage/rules.mjs` and the relevant tests before editing.
2. Preserve severity floors: `customerImpact: "outage"` is always `SEV1`. `"partial_outage"` is always at least `SEV2`, but (unlike `outage`) can still escalate to `SEV1` on score -- at a threshold of 90, not the standard 110 (see [reference.md](reference.md) for why).
3. Keep sorting stable: score first, SLA state second, revenue third.
4. Update `test/rules.test.mjs` for scoring, filtering, SLA, or sort changes.
5. Run `pnpm test` and `pnpm run verify`.

## Additional Resources

- For the scoring table and examples, see [reference.md](reference.md).
- For project-wide style rules, see `docs/conventions.md`.

If you hit a blocker not covered here, solve it and update this file for next time.
