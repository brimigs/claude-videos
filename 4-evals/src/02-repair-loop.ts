import fs from "fs";
import { generate } from "./lib/agent.js";
import { evaluate } from "./lib/evaluate.js";
import { repair, logFailure } from "./lib/repair.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";

const HAIKU = "claude-haiku-4-5";
const PROMPT = "prompts/agent-simple.txt";

interface EvalCase {
  id: string;
  failure_type: string;
  input: string;
  pass_criteria: string;
}

const evalSet: EvalCase[] = JSON.parse(
  fs.readFileSync("evals/eval-set.json", "utf-8")
);
const context = JSON.parse(
  fs.readFileSync("data/calendar-context.json", "utf-8")
);

// ── One-shot: no loop, no retry ──────────────────────────────────────────────

async function oneShot(evalCase: EvalCase): Promise<void> {
  const gen = await generate(PROMPT, evalCase.input, context, { model: HAIKU });

  console.log(`\n${DIM}Output:${RESET}`);
  console.log("  " + gen.text.replace(/\n/g, "\n  "));

  const { violations } = await evaluate(evalCase.input, gen.text, evalCase.pass_criteria);

  if (violations.length === 0) {
    console.log(`\n  ${GREEN}✓ All checks passed.${RESET}`);
  } else {
    console.log(`\n  ${RED}✗ Violations:${RESET}`);
    violations.forEach((v, i) => console.log(`    ${i + 1}. ${v}`));
  }
}

// ── The loop: generate → evaluate → repair ──────────────────────────────────

async function generateWithRepair(evalCase: EvalCase, maxRetries = 4): Promise<string> {
  let gen = await generate(PROMPT, evalCase.input, context, { model: HAIKU });

  for (let i = 0; i < maxRetries; i++) {
    const attempt = i + 1;

    console.log(`\n${DIM}Output (attempt ${attempt}):${RESET}`);
    console.log("  " + gen.text.replace(/\n/g, "\n  "));

    const { violations } = await evaluate(evalCase.input, gen.text, evalCase.pass_criteria);

    if (violations.length === 0) {
      console.log(`\n  ${GREEN}✓ All checks passed — accepted on attempt ${attempt}.${RESET}`);
      return gen.text;
    }

    console.log(`\n  ${RED}✗ Violations (attempt ${attempt}/${maxRetries}):${RESET}`);
    violations.forEach((v, idx) => console.log(`    ${idx + 1}. ${v}`));

    if (i < maxRetries - 1) {
      console.log(`\n${CYAN}  → Repairing...${RESET}`);
      gen = await repair(PROMPT, evalCase.input, gen.text, violations, context, HAIKU);
    }
  }

  console.log(`\n  ${RED}✗ Exhausted ${maxRetries} attempts — logging failure.${RESET}`);
  await logFailure({ input: evalCase.input, output: gen.text });
  return gen.text;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const target = evalSet[4]; // case-05: ambiguous_date — reliably fails the naive prompt

console.log(`\n${BOLD}Generate → Evaluate → Repair Loop${RESET}`);
console.log("─".repeat(60));
console.log(`${BOLD}Case:${RESET}          ${target.id} — ${target.failure_type}`);
console.log(`${BOLD}Input:${RESET}         ${target.input}`);
console.log(`${BOLD}Pass criteria:${RESET} ${target.pass_criteria.slice(0, 90)}...`);
console.log(`${BOLD}Model:${RESET}         ${HAIKU} (same model, same prompt, in both rounds)`);

// First: the cheap model, one shot, no loop — this is what "just ship it" looks like.
console.log(`\n${BOLD}── Round 1: single generation, no loop ──${RESET}`);
console.log(`${DIM}Generating...${RESET}`);
await oneShot(target);

// Then: the same model, same prompt, wrapped in a generate→evaluate→repair loop.
console.log(`\n\n${BOLD}── Round 2: generate → evaluate → repair loop ──${RESET}`);
console.log(`${DIM}Generating...${RESET}`);
await generateWithRepair(target);
