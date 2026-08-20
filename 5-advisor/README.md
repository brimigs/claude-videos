# Coding-Agent Advisor Strategy Demo

Companion project for Video 5 — Multi-Agent Architecture: The Advisor Strategy and
Parallel Workflows. This version frames the advisor strategy around coding-agent
decisions: localized code changes stay with the executor, while architecture,
compatibility, security, billing, and migration tradeoffs route to a stronger advisor.

## Part 2 — The Coding Advisor Strategy

The demo uses four model roles, two of them conditional:

| Role | Model | Runs |
|---|---|---|
| Executor | `claude-sonnet-4-6` | Every request; handles routine implementation judgment |
| Advisor | `claude-opus-4-8`, adaptive thinking + high effort | Only when the executor finds a real engineering tradeoff |
| Evaluator | `claude-haiku-4-5-20251001` | Every final output; checks only, never fixes |
| Repairer | `claude-sonnet-4-6` | Only if the evaluator finds a violation |

The routing rule is the point: do not use the strongest model for every coding task.
Use it only where senior judgment changes the outcome, such as public API changes,
staged migrations, auth/session behavior, billing-money movement, rollback strategy,
or mixing a broad mechanical refactor with a behavior change.

```sh
npm install
npm run typecheck
npm run demo:01   # executor handles a localized bug fix, escalates a migration decision
npm run demo:02   # adds the evaluator + repairer on top
```

Key files:
- `src/lib/executor.ts`, `advisor.ts`, `evaluator.ts`, `repairer.ts` — one file per role
- `prompts/executor.txt`, `advisor.txt`, `evaluator.txt`
- `data/project-context.json` — the codebase map, engineering standards, direct-work
  examples, and advisor-worthy decision examples

What the demos show:

- Case A is a localized session bug: `app/src/auth/session.js` stores `expiresAt` in
  epoch seconds but compares it to `Date.now()` in milliseconds. The executor should
  handle this directly because the fix and verification are obvious.
- Case B asks for a risky migration: modernize `app/src/api/supportClient.js`, remove
  callbacks, switch to `fetch`, and migrate React class components at the same time.
  The executor should return `NEEDS_ADVISOR` because this combines public API
  compatibility, rollout sequencing, and broad refactoring risk.
- `demo:02` adds the verification loop: the evaluator checks the final engineering
  output against concrete criteria, and the repairer fixes only what the evaluator
  flags.

## Part 3/4 — Parallel work and managing sessions (live CLI demo)

No code runs these — they're Claude Code CLI features, demoed against `app/`, a small
legacy frontend with real-looking coding tasks and one worktree-isolated subagent.

```sh
cd app

# three parallel, isolated worktree sessions — one per area of work
claude --worktree feat-payments --tmux
claude --worktree bugfix-auth --tmux
claude -w refactor-api

# the headline /batch feature — fans out across every class component
/batch migrate src/ from class components to hooks
```

| Worktree / command | Target in `app/` | What's there |
|---|---|---|
| `feat-payments` | `src/payments/invoices.js` | `calculateProration` is a stub — the feature to build |
| `bugfix-auth` | `src/auth/session.js` | `isExpired` compares seconds to milliseconds — every session looks expired immediately |
| `refactor-api` | `src/api/supportClient.js` | callback-style — refactor to async/await |
| `/batch migrate src/ from class components to hooks` | `src/components/*.jsx` | three React class components, never migrated |

`.claude/agents/worktree-worker.md` is the subagent `/batch` fans work out to —
`isolation: worktree` is what makes running many copies of it in parallel safe.

Session management commands to show live (no files involved): `--name`, `/color`,
`/statusline`, `/remote-control`, `/teleport`.

## Cost optimization (talking head, no demo)

In order of impact: prompt caching, on-demand tool schemas, streaming, compaction,
the advisor strategy itself — model selection is the last lever, not the first. The
advisor strategy saves cost because the expensive model only runs after the executor
has identified a decision that is genuinely hard.
