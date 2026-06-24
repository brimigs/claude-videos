import { createInterface } from 'readline';

export const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  bgRed:   '\x1b[41m',
  bgGreen: '\x1b[42m',
};

export function header(title: string, subtitle?: string) {
  const line = '═'.repeat(64);
  console.log(`\n${C.bold}${C.cyan}${line}`);
  console.log(`  ${title}`);
  if (subtitle) console.log(`  ${C.dim}${subtitle}${C.reset}${C.bold}${C.cyan}`);
  console.log(`${line}${C.reset}\n`);
}

export function sectionLabel(text: string, color = C.yellow) {
  console.log(`\n${color}${C.bold}▸ ${text}${C.reset}`);
}

export function badge(text: string, pass: boolean) {
  const bg   = pass ? C.bgGreen : C.bgRed;
  const icon = pass ? ' ✓ ' : ' ✗ ';
  return `${bg}${C.bold}${C.white}${icon}${text} ${C.reset}`;
}

export function promptBlock(label: string, content: string, color = C.dim) {
  console.log(`${C.bold}${color}  ┌─ ${label} ${'─'.repeat(Math.max(0, 54 - label.length))}┐${C.reset}`);
  const lines = content.split('\n').slice(0, 20);
  for (const line of lines) {
    const truncated = line.length > 70 ? line.slice(0, 69) + '…' : line;
    console.log(`  ${color}│ ${C.reset}${truncated}`);
  }
  console.log(`${C.bold}${color}  └${'─'.repeat(56)}┘${C.reset}\n`);
}

export function responseBlock(label: string, text: string, pass: boolean) {
  const borderColor = pass ? C.green : C.red;
  const icon        = pass ? '✓' : '✗';
  console.log(`\n${borderColor}${C.bold}  ${icon} ${label}${C.reset}`);
  console.log(`${borderColor}  ${'─'.repeat(60)}${C.reset}`);
  const lines = text.split('\n');
  for (const line of lines) {
    console.log(`  ${line}`);
  }
  console.log(`${borderColor}  ${'─'.repeat(60)}${C.reset}`);
}

export function divider() {
  console.log(`\n${C.dim}${'·'.repeat(64)}${C.reset}\n`);
}

export function insight(text: string) {
  console.log(`\n${C.cyan}${C.bold}  💡 ${text}${C.reset}\n`);
}

export async function pause(msg = 'Press Enter to continue...') {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>(resolve => {
    rl.question(`\n${C.dim}  ${msg}${C.reset}`, () => { rl.close(); resolve(); });
  });
}
