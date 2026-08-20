---
name: advisor
description: Route an engineering task or decision through this repo's advisor pipeline (a mid-tier executor that escalates genuinely hard tradeoffs to a stronger advisor model, with a cheap evaluator verifying the output). Use when the user invokes /advisor, or asks to run a task, question, or decision through the advisor pipeline or advisor strategy.
---

# Advisor pipeline

Run the user's task through this repository's advisor pipeline and relay the result.

## Steps

1. Locate the pipeline: find `advisor.config.json` in this repository (it lives in
   the directory where the advisor scaffold was installed, e.g. `tools/advisor/`).
2. From that directory, run:

   ```sh
   npm run --silent advisor -- "<task>" --json
   ```

   (`--silent` matters — without it npm prints a banner before the JSON.)

   - Quote the task safely — it is passed through a shell.
   - Pass through `--criteria "<text>"` if the user gave acceptance criteria, and
     `--no-verify` if they asked to skip verification.
   - If `node_modules` is missing, run `npm install` in that directory first.
3. Parse the JSON result and report to the user:
   - The final `output` — this is the deliverable; quote it faithfully.
   - Whether it `escalated`: if true, note that the advisor model was consulted and
     summarize `guidance` in one sentence.
   - If `violations` is non-empty, say what the evaluator flagged and whether the
     repairer fixed it (`repaired`).
   - One line on cost from `usage`: `estimatedCostUSD` vs `allOnAdvisorCostUSD`
     (what the same run would have cost entirely on the advisor model).

## Rules

- Do not answer the engineering question yourself — the pipeline's output is the
  deliverable. Add your own commentary only if the user explicitly asks for it.
- If the command fails with an authentication error, tell the user to set
  `ANTHROPIC_API_KEY` (a `.env` next to `advisor.config.json` works) and stop.
