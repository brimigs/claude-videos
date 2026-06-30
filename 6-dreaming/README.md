# Memory, Dreaming, and Background Automation Video Demo

Companion project for Video 6 — Memory, Dreaming, and Background Automation. Builds
on the multi-agent setup from `../5-advisor/` (the PR babysitter below picks up the
`feat-payments` / `bugfix-auth` / `refactor-api` branches from that demo).

## Part 1 — Claude Code memory (1:00–5:30)

Run `/memory` from inside this directory to show both scopes and the live config:

| Scope | Path | In this repo |
|---|---|---|
| User (all projects) | `~/.claude/CLAUDE.md` | `examples/user-CLAUDE.md` — illustrative only, **not** a copy of a real global config. Don't point Claude Code at it directly. |
| Project (shared via git) | `./CLAUDE.md` | `CLAUDE.md` at this repo's root — this one is real and active when you run Claude Code here. |

`CLAUDE.md` splits stable knowledge from working knowledge, per the script's mental
model:
- **Stable, curated** — `docs/program-addresses.md` and `docs/architecture-decisions.md`, pulled in with `@imports` so they stay trusted and don't get accidentally rewritten.
- **Working memory** — key commands and known gotchas, written directly in `CLAUDE.md` since they update more often.

## Part 2 — Dreaming (5:30–9:00)

`memory/before/` and `memory/after/` are a real `MEMORY.md` index plus topic files —
the same format Claude Code's own auto-memory uses — showing what a `/dream` pass
consolidates:

- `memory/before/MEMORY.md` — 14 entries, 6 weeks of accumulation: near-duplicates (two entries both say "run anchor test first"), and a direct contradiction (`fee-router-deployment-status.md` says devnet-only, `fee-router-mainnet-status.md` says it shipped to mainnet — open both side by side).
- `memory/after/MEMORY.md` — 3 entries. Duplicates merged, the contradiction resolved in favor of the more recent fact, everything regrouped by topic instead of by when it was written.

> **Note:** I confirmed `/memory`, auto-memory, `/loop`, `/schedule`, and the
> "Routines" terminology against current docs while building this. I could **not**
> independently confirm a `/dream` slash command exists today — worth a quick check
> before you record, in case it's brand new enough that docs haven't caught up, or
> named slightly differently than the script.

## Part 3 — Background tasks: /loop, /schedule, and Routines (9:00–15:00)

Pure CLI — no files needed for the comparison itself, just these to run live:

```sh
# in-session, high frequency, dies with the terminal
/loop 5m check the deploy and tell me what changed

# cloud, persistent, runs with your laptop closed
/schedule a daily job: review PRs merged since yesterday,
  update docs and message #docs-update via the Slack MCP
```

### Building the PR babysitter

`.mcp.json` connects GitHub, Linear, and Slack so the task can check CI, read review
comments, open tracker tasks, and post updates.

- `babysitter/task-prompt.md` — the exact task prompt to paste into `/schedule`, including the "read state before you start, write it back before you finish" line that makes a stateless scheduled run continuity-aware.
- `babysitter/state.json` — the continuity file the prompt reads/writes between runs.

## Part 4 — Observability (15:00–17:30)

`babysitter/sample-run-log.jsonl` — a sample event log for one babysitter run,
layered exactly as the script describes: `user.message` (what came in),
`agent.tool_use` / `agent.tool_result` / `agent.thinking` (what the model did),
`session.status_running` / `session.status_idle` (status transitions), and the
point where it deliberately stops and opens a tracker task instead of guessing
(`agent.custom_tool_use`). Scroll through it live and call out each event type as it
appears.

The run in the log is what produced `babysitter/state.json`'s contents — fixed CI on
`feat-payments`, addressed 3 review comments on `bugfix-auth`, and opened a tracker
task for the rounding decision on `refactor-api`. Matches the thumbnail brief.

## Billing aside (Part 3, no demo)

As of mid-June 2026, headless Agent SDK / `claude -p` usage draws on a separate
monthly Agent SDK credit instead of interactive plan limits — worth a one-line
mention, no fixture needed.
