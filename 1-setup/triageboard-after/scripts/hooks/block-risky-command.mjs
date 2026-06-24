const input = await readStdin();
const payload = parseJson(input);
const toolInput = payload.tool_input ?? {};
const candidate = [
  toolInput.command,
  toolInput.file_path,
  toolInput.path,
  toolInput.pattern,
  toolInput.glob,
  toolInput.url,
]
  .filter(Boolean)
  .join('\n')
  .toLowerCase();

const blockedChecks = [
  {
    label: 'production or mainnet command',
    pattern: /\b(mainnet|mainnet-beta|production|prod-db|api\.mainnet-beta\.solana\.com)\b/u,
  },
  {
    label: 'secret or key material',
    pattern: /(^|[/\s])(\.env|id_rsa|id_ed25519|keypair|secret|secrets|\.pem|\.p12)([/\s.]|$)/u,
  },
  {
    label: 'destructive shell pattern',
    pattern: /\brm\s+-rf\s+(\/|\$HOME|~|\.)/u,
  },
];

for (const check of blockedChecks) {
  if (check.pattern.test(candidate) && !candidate.includes('.env.example')) {
    console.error(`Blocked ${check.label}. Ask the user for explicit approval before continuing.`);
    process.exit(2);
  }
}

process.exit(0);

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
