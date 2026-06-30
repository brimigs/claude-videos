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

interface EvalCase {
  id: string;
  failure_type: string;
  input: string;
  pass_criteria: string;
}

const evalSet: EvalCase[] = JSON.parse(
  fs.readFileSync("evals/eval-set.json", "utf-8")
);
const accountData = JSON.parse(
  fs.readFileSync("data/customer-account.json", "utf-8")
);

// ── The loop ──────────────────────────────────────────────────────────────────

async function generateWithRepair(
  evalCase: EvalCase,
  promptPath: string,
  maxRetries = 3
): Promise<string> {
  let output = await generate(promptPath, evalCase.input, accountData);

  for (let i = 0; i < maxRetries; i++) {
    const attempt = i + 1;

    console.log(`\n${DIM}Output (attempt ${attempt}):${RESET}`);
    console.log("  " + output.replace(/\n/g, "\n  "));

    const violations = await evaluate(
      evalCase.input,
      output,
      evalCase.pass_criteria
    );

    if (violations.length === 0) {
      console.log(`\n  ${GREEN}✓ All checks passed — accepted on attempt ${attempt}.${RESET}`);
      return output;
    }

    console.log(`\n  ${RED}✗ Violations (attempt ${attempt}/${maxRetries}):${RESET}`);
    violations.forEach((v, idx) => console.log(`    ${idx + 1}. ${v}`));

    if (i < maxRetries - 1) {
      console.log(`\n${CYAN}  → Repairing...${RESET}`);
      output = await repair(promptPath, evalCase.input, output, violations, accountData);
    }
  }

  console.log(`\n  ${RED}✗ Exhausted ${maxRetries} attempts — logging failure.${RESET}`);
  await logFailure({ input: evalCase.input, output });
  return output;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const target = evalSet[0]; // case-01: escalation_boundary

console.log(`\n${BOLD}Generate → Evaluate → Repair Loop${RESET}`);
console.log("─".repeat(60));
console.log(`${BOLD}Case:${RESET}         ${target.id} — ${target.failure_type}`);
console.log(`${BOLD}Input:${RESET}        ${target.input}`);
console.log(`${BOLD}Pass criteria:${RESET} ${target.pass_criteria.slice(0, 80)}...`);

// First: show the loop failing with the broken prompt (v0)
console.log(`\n${BOLD}── Round 1: using agent-v0 (no policy rules) ──${RESET}`);
console.log(`${DIM}Generating...${RESET}`);
await generateWithRepair(target, "prompts/agent-v0.txt", 2);

// Then: show the loop succeeding with the fixed prompt (v1)
console.log(`\n\n${BOLD}── Round 2: using agent-v1 (with policy rules) ──${RESET}`);
console.log(`${DIM}Generating...${RESET}`);
await generateWithRepair(target, "prompts/agent-v1.txt", 3);
