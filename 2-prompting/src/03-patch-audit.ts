/**
 * Demo: Defensive patches — the silent killer of good prompts
 *
 * Video section covered:
 *   Part 4 (12:00) — How patches accumulate, how to audit them
 *
 * No API calls — this demo reads patch-log.json and produces an audit report.
 * Run: npm run demo:03
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { C, header, sectionLabel, divider, insight } from './utils.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

interface Patch {
  id: string;
  date: string;
  added_by: string;
  incident: string;
  description: string;
  instruction: string;
  note?: string;
  conflict_with: string | null;
}

interface PatchLog {
  agent: string;
  prompt_created: string;
  patches: Patch[];
}

function monthsAgo(dateStr: string): number {
  const then = new Date(dateStr);
  const now  = new Date('2026-06-22');
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

function ageLabel(months: number): string {
  if (months >= 12) return `${C.red}${months}mo ago${C.reset}`;
  if (months >= 6)  return `${C.yellow}${months}mo ago${C.reset}`;
  return `${C.green}${months}mo ago${C.reset}`;
}

function printPatch(patch: Patch, allPatches: Patch[]) {
  const age      = monthsAgo(patch.date);
  const conflict = patch.conflict_with
    ? allPatches.find(p => p.id === patch.conflict_with)
    : null;

  const flags: string[] = [];
  if (patch.conflict_with)  flags.push(`${C.red}${C.bold}CONFLICTS with ${patch.conflict_with}${C.reset}`);
  if (patch.note)            flags.push(`${C.yellow}${C.bold}POSSIBLY STALE${C.reset}`);

  console.log(`  ${C.bold}[${patch.id}]${C.reset} ${C.dim}${patch.date}${C.reset}  ${ageLabel(age)}  ${C.dim}by ${patch.added_by} · ${patch.incident}${C.reset}`);
  console.log(`  ${C.dim}Incident:${C.reset} ${patch.description}`);
  console.log(`  ${C.bold}Instruction:${C.reset} "${patch.instruction}"`);
  if (patch.note) {
    console.log(`  ${C.yellow}Note: ${patch.note}${C.reset}`);
  }
  if (conflict) {
    console.log(`  ${C.red}↳ Conflicts with [${conflict.id}]: "${conflict.instruction}"${C.reset}`);
  }
  if (flags.length) {
    console.log(`  ${flags.join('  ')}`);
  }
  console.log();
}

function main() {
  const log: PatchLog = JSON.parse(
    readFileSync(join(ROOT, 'patch-log.json'), 'utf-8')
  );

  header(
    'Demo 03 — Defensive Patch Audit',
    'Video: Part 4 (12:00)',
  );

  console.log(`  Agent:   ${C.bold}${log.agent}${C.reset}`);
  console.log(`  Created: ${log.prompt_created}  (${monthsAgo(log.prompt_created)} months running)`);
  console.log(`  Patches: ${C.bold}${log.patches.length}${C.reset} accumulated since launch\n`);

  divider();

  // ── Show all patches with flags ──────────────────────────────────────────────

  sectionLabel('Full patch log — every instruction added after launch', C.cyan);
  console.log();

  for (const patch of log.patches) {
    printPatch(patch, log.patches);
  }

  divider();

  // ── Audit summary ────────────────────────────────────────────────────────────

  sectionLabel('Audit summary', C.yellow);

  const conflicts: [Patch, Patch][] = [];
  const seen = new Set<string>();
  for (const p of log.patches) {
    if (p.conflict_with && !seen.has(`${p.id}-${p.conflict_with}`)) {
      const other = log.patches.find(x => x.id === p.conflict_with);
      if (other) {
        conflicts.push([p, other]);
        seen.add(`${p.id}-${p.conflict_with}`);
        seen.add(`${p.conflict_with}-${p.id}`);
      }
    }
  }

  const stale = log.patches.filter(p => p.note);

  const alwaysNever = log.patches.filter(p =>
    /^(always|never)\b/i.test(p.instruction)
  );

  console.log(`
  ${C.bold}Conflicting pairs found:${C.reset} ${C.red}${C.bold}${conflicts.length}${C.reset}`);
  for (const [a, b] of conflicts) {
    console.log(`    ${C.red}[${a.id}] vs [${b.id}]${C.reset}`);
    console.log(`    ${C.dim}  "${a.instruction}"${C.reset}`);
    console.log(`    ${C.dim}  "${b.instruction}"${C.reset}`);
  }

  console.log(`\n  ${C.bold}Potentially stale (root cause fixed):${C.reset} ${C.yellow}${C.bold}${stale.length}${C.reset}`);
  for (const p of stale) {
    console.log(`    ${C.yellow}[${p.id}]${C.reset} ${C.dim}"${p.instruction}"${C.reset}`);
  }

  console.log(`\n  ${C.bold}Instructions starting with ALWAYS or NEVER:${C.reset} ${C.bold}${alwaysNever.length} of ${log.patches.length}${C.reset}`);
  for (const p of alwaysNever) {
    const canAnswer = p.conflict_with || p.note ? `${C.red}⚠ flag for review${C.reset}` : `${C.green}likely ok${C.reset}`;
    console.log(`    [${p.id}] ${C.dim}"${p.instruction.slice(0, 65)}…"${C.reset}  ${canAnswer}`);
  }

  console.log(`
  ${C.bold}Recommended actions before next model upgrade:${C.reset}
    ${C.red}• Resolve [P003] vs [P004] — rewrite as one escalation criterion${C.reset}
    ${C.red}• Resolve [P005] vs [P006] — rewrite as one empathy guideline${C.reset}
    ${C.yellow}• Verify [P007] — data pipeline fix went out 2026-02-20; test without it${C.reset}
    ${C.green}• Keep [P001], [P002], [P008] — clean, no conflicts${C.reset}
`);

  insight(
    'Count instructions starting with ALWAYS or NEVER.\n' +
    '  For each one: can you name the failure it prevents?\n' +
    '  If not, it\'s probably the first thing to cut.',
  );
}

main();
