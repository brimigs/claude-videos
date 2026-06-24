/**
 * Demo: Prohibition-only instructions vs decision criteria
 *
 * Video sections covered:
 *   Part 1 (1:00) — The core rule: prohibitions need a positive instruction
 *   Part 3 (8:30) — The both-sides rule: always give both costs
 *
 * Run: npm run demo:01
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { C, header, sectionLabel, promptBlock, responseBlock, divider, insight } from './utils.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const client = new Anthropic();

function loadPrompt(filename: string, accountData: string): string {
  return readFileSync(join(ROOT, 'prompts', filename), 'utf-8')
    .replace('{{account_data}}', accountData);
}

async function ask(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

async function main() {
  const accountData = readFileSync(join(ROOT, 'data/customer-account.json'), 'utf-8');

  const TEST_MESSAGE =
    "I see a duplicate charge of $79 on my account this month. " +
    "This is the second time this has happened — it's really frustrating.";

  // ── Part 1: Show the core problem ───────────────────────────────────────────

  header(
    'Demo 01 — Prohibition vs Criterion',
    'Video: Part 1 (1:00) + Part 3 (8:30)',
  );

  sectionLabel('The failing prompt (v0 — prohibition only)', C.red);
  console.log(
    `  The policy says: ${C.bold}${C.red}"avoid escalating unless absolutely necessary — costs $8"${C.reset}`,
  );
  console.log(
    `  What's missing:  ${C.dim}no instruction for what to do with billing disputes${C.reset}\n`,
  );

  const brokenPrompt = loadPrompt('support-agent-v0-broken.xml', accountData);
  promptBlock('support-agent-v0-broken.xml (relevant excerpt)', `<policy>
- Avoid escalating unless absolutely necessary — costs $8.
- Never give plan pricing unless you're certain.
- Always try to resolve the issue yourself before escalating.
</policy>`, C.red);

  sectionLabel('Test message sent to both agents', C.cyan);
  console.log(`  ${C.bold}"${TEST_MESSAGE}"${C.reset}\n`);

  // ── Run broken prompt ────────────────────────────────────────────────────────

  console.log(`  ${C.dim}Calling Claude (v0 broken)...${C.reset}`);
  const brokenResponse = await ask(brokenPrompt, TEST_MESSAGE);
  responseBlock('v0 BROKEN — agent tries to handle it instead of escalating', brokenResponse, false);

  divider();

  // ── Part 3: Show the both-sides fix ─────────────────────────────────────────

  sectionLabel('The fix (v1 — both-sides rule)', C.green);
  console.log(`  ${C.bold}Add both costs:${C.reset} escalation = $8 in time, wrong answer = refund + trust`);
  console.log(`  ${C.bold}Add the criterion:${C.reset} "route any mention of duplicate/unexpected charge"\n`);

  const fixedPrompt = loadPrompt('support-agent-v1-fixed.xml', accountData);
  promptBlock('support-agent-v1-fixed.xml (relevant excerpt)', `<policy>
Escalation decision: Escalating costs $8 in agent time. A wrong answer on a
billing dispute costs a full refund plus customer trust. Route any mention of
an incorrect, duplicate, or unexpected charge to a Care Specialist.
</policy>`, C.green);

  console.log(`  ${C.dim}Calling Claude (v1 fixed)...${C.reset}`);
  const fixedResponse = await ask(fixedPrompt, TEST_MESSAGE);
  responseBlock('v1 FIXED — agent routes to Care Specialist immediately', fixedResponse, true);

  // ── Key insight ──────────────────────────────────────────────────────────────

  insight(
    'One-sided instructions let the model optimize for what you measured.\n' +
    '  State both costs — then the model weighs the actual trade-off.',
  );
}

main().catch(err => { console.error(err); process.exit(1); });
