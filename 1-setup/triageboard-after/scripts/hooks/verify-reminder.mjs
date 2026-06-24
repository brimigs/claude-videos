const input = await readStdin();
const payload = parseJson(input);
const lastMessage = String(payload.last_assistant_message ?? '');
const mentionsVerification = /\b(verification|verified|pnpm run verify|tests? passed|not run)\b/iu.test(lastMessage);

if (!mentionsVerification && process.env.CLAUDE_DEMO_ENFORCE_VERIFY === '1') {
  console.log(
    JSON.stringify({
      decision: 'block',
      reason: 'Before ending, report verification status. For code edits in this repo, run pnpm run verify or state why it was not run.',
    }),
  );
} else if (!mentionsVerification) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext:
          'Before the final answer, include a concise verification status. For code edits in this repo, prefer pnpm run verify.',
      },
    }),
  );
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
  });
}

function parseJson(value) {
  if (!value.trim()) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
