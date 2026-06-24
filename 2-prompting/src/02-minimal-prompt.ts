/**
 * Demo: The minimal prompt and the cleanup pass
 *
 * Video section covered:
 *   Part 2 (4:00) — Build a minimal prompt from 4 elements; messy → clean diff
 *
 * Run: npm run demo:02
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

  const TEST_MESSAGE = "What plan am I on and how much do I pay per month?";

  header(
    'Demo 02 — The Minimal Prompt + Cleanup Pass',
    'Video: Part 2 (4:00)',
  );

  // ── Step 1: Show the 4 elements ──────────────────────────────────────────────

  sectionLabel('The 4 elements every agent prompt needs — and nothing else', C.cyan);
  console.log(`
  ${C.bold}1. Role${C.reset}          ${C.dim}Who the agent is${C.reset}
  ${C.bold}2. Data${C.reset}          ${C.dim}What context it has, as template variables${C.reset}
  ${C.bold}3. Task + DoD${C.reset}    ${C.dim}What to do AND what "done" looks like${C.reset}
  ${C.bold}4. Output shape${C.reset}  ${C.dim}The exact format to return${C.reset}

  ${C.dim}Start here. Add nothing until you see a failure that justifies it.${C.reset}
`);

  divider();

  // ── Step 2: Show the messy v0 prompt ─────────────────────────────────────────

  sectionLabel('Before cleanup (v0 — unstructured, contradictory)', C.red);

  const messyRaw = readFileSync(join(ROOT, 'prompts/messy-prompt-v0.txt'), 'utf-8');
  promptBlock('messy-prompt-v0.txt', messyRaw, C.red);

  console.log(`  ${C.red}Problems in this prompt:${C.reset}`);
  console.log(`  ${C.dim}• No structure — instructions, data, and formatting rules are mixed together${C.reset}`);
  console.log(`  ${C.dim}• "Be concise but also thorough" — contradictory, forces the model to guess${C.reset}`);
  console.log(`  ${C.dim}• Redundant defaults — "don't make things up" is already model behavior${C.reset}`);
  console.log(`  ${C.dim}• No definition of done — when does the agent stop?${C.reset}\n`);

  divider();

  // ── Step 3: Show the clean v1 prompt ─────────────────────────────────────────

  sectionLabel('After cleanup (v1 — XML tags, 4 elements, nothing extra)', C.green);

  const cleanRaw = readFileSync(join(ROOT, 'prompts/clean-prompt-v1.xml'), 'utf-8');
  promptBlock('clean-prompt-v1.xml', cleanRaw, C.green);

  console.log(`  ${C.green}What the cleanup pass did:${C.reset}`);
  console.log(`  ${C.dim}• Added XML tags to separate role, data, task, and reply shape${C.reset}`);
  console.log(`  ${C.dim}• Stripped defaults (politeness, "don't hallucinate") — model already does these${C.reset}`);
  console.log(`  ${C.dim}• Resolved the concise/thorough contradiction with an explicit rule${C.reset}`);
  console.log(`  ${C.dim}• Added a definition of done: "customer has a specific answer or next step"${C.reset}\n`);

  divider();

  // ── Step 4: Run both and compare ─────────────────────────────────────────────

  sectionLabel('Same question → both prompts', C.cyan);
  console.log(`  ${C.bold}"${TEST_MESSAGE}"${C.reset}\n`);

  const messyPrompt = loadPrompt('messy-prompt-v0.txt', accountData);
  const cleanPrompt = loadPrompt('clean-prompt-v1.xml', accountData);

  console.log(`  ${C.dim}Calling Claude (v0 messy)...${C.reset}`);
  const messyResponse = await ask(messyPrompt, TEST_MESSAGE);
  responseBlock('v0 MESSY', messyResponse, false);

  console.log(`\n  ${C.dim}Calling Claude (v1 clean)...${C.reset}`);
  const cleanResponse = await ask(cleanPrompt, TEST_MESSAGE);
  responseBlock('v1 CLEAN', cleanResponse, true);

  // ── Key insight ──────────────────────────────────────────────────────────────

  insight(
    'Cleanup alone resolves many failures — rerun your evals after cleanup\n' +
    '  before you add a single new instruction.',
  );
}

main().catch(err => { console.error(err); process.exit(1); });
