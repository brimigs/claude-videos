import Anthropic from "@anthropic-ai/sdk";
import { createRuntime } from "./config.js";
import { runAdvisorPipeline } from "./pipeline.js";
import type { PipelineEvent } from "./types.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";

const HELP = `advisor — route an engineering task through the advisor pipeline

Usage:
  npm run advisor -- "<task>" [options]

Options:
  --criteria "<text>"   Pass criteria the evaluator checks (defaults to advisor.config.json)
  --no-verify           Skip the evaluator/repairer verification loop
  --json                Print the structured result as JSON (no live output)
  -h, --help            Show this help

Examples:
  npm run advisor -- "Fix the off-by-one in src/pagination.ts"
  npm run advisor -- "Migrate our REST client to gRPC" --criteria "Names a rollback plan"
`;

interface CliArgs {
  task: string;
  criteria?: string;
  verify: boolean;
  json: boolean;
}

function parseArgs(argv: string[]): CliArgs | null {
  const taskParts: string[] = [];
  let criteria: string | undefined;
  let verify = true;
  let json = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") return null;
    else if (arg === "--no-verify") verify = false;
    else if (arg === "--json") json = true;
    else if (arg === "--criteria") criteria = argv[++i];
    else taskParts.push(arg);
  }

  const task = taskParts.join(" ").trim();
  if (!task) return null;
  return { task, criteria, verify, json };
}

function printEvent(event: PipelineEvent): void {
  switch (event.type) {
    case "executor_start":
      console.log(`${CYAN}${BOLD}Executor${RESET} ${DIM}(${event.model})${RESET}`);
      break;
    case "escalated":
      console.log(`${YELLOW}Escalated:${RESET} ${event.question}\n`);
      break;
    case "advisor_start":
      console.log(
        `${MAGENTA}${BOLD}Advisor${RESET} ${DIM}(${event.model}, adaptive thinking)${RESET}`
      );
      break;
    case "advisor_guidance":
      console.log(`${MAGENTA}Directive:${RESET} ${event.guidance}\n`);
      break;
    case "finalize_start":
      console.log(`${CYAN}${BOLD}Executor — finalizing with guidance${RESET}`);
      break;
    case "draft_output":
      if (!event.escalated) {
        console.log(`${DIM}Resolved directly — no advisor needed.${RESET}`);
      }
      console.log(`${GREEN}Output:${RESET}\n${event.output}\n`);
      break;
    case "evaluator_start":
      console.log(`${BOLD}Evaluator${RESET} ${DIM}(${event.model})${RESET}`);
      break;
    case "evaluator_result":
      if (event.violations.length === 0) {
        console.log(`${GREEN}✓ No violations — repairer not needed.${RESET}`);
      } else {
        console.log(`${RED}✗ Violations:${RESET}`);
        event.violations.forEach((v, i) => console.log(`  ${i + 1}. ${v}`));
      }
      break;
    case "repair_start":
      console.log(
        `\n${BOLD}Repairer${RESET} ${DIM}(${event.model}) — fixing only what's flagged${RESET}`
      );
      break;
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    console.log(HELP);
    process.exit(process.argv.length > 2 ? 0 : 1);
  }

  const rt = createRuntime();

  if (!args.json) {
    console.log(`\n${BOLD}Advisor pipeline${RESET}`);
    console.log("─".repeat(72));
    console.log(`${DIM}Root:${RESET} ${rt.root}`);
    if (!rt.contextFound) {
      console.log(
        `${YELLOW}No ${rt.config.contextFile} found — running with an empty project ` +
          `context. See the README for how to generate one.${RESET}`
      );
    }
    console.log(`${DIM}Task:${RESET} ${args.task}\n`);
  }

  const result = await runAdvisorPipeline(
    args.task,
    {
      passCriteria: args.criteria,
      verify: args.verify,
      onEvent: args.json ? undefined : printEvent,
    },
    rt
  );

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (result.repaired) {
    console.log(`${GREEN}Repaired output:${RESET}\n${result.output}\n`);
  }

  console.log(`\n${"─".repeat(72)}`);
  console.log(`${BOLD}Model roles this run:${RESET}`);
  const { models } = result;
  console.log(`  ${CYAN}Executor${RESET}    ${models.executor} — always`);
  console.log(
    `  ${MAGENTA}Advisor${RESET}     ${models.advisor} — ${
      result.escalated ? "consulted on the hard decision" : "not needed this run"
    }`
  );
  console.log(
    `  Evaluator   ${models.evaluator} — ${args.verify ? "checked the output" : "skipped (--no-verify)"}`
  );
  console.log(
    `  Repairer    ${models.repairer} — ${result.repaired ? "fixed flagged violations" : "not needed"}\n`
  );

  const { usage } = result;
  const dollars = (n: number | null): string => (n === null ? "n/a" : `$${n.toFixed(4)}`);
  console.log(`${BOLD}Usage this run (estimated):${RESET}`);
  for (const e of usage.entries) {
    console.log(
      `  ${e.role.padEnd(10)} ${e.model.padEnd(18)} ` +
        `${String(e.calls).padStart(2)} call${e.calls === 1 ? " " : "s"}  ` +
        `in ${String(e.inputTokens).padStart(6)}  out ${String(e.outputTokens).padStart(6)}  ` +
        `cache-read ${String(e.cacheReadTokens).padStart(6)}  ${dollars(e.estimatedCostUSD)}`
    );
  }
  console.log(`  ${BOLD}Total ≈ ${dollars(usage.estimatedCostUSD)}${RESET}`);
  if (usage.allOnAdvisorCostUSD !== null && usage.savingsPercent !== null) {
    console.log(
      `  ${DIM}Same tokens all on ${models.advisor}: ~${dollars(usage.allOnAdvisorCostUSD)} ` +
        `→ the routing rule saved ~${usage.savingsPercent.toFixed(0)}%${RESET}\n`
    );
  }
}

main().catch((error: unknown) => {
  if (error instanceof Anthropic.AuthenticationError) {
    console.error(
      `${RED}Authentication failed.${RESET} Set ANTHROPIC_API_KEY in your environment ` +
        `or in a .env file next to advisor.config.json (see .env.example), or log in ` +
        `with \`ant auth login\`.`
    );
  } else {
    console.error(`${RED}${error instanceof Error ? error.message : String(error)}${RESET}`);
  }
  process.exit(1);
});
