import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const roots = ['src', 'scripts', 'test'];
const failures = [];

for (const root of roots) {
  await walk(root);
}

for (const jsonFile of ['package.json', '.claude/settings.json']) {
  await validateJson(jsonFile);
}

if (failures.length > 0) {
  console.error(`Lint failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log('Lint passed.');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }

    if (!/\.(css|html|js|mjs|svg)$/u.test(entry.name)) {
      continue;
    }

    await lintFile(fullPath);
  }
}

async function lintFile(filePath) {
  const source = await readFile(filePath, 'utf8');
  const lineCount = source.split('\n').length;

  if (lineCount > 420) {
    failures.push(`${filePath} is ${lineCount} lines; split it before adding more behavior`);
  }

  if (source.includes('\t')) {
    failures.push(`${filePath} contains tab indentation`);
  }

  if (/\bvar\s/u.test(source)) {
    failures.push(`${filePath} uses var; use const or let`);
  }

  if (/export\s+default/u.test(source)) {
    failures.push(`${filePath} uses a default export`);
  }

  if (/\.only\(/u.test(source)) {
    failures.push(`${filePath} contains a focused test`);
  }

  if (!source.endsWith('\n')) {
    failures.push(`${filePath} must end with a newline`);
  }
}

async function validateJson(filePath) {
  try {
    JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    failures.push(`${filePath} is invalid JSON: ${error.message}`);
  }
}
