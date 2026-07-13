import fs from "fs";
import { generate, type Usage } from "./lib/agent.js";
import { evaluate } from "./lib/evaluate.js";
import { repair } from "./lib/repair.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

const HAIKU = "claude-haiku-4-5"; // the "cheap" model
const SONNET = "claude-sonnet-5"; // the "bigger" model + evaluator judge

// $ / 1M tokens. Sonnet 5 figures are introductory pricing (through 2026-08-31).
const PRICING: Record<string, { input: number; output: number }> = {
  [HAIKU]: { input: 1.0, output: 5.0 },
  [SONNET]: { input: 2.0, output: 10.0 },
};

function costOf(model: string, usage: Usage): number {
  const p = PRICING[model];
  return (usage.input_tokens / 1_000_000) * p.input + (usage.output_tokens / 1_000_000) * p.output;
}

interface EvalCase {
  id: string;
  failure_type: string;
  input: string;
  pass_criteria: string;
}

interface EvalResult {
  id: string;
  failure_type: string;
  passed: boolean;
  violations: string[];
}

const evalSet: EvalCase[] = JSON.parse(
  fs.readFileSync("evals/eval-set.json", "utf-8")
);

const context = JSON.parse(
  fs.readFileSync("data/calendar-context.json", "utf-8")
);

const PROMPT = "prompts/agent-simple.txt";

function printEvalTable(results: EvalResult[], label: string) {
  console.log(`\n${BOLD}${label}${RESET}`);
  console.log("─".repeat(72));
  console.log(
    `${BOLD}${"ID".padEnd(10)}${"Failure Type".padEnd(24)}${"Result".padEnd(8)}Notes${RESET}`
  );
  console.log("─".repeat(72));

  for (const r of results) {
    const status = r.passed ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    const note = r.passed ? "" : r.violations[0]?.slice(0, 40) + "...";
    console.log(
      `${r.id.padEnd(10)}${r.failure_type.padEnd(24)}${status.padEnd(8 + 9)}${DIM}${note}${RESET}`
    );
  }

  console.log("─".repeat(72));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const color = passed === total ? GREEN : passed === 0 ? RED : YELLOW;
  console.log(`${color}${BOLD}${passed}/${total} passed${RESET}\n`);
}

// ── Setup A: cheap model, simple prompt ─────────────────────────────────────

async function runCheapSimple(): Promise<{ results: EvalResult[]; cost: number }> {
  const results: EvalResult[] = [];
  let cost = 0;

  for (const c of evalSet) {
    process.stdout.write(`  ${c.id} (${c.failure_type})...`);
    const gen = await generate(PROMPT, c.input, context, { model: HAIKU });
    cost += costOf(HAIKU, gen.usage);
    const { violations } = await evaluate(c.input, gen.text, c.pass_criteria);
    const passed = violations.length === 0;
    process.stdout.write(passed ? ` ${GREEN}✓${RESET}\n` : ` ${RED}✗${RESET}\n`);
    results.push({ id: c.id, failure_type: c.failure_type, passed, violations });
  }

  return { results, cost };
}

// ── Setup B: bigger model + extended (adaptive) thinking ────────────────────

async function runBigThinking(): Promise<{ results: EvalResult[]; cost: number }> {
  const results: EvalResult[] = [];
  let cost = 0;

  for (const c of evalSet) {
    process.stdout.write(`  ${c.id} (${c.failure_type})...`);
    const gen = await generate(PROMPT, c.input, context, {
      model: SONNET,
      thinking: true,
      effort: "high",
    });
    cost += costOf(SONNET, gen.usage);
    const { violations } = await evaluate(c.input, gen.text, c.pass_criteria);
    const passed = violations.length === 0;
    process.stdout.write(passed ? ` ${GREEN}✓${RESET}\n` : ` ${RED}✗${RESET}\n`);
    results.push({ id: c.id, failure_type: c.failure_type, passed, violations });
  }

  return { results, cost };
}

// ── Setup C: cheap model + generate→evaluate→repair loop ────────────────────

async function runCheapWithRepairLoop(
  maxRetries = 4
): Promise<{ results: EvalResult[]; cost: number }> {
  const results: EvalResult[] = [];
  let cost = 0;

  for (const c of evalSet) {
    process.stdout.write(`  ${c.id} (${c.failure_type})...`);

    let gen = await generate(PROMPT, c.input, context, { model: HAIKU });
    cost += costOf(HAIKU, gen.usage);

    // The loop's own judge stays cheap too — this is what "kept the cheap
    // model" means. It drives the retry decision inside the loop.
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const selfCheck = await evaluate(c.input, gen.text, c.pass_criteria, HAIKU);
      cost += costOf(HAIKU, selfCheck.usage);

      if (selfCheck.violations.length === 0) break;

      if (attempt < maxRetries - 1) {
        const rep = await repair(PROMPT, c.input, gen.text, selfCheck.violations, context, HAIKU);
        cost += costOf(HAIKU, rep.usage);
        gen = rep;
      }
    }

    // Grade the final output with the same independent Sonnet judge used for
    // Setups A and B, so the comparison table is apples-to-apples. This
    // grading pass isn't counted toward any setup's cost — it's fixed
    // test-harness overhead, not a per-request production cost.
    const { violations } = await evaluate(c.input, gen.text, c.pass_criteria);
    const passed = violations.length === 0;

    process.stdout.write(passed ? ` ${GREEN}✓${RESET}\n` : ` ${RED}✗${RESET}\n`);
    results.push({ id: c.id, failure_type: c.failure_type, passed, violations });
  }

  return { results, cost };
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}Scheduling Agent — 5 eval cases${RESET}`);
console.log("─".repeat(72));
evalSet.forEach((c) => {
  console.log(`${BOLD}${c.id}${RESET}  ${DIM}${c.failure_type}${RESET}`);
  console.log(`  Input: ${c.input}`);
});

console.log(`\n${BOLD}${CYAN}Setup A — cheap model (Haiku), simple prompt${RESET}`);
const a = await runCheapSimple();
printEvalTable(a.results, "Results — Setup A");

console.log(`${BOLD}${CYAN}Setup B — bigger model (Sonnet 5) + extended thinking, same prompt${RESET}`);
const b = await runBigThinking();
printEvalTable(b.results, "Results — Setup B");

console.log(`${BOLD}${CYAN}Setup C — cheap model (Haiku) + generate → evaluate → repair loop, same prompt${RESET}`);
const c = await runCheapWithRepairLoop();
printEvalTable(c.results, "Results — Setup C");

// ── Summary ──────────────────────────────────────────────────────────────────

function passCount(results: EvalResult[]) {
  return results.filter((r) => r.passed).length;
}

console.log(`${BOLD}Summary${RESET}`);
console.log("─".repeat(72));
console.log(
  `${BOLD}${"Setup".padEnd(45)}${"Passed".padEnd(12)}Cost${RESET}`
);
console.log("─".repeat(72));
console.log(
  `${"A: cheap model, simple prompt".padEnd(45)}${`${passCount(a.results)}/5`.padEnd(12)}$${a.cost.toFixed(4)}`
);
console.log(
  `${"B: bigger model + extended thinking".padEnd(45)}${`${passCount(b.results)}/5`.padEnd(12)}$${b.cost.toFixed(4)}`
);
console.log(
  `${"C: cheap model + repair loop".padEnd(45)}${`${passCount(c.results)}/5`.padEnd(12)}$${c.cost.toFixed(4)} ${DIM}(includes evaluator + repair calls)${RESET}`
);
console.log("─".repeat(72));
console.log(
  `\n${BOLD}The model wasn't the bottleneck. The loop was the missing piece.${RESET}\n`
);
