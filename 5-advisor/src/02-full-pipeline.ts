import fs from "fs";
import { handle, parseEscalation, finalize } from "./lib/executor.js";
import { consult } from "./lib/advisor.js";
import { evaluate } from "./lib/evaluator.js";
import { repair } from "./lib/repairer.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const DIM = "\x1b[2m";

const accountData = JSON.parse(fs.readFileSync("data/customer-account.json", "utf-8"));

const input =
  "I've been charged twice this month, your service has gone down on me twice this " +
  "quarter, and I want to cancel my contract today without the early termination fee " +
  "— plus a credit for the downtime.";

const passCriteria =
  "Reply states the exact dollar amount of any fee waived or credit applied. Reply " +
  "does not use internal terms like 'advisor', 'escalated', or 'policy team'. Reply " +
  "acknowledges the service incidents before discussing the financial resolution.";

console.log(`\n${BOLD}Four roles, one request${RESET}`);
console.log("─".repeat(72));
console.log(`${DIM}Customer:${RESET} ${input}\n`);

console.log(`${CYAN}${BOLD}Executor (claude-sonnet-4-6)${RESET}`);
const escalation = await handle(input, accountData);
const question = parseEscalation(escalation);

let finalReply: string;
if (!question) {
  finalReply = escalation;
  console.log(`${DIM}Resolved directly — no advisor needed.${RESET}`);
} else {
  console.log(`${YELLOW}Escalated:${RESET} ${question}\n`);
  console.log(`${MAGENTA}${BOLD}Advisor (claude-opus-4-8, adaptive thinking)${RESET}`);
  const { guidance } = await consult(question, accountData);
  console.log(`${MAGENTA}Directive:${RESET} ${guidance}\n`);

  console.log(`${CYAN}${BOLD}Executor (claude-sonnet-4-6) — finalizing${RESET}`);
  finalReply = await finalize(input, accountData, escalation, guidance);
}
console.log(`${GREEN}Reply:${RESET}\n${finalReply}\n`);

console.log(`${BOLD}Evaluator (claude-haiku-4-5-20251001)${RESET}`);
const violations = await evaluate(input, finalReply, passCriteria);

if (violations.length === 0) {
  console.log(`${GREEN}✓ No violations — repairer not needed.${RESET}`);
} else {
  console.log(`${RED}✗ Violations found:${RESET}`);
  violations.forEach((v, i) => console.log(`  ${i + 1}. ${v}`));

  console.log(`\n${BOLD}Repairer (claude-sonnet-4-6) — fixing only what's flagged${RESET}`);
  const repaired = await repair(input, finalReply, violations, accountData);
  console.log(`${GREEN}Repaired reply:${RESET}\n${repaired}`);
}

console.log(`\n${"─".repeat(72)}`);
console.log(`${BOLD}Model roles this run:${RESET}`);
console.log(`  ${CYAN}Executor${RESET}    claude-sonnet-4-6          — always`);
console.log(`  ${MAGENTA}Advisor${RESET}     claude-opus-4-8            — only on the hard decision`);
console.log(`  Evaluator   claude-haiku-4-5-20251001  — always, cheap, checks only`);
console.log(`  Repairer    claude-sonnet-4-6          — only if the evaluator found something\n`);
