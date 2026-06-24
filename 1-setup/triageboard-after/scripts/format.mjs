import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const mode = process.argv.includes('--write') ? 'write' : 'check';
const roots = ['src', 'scripts', 'test', 'docs', '.claude', 'README.md', 'CLAUDE.md', 'package.json', 'Justfile'];
const extensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.svg', '']);
const changed = [];

for (const root of roots) {
  for (const filePath of await collectFiles(root)) {
    if (!shouldFormat(filePath)) {
      continue;
    }

    const original = await readFile(filePath, 'utf8');
    const formatted = formatText(original);

    if (formatted !== original) {
      changed.push(filePath);

      if (mode === 'write') {
        await writeFile(filePath, formatted);
      }
    }
  }
}

if (changed.length > 0 && mode === 'check') {
  console.error(`Formatting changes needed:\n${changed.map((filePath) => `- ${filePath}`).join('\n')}`);
  process.exit(1);
}

console.log(mode === 'write' ? 'Formatted text files.' : 'Formatting check passed.');

async function collectFiles(entry) {
  const files = [];
  const stats = await readdir(path.dirname(entry), { withFileTypes: true }).catch(() => []);
  const basename = path.basename(entry);
  const exactEntry = stats.find((item) => item.name === basename);

  if (!exactEntry) {
    return files;
  }

  if (exactEntry.isFile()) {
    return [entry];
  }

  if (exactEntry.isDirectory()) {
    await walk(entry, files);
  }

  return files;
}

async function walk(directory, files) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
      continue;
    }

    if (entry.isDirectory()) {
      await walk(fullPath, files);
      continue;
    }

    files.push(fullPath);
  }
}

function shouldFormat(filePath) {
  return extensions.has(path.extname(filePath)) || path.basename(filePath) === 'Justfile';
}

function formatText(value) {
  return `${value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n*$/u, '')}\n`;
}
