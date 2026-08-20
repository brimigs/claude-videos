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

const projectContext = JSON.parse(fs.readFileSync("data/project-context.json", "utf-8"));

const input =
  "Modernize app/src/api/supportClient.js from callbacks to async/await and migrate " +
  "the React ticket UI to hooks in the same change. Remove the callback API entirely " +
  "and switch the client to fetch. What implementation approach should we take?";

const passCriteria =
  "Output names app/src/api/supportClient.js and the React component callers. Output " +
  "states whether the callback API is preserved temporarily or removed in the same " +
  "change. Output includes a staged sequence and a verification expectation. Output " +
  "does not use internal terms like 'advisor', 'escalated', or 'policy team'.";

console.log(`\n${BOLD}Four roles, one request${RESET}`);
console.log("─".repeat(72));
console.log(`${DIM}Request:${RESET} ${input}\n`);

console.log(`${CYAN}${BOLD}Executor (claude-sonnet-4-6)${RESET}`);
const escalation = await handle(input, projectContext);
const question = parseEscalation(escalation);

let finalReply: string;
if (!question) {
  finalReply = escalation;
  console.log(`${DIM}Resolved directly — no advisor needed.${RESET}`);
} else {
  console.log(`${YELLOW}Escalated:${RESET} ${question}\n`);
  console.log(`${MAGENTA}${BOLD}Advisor (claude-opus-4-8, adaptive thinking)${RESET}`);
  const { guidance } = await consult(question, projectContext);
  console.log(`${MAGENTA}Directive:${RESET} ${guidance}\n`);

  console.log(`${CYAN}${BOLD}Executor (claude-sonnet-4-6) — finalizing${RESET}`);
  finalReply = await finalize(input, projectContext, escalation, guidance);
}
console.log(`${GREEN}Executor output:${RESET}\n${finalReply}\n`);

console.log(`${BOLD}Evaluator (claude-haiku-4-5-20251001)${RESET}`);
const violations = await evaluate(input, finalReply, passCriteria);

if (violations.length === 0) {
  console.log(`${GREEN}✓ No violations — repairer not needed.${RESET}`);
} else {
  console.log(`${RED}✗ Violations found:${RESET}`);
  violations.forEach((v, i) => console.log(`  ${i + 1}. ${v}`));

  console.log(`\n${BOLD}Repairer (claude-sonnet-4-6) — fixing only what's flagged${RESET}`);
  const repaired = await repair(input, finalReply, violations, projectContext);
  console.log(`${GREEN}Repaired output:${RESET}\n${repaired}`);
}

console.log(`\n${"─".repeat(72)}`);
console.log(`${BOLD}Model roles this run:${RESET}`);
console.log(`  ${CYAN}Executor${RESET}    claude-sonnet-4-6          — always`);
console.log(`  ${MAGENTA}Advisor${RESET}     claude-opus-4-8            — only on the hard decision`);
console.log(`  Evaluator   claude-haiku-4-5-20251001  — always, cheap, checks only`);
console.log(`  Repairer    claude-sonnet-4-6          — only if the evaluator found something\n`);
