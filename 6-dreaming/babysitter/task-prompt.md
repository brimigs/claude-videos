# PR Babysitter — `/schedule` task prompt

Runs on a cadence via `/schedule`, connected to GitHub and the issue tracker through
MCP (see `.mcp.json`). Paste the block below as the task prompt.

---

Read `babysitter/state.json` for what happened on the last run before doing anything
else. Update it before you finish — this run starts a fresh session and has no memory
of the last one otherwise.

When this task runs:
1. Check CI status. If failing, diagnose and fix.
2. Read review comments since the last run. Implement clear ones.
3. If the base branch moved ahead, rebase.
4. Open a tracker task for anything needing a decision.
Do not merge. Do not deploy. Flag where human judgment is needed.
Run the verify command before marking work done.
