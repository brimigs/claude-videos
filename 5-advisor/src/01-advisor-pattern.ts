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

const projectContext = JSON.parse(fs.readFileSync("data/project-context.json", "utf-8"));

function modelTag(role: string, model: string, color: string) {
  console.log(`${color}${BOLD}[${role} → ${model}]${RESET}`);
}

console.log(`\n${BOLD}Case A — localized coding request${RESET}`);
console.log("─".repeat(72));
const easyInput =
  "Fix the session expiration bug in app/src/auth/session.js. expiresAt is stored " +
  "in seconds, but isExpired compares it to Date.now().";
console.log(`${DIM}Request:${RESET} ${easyInput}\n`);
modelTag("executor", "claude-sonnet-4-6", CYAN);
const easyReply = await handle(easyInput, projectContext);
console.log(`${GREEN}Executor output:${RESET} ${easyReply}`);
console.log(`${DIM}One call, Sonnet only — the advisor never runs.${RESET}\n`);

console.log(`${BOLD}Case B — architecture and migration decision${RESET}`);
console.log("─".repeat(72));
const hardInput =
  "Modernize app/src/api/supportClient.js from callbacks to async/await and migrate " +
  "the React ticket UI to hooks in the same change. Remove the callback API entirely " +
  "and switch the client to fetch. What implementation approach should we take?";
console.log(`${DIM}Request:${RESET} ${hardInput}\n`);

modelTag("executor", "claude-sonnet-4-6", CYAN);
const escalation = await handle(hardInput, projectContext);
const question = parseEscalation(escalation);

if (!question) {
  console.log(`${YELLOW}Executor answered directly — no escalation:${RESET}`);
  console.log(escalation);
} else {
  console.log(`${YELLOW}Executor escalated:${RESET} ${question}\n`);

  modelTag("advisor", "claude-opus-4-8 — adaptive thinking, effort: high", MAGENTA);
  const { guidance, thinking } = await consult(question, projectContext);

  if (thinking) {
    console.log(`\n${DIM}Advisor reasoning (summarized):${RESET}`);
    console.log(`${DIM}${thinking}${RESET}`);
  }
  console.log(`\n${MAGENTA}Advisor directive:${RESET} ${guidance}\n`);

  modelTag("executor", "claude-sonnet-4-6 — implementing guidance", CYAN);
  const finalReply = await finalize(hardInput, projectContext, escalation, guidance);
  console.log(`\n${GREEN}Final executor output:${RESET}\n${finalReply}`);
}

console.log(`\n${"─".repeat(72)}`);
console.log(
  `${BOLD}Case A: one call for a localized fix. Case B: three calls — Sonnet spots the\nrisky migration decision, Opus chooses the path, Sonnet turns it into implementation\nguidance — and Opus only runs because the decision was genuinely hard.${RESET}\n`
);
