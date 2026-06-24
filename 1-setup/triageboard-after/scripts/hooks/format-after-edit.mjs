import { spawnSync } from 'node:child_process';

const input = await readStdin();
const payload = parseJson(input);
const cwd = payload.cwd ?? process.cwd();
const result = spawnSync(process.execPath, ['scripts/format.mjs', '--write'], {
  cwd,
  encoding: 'utf8',
});

if (result.error) {
  console.error(result.error.message);
}

if (result.stderr) {
  console.error(result.stderr.trim());
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
