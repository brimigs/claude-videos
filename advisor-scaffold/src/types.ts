import type Anthropic from "@anthropic-ai/sdk";
import type { ModelPricing, UsageSummary, UsageTracker } from "./usage.js";

export interface RoleModels {
  executor: string;
  advisor: string;
  evaluator: string;
  repairer: string;
}

export interface RoleTokens {
  executor: number;
  advisor: number;
  evaluator: number;
  repairer: number;
}

export interface AdvisorConfig {
  models: RoleModels;
  maxTokens: RoleTokens;
  advisorEffort: "low" | "medium" | "high" | "xhigh" | "max";
  advisorFallbackModel: string | null;
  contextFile: string;
  promptsDir: string;
  defaultPassCriteria: string;
  /** Per-model USD/MTok price overrides for the cost summary (merged over built-in defaults). */
  pricing?: Record<string, ModelPricing>;
}

export interface Runtime {
  client: Anthropic;
  config: AdvisorConfig;
  root: string;
  projectContext: object;
  contextFound: boolean;
  // Accumulates response.usage across role calls. runAdvisorPipeline resets it
  // at the start of each run, so one Runtime must not run pipelines concurrently.
  tracker: UsageTracker;
}

export type PipelineEvent =
  | { type: "executor_start"; model: string }
  | { type: "escalated"; question: string }
  | { type: "advisor_start"; model: string }
  | { type: "advisor_guidance"; guidance: string; thinking: string }
  | { type: "finalize_start" }
  | { type: "draft_output"; output: string; escalated: boolean }
  | { type: "evaluator_start"; model: string }
  | { type: "evaluator_result"; violations: string[] }
  | { type: "repair_start"; model: string };

export interface PipelineOptions {
  passCriteria?: string;
  verify?: boolean;
  onEvent?: (event: PipelineEvent) => void;
}

export interface PipelineResult {
  output: string;
  escalated: boolean;
  escalationQuestion: string | null;
  guidance: string | null;
  advisorThinking: string | null;
  violations: string[];
  repaired: boolean;
  models: RoleModels;
  usage: UsageSummary;
}
