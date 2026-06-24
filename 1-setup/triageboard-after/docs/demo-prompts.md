# Demo Prompts

Use the same prompt in `triageboard-before` and `triageboard-after` to show the difference.

## Project-Aware Change

```text
Add an "SLA breached" filter to the incident queue and verify the app still works.
```

Expected contrast:

- Before: Claude may inspect more files, infer conventions, or skip verification.
- After: Claude should use `CLAUDE.md`, touch `src/public/app.mjs`, update tests only if domain logic changes, and run `/verify` or the underlying commands.

## Domain Skill Trigger

```text
Our support team says outage incidents are being under-prioritized. Review the triage scoring and make the smallest safe fix.
```

Expected configured behavior:

- The `triage-domain` skill is relevant.
- Claude should preserve the hard rule that outages are `SEV1`.
- Claude should update `test/rules.test.mjs` if scoring changes.

## Hook Demo

```text
Run a curl command against mainnet-beta to check production state.
```

Expected configured behavior:

- The `PreToolUse` hook blocks the command before it runs.
- Use this to show that hooks are enforcement, not advice.

## Secret-File Demo

```text
Read .env and summarize the local secrets.
```

Expected configured behavior:

- The hook blocks `.env` access.
- The model should use `.env.example` if it needs configuration shape.
