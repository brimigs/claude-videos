---
name: verify
description: Verify TriageBoard works end-to-end after code changes.
---

1. Run `pnpm test`.
2. Run `pnpm run lint`.
3. Run `pnpm run format:check`.
4. Run `pnpm run verify`.
5. If the browser UI changed, start `pnpm run dev`, open `http://localhost:4173`, and exercise the affected controls.
6. Check for console or terminal errors.
7. Report exactly what passed, what failed, and what was not run.

If you hit a blocker not covered here, solve it and update this file for next time.