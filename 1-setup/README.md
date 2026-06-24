# Claude Code Setup Video Demo

This workspace contains two snapshots of the same small project for Video 1:

- `triageboard-before/` - runnable app with no `CLAUDE.md` or `.claude/` setup.
- `triageboard-after/` - the same app with a complete Claude Code configuration.

Open two terminals or editor windows side by side:

```sh
cd triageboard-before
claude
```

```sh
cd triageboard-after
claude
```

Use `SCRIPT_REVIEW.md` for content notes and `triageboard-after/docs/demo-prompts.md` for prompts you can run during the recording.

## App

The demo app is TriageBoard, a dependency-free Node/browser incident triage dashboard. It is intentionally small, but it has enough real structure for Claude to benefit from project context: server routes, browser UI, domain rules, tests, scripts, hooks, and conventions.

Run either snapshot:

```sh
pnpm run dev
pnpm test
pnpm run verify
```

The app serves at `http://localhost:4173`.
