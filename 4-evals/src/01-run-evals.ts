import fs from "fs";
import { generate } from "./lib/agent.js";
import { evaluate } from "./lib/evaluate.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";

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
  input: string;
  output: string;
  violations: string[];
}

const evalSet: EvalCase[] = JSON.parse(
  fs.readFileSync("evals/eval-set.json", "utf-8")
);

const accountData = JSON.parse(
  fs.readFileSync("data/customer-account.json", "utf-8")
);

function printEvalTable(results: EvalResult[], label: string) {
  console.log(`\n${BOLD}${label}${RESET}`);
  console.log("─".repeat(72));
  console.log(
    `${BOLD}${"ID".padEnd(10)}${"Failure Type".padEnd(26)}${"Result".padEnd(8)}Notes${RESET}`
  );
  console.log("─".repeat(72));

  for (const r of results) {
    const status = r.passed
      ? `${GREEN}PASS${RESET}`
      : `${RED}FAIL${RESET}`;
    const note = r.passed ? "" : r.violations[0]?.slice(0, 30) + "...";
    console.log(
      `${r.id.padEnd(10)}${r.failure_type.padEnd(26)}${status.padEnd(8 + 9)}${DIM}${note}${RESET}`
    );
  }

  console.log("─".repeat(72));
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const color = passed === total ? GREEN : passed === 0 ? RED : YELLOW;
  console.log(`${color}${BOLD}${passed}/${total} passed${RESET}\n`);
}

function printFailureDetail(result: EvalResult) {
  console.log(`\n${BOLD}${YELLOW}Failure detail — ${result.id} (${result.failure_type})${RESET}`);
  console.log(`${DIM}Input:${RESET}  ${result.input}`);
  console.log(`${DIM}Output:${RESET} ${result.output}`);
  console.log(`${DIM}Violations:${RESET}`);
  result.violations.forEach((v, i) => console.log(`  ${i + 1}. ${v}`));
}

async function runEvals(promptPath: string): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

  for (const c of evalSet) {
    process.stdout.write(`  Running ${c.id} (${c.failure_type})...`);
    const output = await generate(promptPath, c.input, accountData);
    const violations = await evaluate(c.input, output, c.pass_criteria);
    const passed = violations.length === 0;
    process.stdout.write(passed ? ` ${GREEN}✓${RESET}\n` : ` ${RED}✗${RESET}\n`);
    results.push({ id: c.id, failure_type: c.failure_type, passed, input: c.input, output, violations });
  }

  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}Eval Set — 5 cases${RESET}`);
console.log("─".repeat(72));
evalSet.forEach((c) => {
  console.log(`${BOLD}${c.id}${RESET}  ${DIM}${c.failure_type}${RESET}`);
  console.log(`  Input:    ${c.input}`);
  console.log(`  Criteria: ${c.pass_criteria.slice(0, 90)}...`);
});
console.log();

// Run against v0 (broken)
console.log(`${BOLD}Running evals against agent-v0 (no escalation policy)...${RESET}`);
const v0Results = await runEvals("prompts/agent-v0.txt");
printEvalTable(v0Results, "Results — agent-v0.txt");

// Show first failure in full detail
const firstFailure = v0Results.find((r) => !r.passed);
if (firstFailure) printFailureDetail(firstFailure);

// Run against v1 (fixed)
console.log(`\n${BOLD}Running evals against agent-v1 (with policy rules)...${RESET}`);
const v1Results = await runEvals("prompts/agent-v1.txt");
printEvalTable(v1Results, "Results — agent-v1.txt");
