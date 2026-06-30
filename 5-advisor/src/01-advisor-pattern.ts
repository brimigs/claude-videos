import fs from "fs";
import { handle, parseEscalation, finalize } from "./lib/executor.js";
import { consult } from "./lib/advisor.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const DIM = "\x1b[2m";

const accountData = JSON.parse(fs.readFileSync("data/customer-account.json", "utf-8"));

function modelTag(role: string, model: string, color: string) {
  console.log(`${color}${BOLD}[${role} → ${model}]${RESET}`);
}

console.log(`\n${BOLD}Case A — routine request${RESET}`);
console.log("─".repeat(72));
const easyInput = "What plan am I on, and when's my next bill?";
console.log(`${DIM}Customer:${RESET} ${easyInput}\n`);
modelTag("executor", "claude-sonnet-4-6", CYAN);
const easyReply = await handle(easyInput, accountData);
console.log(`${GREEN}Reply:${RESET} ${easyReply}`);
console.log(`${DIM}One call, Sonnet only — the advisor never runs.${RESET}\n`);

console.log(`${BOLD}Case B — the hard case${RESET}`);
console.log("─".repeat(72));
const hardInput =
  "I've been charged twice this month, your service has gone down on me twice this " +
  "quarter, and I want to cancel my contract today without the early termination fee " +
  "— plus a credit for the downtime.";
console.log(`${DIM}Customer:${RESET} ${hardInput}\n`);

modelTag("executor", "claude-sonnet-4-6", CYAN);
const escalation = await handle(hardInput, accountData);
const question = parseEscalation(escalation);

if (!question) {
  console.log(`${YELLOW}Executor answered directly — no escalation:${RESET}`);
  console.log(escalation);
} else {
  console.log(`${YELLOW}Executor escalated:${RESET} ${question}\n`);

  modelTag("advisor", "claude-opus-4-8 — adaptive thinking, effort: high", MAGENTA);
  const { guidance, thinking } = await consult(question, accountData);

  if (thinking) {
    console.log(`\n${DIM}Advisor reasoning (summarized):${RESET}`);
    console.log(`${DIM}${thinking}${RESET}`);
  }
  console.log(`\n${MAGENTA}Advisor directive:${RESET} ${guidance}\n`);

  modelTag("executor", "claude-sonnet-4-6 — implementing guidance", CYAN);
  const finalReply = await finalize(hardInput, accountData, escalation, guidance);
  console.log(`\n${GREEN}Final reply:${RESET}\n${finalReply}`);
}

console.log(`\n${"─".repeat(72)}`);
console.log(
  `${BOLD}Case A: one call, Sonnet only. Case B: three calls — Sonnet escalates, Opus\ndecides, Sonnet delivers — and Opus only runs because the decision was genuinely\nhard.${RESET}\n`
);
