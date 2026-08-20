# API Cost Optimization Playbook

We're spending too much on API credits, and most of the waste is avoidable without
slowing anyone down. This guide is three layers: **see** where the money goes,
**set** cheap defaults for Claude Code, and **build** with the advisor pattern when
you ship anything that calls an LLM. Codex users: the dashboards and settings below
are Claude-specific, but every habit in Layer 2 applies to Codex too.

---

## Layer 1 — See where the money goes

You can't optimize spend you can't attribute.

- **Anthropic Console → Usage** (console.anthropic.com): spend broken down by
  workspace, API key, and model, including cached vs uncached tokens. Check it
  weekly. If everything runs through one default workspace, split it — one
  workspace per team or product — so a spike has a name attached.
- **Workspace spend limits** (Console → workspace settings): set a monthly cap per
  workspace. This turns "we overspent" into an alert instead of an invoice.
- **In Claude Code**: run `/cost` to see what your current session has cost
  (API-billed accounts) or `/usage` to see plan limits (subscription accounts).
  Make it a habit to glance at it after a long session — the number is educational.
- **Org-wide metrics**: Claude Code emits OpenTelemetry metrics (tokens, cost,
  session counts, per user). If we want dashboards, set these in managed settings
  or the shell profile and point them at our collector:

  ```
  CLAUDE_CODE_ENABLE_TELEMETRY=1
  OTEL_METRICS_EXPORTER=otlp
  OTEL_EXPORTER_OTLP_ENDPOINT=<our collector>
  ```

- **Codex**: spend lives on OpenAI's platform dashboard (platform.openai.com →
  Usage). Same drill — attribute by key/project, set limits there.

---

## Layer 2 — Cheap defaults and habits in Claude Code

### The shared settings file

Commit this as `.claude/settings.json` in each repo (template lives at
[`cost-playbook/settings.json`](https://github.com/brimigs/claude-videos/blob/main/cost-playbook/settings.json)).
Easiest install: open Claude Code in your repo and paste — *"add this to our
.claude/settings.json, merging with anything already there"* — followed by the JSON:

```json
{
  "model": "sonnet",
  "effortLevel": "high",
  "fastModePerSessionOptIn": true,
  "autoCompactEnabled": true,
  "precomputeCompactionEnabled": true,
  "autoCompactWindow": 200000,
  "permissions": {
    "allow": [
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ]
  }
}
```

What each key buys us:

| Key | Why |
|---|---|
| `model: "sonnet"` | Sonnet is the daily driver — excellent for routine work at a fraction of Opus pricing. Escalate deliberately (below), don't default up. |
| `effortLevel: "high"` | The default is `xhigh`, which spends more reasoning tokens per turn. `high` is the sweet spot for routine work; raise it per-session when a problem genuinely needs it. |
| `fastModePerSessionOptIn: true` | Fast mode runs at premium pricing (~2× output). This makes it per-session opt-in so it never silently stays on. |
| `autoCompactEnabled` + `autoCompactWindow: 200000` | Every message re-sends the whole conversation. This compacts long sessions automatically and caps the context at ~200K tokens instead of letting it balloon toward 1M — the difference between cents and dollars per turn late in a session. |
| `permissions.allow` (git read-only) | Fewer permission round-trips on commands everyone approves anyway. Run `/fewer-permission-prompts` in your repo to build a tailored allowlist. |

### The habits (this is where most of the waste is)

1. **Tier your models by hand.** Sonnet for routine work (the default). Switch with
   `/model` to Opus only when you hit something that needs senior-level judgment —
   gnarly architecture, a bug that survived two Sonnet attempts — and switch back
   after. This is the advisor pattern applied manually, and it's the single biggest
   lever.
2. **`/clear` between unrelated tasks.** A session that's been alive all day makes
   every new message pay for the whole day's context. New task, new context.
3. **`/compact` at checkpoints** on genuinely long tasks (after a milestone lands),
   rather than letting the context grow until auto-compact fires mid-thought.
4. **Don't paste huge logs or files.** Give the path and let Claude grep it — you
   pay for pasted content on *every subsequent turn*, not just once.
5. **Keep a `CLAUDE.md` in every repo** (run `/init` once, keep it current). Without
   it, the agent re-explores the codebase every session and you pay for the tour
   each time.
6. **Plan mode before big changes** (shift+tab to cycle into it). A cheap planning
   pass that gets reviewed prevents the expensive failure mode: an agent
   implementing the wrong thing at full speed, then redoing it.
7. **Parallel agents and workflows multiply cost.** Subagents, `/batch`, background
   sessions — great tools, but each one is another model burning tokens. Fan out
   deliberately for real parallel work, not by default.
8. **Codex users:** every habit above transfers — pick the cheaper model tier by
   default, start fresh sessions per task, keep an `AGENTS.md`, don't paste logs.

---

## Layer 3 — The advisor pattern for what you build

The habits above cover interactive use. The moment you **build** something that
calls an LLM — a bot, a batch job, a CI check, an internal tool — apply the levers
in this order:

1. **Prompt caching** — mark stable prefixes (system prompt, project context);
   cached reads cost ~10% of input price.
2. **On-demand tool schemas** — don't send every tool definition on every request.
3. **Streaming** — for long outputs, avoids timeout-and-retry waste.
4. **Compaction** — for long-running conversations.
5. **Model tiering** — the advisor strategy: a mid-tier executor handles every
   request and escalates only genuinely hard decisions to a strong advisor model; a
   cheap evaluator checks every output. You pay Opus prices for judgment, not typing.

**Reference implementation:**
[`advisor-scaffold/`](https://github.com/brimigs/claude-videos/tree/main/advisor-scaffold)
— copy it into your repo, describe your codebase in one JSON file, and you get the
full pipeline (executor → advisor → evaluator → repairer) with prompt caching and a
per-run cost receipt showing what the routing saved (typically 30–40% vs running
everything on the advisor model, before caching savings). It ships a Claude Code
skill too: install it and `/advisor <question>` routes any engineering decision
through the pipeline from inside your session.

**When it applies:** anything making more than a handful of API calls, anything
scheduled, anything user-facing. If your script calls Opus in a loop, that's the
first thing to fix.

---

## Quick reference

| Do this | When |
|---|---|
| `/cost` or `/usage` | End of a long session — know what it cost |
| `/model` | Escalate to Opus for hard problems; come back down after |
| `/clear` | Every new unrelated task |
| `/compact` | Checkpoints in long tasks |
| `/init` | Once per repo missing a CLAUDE.md |
| `/fewer-permission-prompts` | Once per repo, to tune the allowlist |
| `/fast` | Only when latency truly matters — it's premium-priced |
| `/advisor <question>` | Hard engineering tradeoffs, once the scaffold is installed |

Questions or a repo that doesn't fit the defaults → ask in the eng channel before
inventing a new pattern.
