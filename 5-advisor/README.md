# Multi-Agent Architecture Video Demo

Companion project for Video 5 — Multi-Agent Architecture: The Advisor Strategy and
Parallel Workflows. Builds on the verification loop from `../3-verification/`.

## Part 2 — The advisor strategy (in code)

Four model roles, two of them conditional:

| Role | Model | Runs |
|---|---|---|
| Executor | `claude-sonnet-4-6` | every request |
| Advisor | `claude-opus-4-8`, adaptive thinking + high effort | only when the executor escalates |
| Evaluator | `claude-haiku-4-5-20251001` | every reply, checks only, never fixes |
| Repairer | `claude-sonnet-4-6` | only if the evaluator finds a violation |

```sh
npm install
npm run demo:01   # executor handles an easy case alone, escalates a hard one to the advisor
npm run demo:02   # adds the evaluator + repairer on top
```

Key files:
- `src/lib/executor.ts`, `advisor.ts`, `evaluator.ts`, `repairer.ts` — one file per role
- `prompts/executor.txt`, `advisor.txt`, `evaluator.txt`
- `data/customer-account.json` — Jordan Lee's account, extended with a contract and an
  incident history so the hard case has no clean rule to fall back on

## Part 3/4 — Parallel work and managing sessions (live CLI demo)

No code runs these — they're Claude Code CLI features, demoed against `app/`, a small
legacy frontend with three areas of real work and one subagent.

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
the advisor strategy itself — model selection is the last lever, not the first.
