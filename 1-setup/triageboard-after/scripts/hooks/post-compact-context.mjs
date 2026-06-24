console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostCompact',
      additionalContext:
        'TriageBoard compact reminder: preserve the dependency-free app, keep domain logic in src/triage/rules.mjs, and run pnpm run verify after code edits.',
    },
  }),
);
