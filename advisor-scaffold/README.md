# Advisor Pipeline Scaffold

A drop-in implementation of the **advisor strategy** for any repo: don't run your
strongest (most expensive) model on every task — run a mid-tier executor on
everything, and consult the strong model only when the executor hits a decision
that genuinely needs senior judgment. A cheap evaluator then checks every final
output, and a repairer fixes only what the evaluator flags.

| Role | Default model | Runs |
|---|---|---|
| Executor | `claude-sonnet-5` | Every request; handles routine implementation judgment |
| Advisor | `claude-opus-5` (adaptive thinking, high effort) | Only when the executor escalates a real tradeoff |
| Evaluator | `claude-haiku-4-5` | Every final output; checks only, never fixes |
| Repairer | `claude-sonnet-5` | Only if the evaluator finds a violation |

The executor escalates by replying `NEEDS_ADVISOR: <one-sentence question>`. What
counts as advisor-worthy is driven by your project context file (public API
changes, migrations, auth/billing, rollout strategy, ...), so the routing rule
adapts to each repo without touching code.

## Quick start

```sh
# 1. Copy this directory into your repo (any location works, e.g. tools/advisor/)
cp -r advisor-scaffold my-repo/tools/advisor
cd my-repo/tools/advisor

# 2. Install and authenticate
npm install
cp .env.example .env   # then paste your ANTHROPIC_API_KEY
                       # (or skip .env if you use `ant auth login` / an exported env var)

# 3. Describe your repo (see next section)
cp advisor-context.example.json advisor-context.json
# ...edit advisor-context.json...

# 4. Run it
npm run advisor -- "Fix the off-by-one in src/pagination.ts"
npm run advisor -- "Migrate our REST client to gRPC and remove the old API"
```

The first task should resolve directly; the second should escalate to the advisor.

## Describing your repo (`advisor-context.json`)

The context file is what makes the routing smart. It holds a codebase map, your
engineering standards, and — most importantly — examples of decisions the executor
should make **directly** vs decisions that should go to the **advisor**. Copy
`advisor-context.example.json` and fill it in, or paste this into Claude Code from
your repo root:

> Read this repository and write `tools/advisor/advisor-context.json` following the
> structure of `tools/advisor/advisor-context.example.json`: a codebase map of the
> 5–15 most important files with one-line responsibilities and known issues, our
> engineering standards, examples of decisions an implementation agent should make
> directly, and examples of decisions that need senior judgment (public API changes,
> staged migrations, auth/session behavior, money movement, rollout/rollback
> strategy).

The pipeline still runs without a context file (it warns and proceeds), but
escalation decisions will be generic.

## CLI

```sh
npm run advisor -- "<task>"                       # full pipeline
npm run advisor -- "<task>" --no-verify           # skip evaluator + repairer
npm run advisor -- "<task>" --criteria "<text>"   # custom pass criteria for this run
npm run advisor -- "<task>" --json                # structured JSON result
```

The CLI finds `advisor.config.json` by walking up from your current directory, so
it works from anywhere inside the repo once the scaffold is installed.

## Library

```ts
import { runAdvisorPipeline } from "./src/index.js";

const result = await runAdvisorPipeline(
  "Migrate our REST client to gRPC and remove the old API",
  {
    passCriteria: "Output names a staged rollout and a rollback plan.", // optional
    verify: true,                                                       // default
    onEvent: (e) => console.log(e.type),                                // optional progress hook
  }
);

result.output;             // final text (post-repair if the evaluator flagged anything)
result.escalated;          // did the executor consult the advisor?
result.escalationQuestion; // the one-sentence question it asked
result.guidance;           // the advisor's directive
result.violations;         // what the evaluator flagged
result.repaired;           // did the repairer run?
```

## Configuration (`advisor.config.json`)

| Key | Default | Meaning |
|---|---|---|
| `models.executor` | `claude-sonnet-5` | Runs every request |
| `models.advisor` | `claude-opus-5` | Consulted only on escalation |
| `models.evaluator` | `claude-haiku-4-5` | Checks every final output |
| `models.repairer` | `claude-sonnet-5` | Fixes flagged violations |
| `maxTokens.*` | 2048 / 4096 / 1024 / 2048 | Per-role output caps |
| `advisorEffort` | `high` | Advisor reasoning depth: `low`–`max` (`xhigh` for the hardest calls) |
| `advisorFallbackModel` | `claude-opus-4-8` | If the advisor model refuses for safety reasons, the API retries on this model in the same call (server-side fallback, beta). Set to `null` to disable. |
| `contextFile` | `advisor-context.json` | Your repo description, relative to the config file |
| `promptsDir` | `prompts` | Role prompt templates (edit these to change the escalation policy) |
| `defaultPassCriteria` | see file | What the evaluator checks when no `--criteria` is given |

All keys are optional — missing ones fall back to the defaults above.

## Customizing the strategy

- **Escalation policy** lives in two places: `prompts/executor.txt` (the general
  rule) and the `advisor_work_examples` list in your context file (repo-specific
  triggers). Tune the examples first; they do most of the work.
- **Pass criteria** are the evaluator's contract. The default checks structural
  things (names files, gives sequencing + verification, no internal-role leakage).
  Make them task-specific with `--criteria` when it matters.
- **Models** are just config. If you want maximum advisor capability, set
  `models.advisor` to `claude-fable-5`; to cut cost further, the evaluator can stay
  on Haiku forever — it only checks, never writes.
- **Prompts** are plain text templates with `{{project_context}}` /
  `{{pass_criteria}}` / `{{input}}` / `{{output}}` placeholders. Edit freely.

## Why this shape

Model selection is the *last* cost lever (after prompt caching, on-demand tool
schemas, streaming, and compaction), but it's a real one: the expensive model only
runs after the executor has identified a decision that is genuinely hard, so you
pay Opus prices for judgment, not for typing. The evaluator is cheap enough to run
on everything, which is what makes the executor's autonomy safe.
