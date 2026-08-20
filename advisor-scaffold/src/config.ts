import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { AdvisorConfig, Runtime } from "./types.js";
import { UsageTracker } from "./usage.js";

const CONFIG_FILE = "advisor.config.json";

const DEFAULTS: AdvisorConfig = {
  models: {
    executor: "claude-sonnet-5",
    advisor: "claude-opus-5",
    evaluator: "claude-haiku-4-5",
    repairer: "claude-sonnet-5",
  },
  maxTokens: { executor: 2048, advisor: 4096, evaluator: 1024, repairer: 2048 },
  advisorEffort: "high",
  advisorFallbackModel: "claude-opus-4-8",
  contextFile: "advisor-context.json",
  promptsDir: "prompts",
  defaultPassCriteria:
    "The output names the specific files or modules involved. It gives a concrete, " +
    "ordered sequence of changes and at least one verification step. It does not " +
    "claim to have edited files or run anything. It does not mention internal roles " +
    "such as 'advisor', 'escalated', 'evaluator', or 'repairer'.",
};

function packageRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

// Walk up from cwd so the CLI works from anywhere inside the host repo;
// fall back to the scaffold's own directory (which ships a config).
export function findRoot(startDir: string = process.cwd()): string {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, CONFIG_FILE))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return packageRoot();
    dir = parent;
  }
}

function loadDotEnv(root: string): void {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = raw.replace(/^(["'])(.*)\1$/, "$2");
  }
}

export function createRuntime(rootDir?: string): Runtime {
  const root = rootDir ?? findRoot();
  loadDotEnv(root);

  let config = DEFAULTS;
  const configPath = path.join(root, CONFIG_FILE);
  if (fs.existsSync(configPath)) {
    const user = JSON.parse(fs.readFileSync(configPath, "utf-8")) as Partial<AdvisorConfig>;
    config = {
      ...DEFAULTS,
      ...user,
      models: { ...DEFAULTS.models, ...(user.models ?? {}) },
      maxTokens: { ...DEFAULTS.maxTokens, ...(user.maxTokens ?? {}) },
    };
  }

  const contextPath = path.resolve(root, config.contextFile);
  const contextFound = fs.existsSync(contextPath);
  const projectContext: object = contextFound
    ? JSON.parse(fs.readFileSync(contextPath, "utf-8"))
    : {
        note:
          "No project context file was provided. Reason from the task description " +
          "alone and be explicit about any assumptions you make about this codebase.",
      };

  return {
    client: new Anthropic(),
    config,
    root,
    projectContext,
    contextFound,
    tracker: new UsageTracker(),
  };
}

type PromptName = "executor" | "advisor" | "evaluator";

export function loadPrompt(rt: Runtime, name: PromptName): string {
  const promptPath = path.resolve(rt.root, rt.config.promptsDir, `${name}.txt`);
  if (!fs.existsSync(promptPath)) {
    // The host repo overrode promptsDir (or contextFile pointed elsewhere) but
    // didn't copy the templates — fall back to the ones shipped with the scaffold.
    const bundled = path.join(packageRoot(), "prompts", `${name}.txt`);
    return fs.readFileSync(bundled, "utf-8");
  }
  return fs.readFileSync(promptPath, "utf-8");
}

// The role prompt + project context are byte-identical across calls, so mark
// them as a cache breakpoint: handle → finalize → repair (and repeat runs
// within the cache TTL) read the prefix from cache instead of re-paying for it.
// Prefixes under ~1024 tokens silently don't cache — harmless, just no hit.
export function buildRoleSystem(
  rt: Runtime,
  name: "executor" | "advisor"
): Anthropic.TextBlockParam[] {
  const text = loadPrompt(rt, name).replace(
    "{{project_context}}",
    JSON.stringify(rt.projectContext, null, 2)
  );
  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}
