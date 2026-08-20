export type RoleName = "executor" | "advisor" | "evaluator" | "repairer";

// USD per million tokens.
export interface ModelPricing {
  input: number;
  output: number;
}

// Prices drift — override via the "pricing" key in advisor.config.json.
export const DEFAULT_PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-fable-5": { input: 10, output: 50 },
};

export interface UsageEntry {
  role: RoleName;
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface SummarizedUsageEntry extends UsageEntry {
  estimatedCostUSD: number | null;
}

export interface UsageSummary {
  entries: SummarizedUsageEntry[];
  totals: Omit<UsageEntry, "role" | "model">;
  /** null when any model in the run has no known pricing */
  estimatedCostUSD: number | null;
  /** what the same token volume would have cost run entirely on the advisor model */
  allOnAdvisorCostUSD: number | null;
  savingsPercent: number | null;
}

interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

interface TokenCounts {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

function costOf(entry: TokenCounts, pricing: ModelPricing | undefined): number | null {
  if (!pricing) return null;
  const M = 1_000_000;
  return (
    (entry.inputTokens * pricing.input) / M +
    (entry.outputTokens * pricing.output) / M +
    (entry.cacheReadTokens * pricing.input * 0.1) / M +
    (entry.cacheWriteTokens * pricing.input * 1.25) / M
  );
}

export class UsageTracker {
  private entries: UsageEntry[] = [];

  reset(): void {
    this.entries = [];
  }

  record(role: RoleName, model: string, usage: UsageLike): void {
    const existing = this.entries.find((e) => e.role === role && e.model === model);
    const entry = existing ?? {
      role,
      model,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };
    entry.calls += 1;
    entry.inputTokens += usage.input_tokens;
    entry.outputTokens += usage.output_tokens;
    entry.cacheReadTokens += usage.cache_read_input_tokens ?? 0;
    entry.cacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
    if (!existing) this.entries.push(entry);
  }

  summarize(
    advisorModel: string,
    pricingOverrides?: Record<string, ModelPricing>
  ): UsageSummary {
    const pricing = { ...DEFAULT_PRICING, ...(pricingOverrides ?? {}) };

    const entries: SummarizedUsageEntry[] = this.entries.map((e) => ({
      ...e,
      estimatedCostUSD: costOf(e, pricing[e.model]),
    }));

    const totals = entries.reduce(
      (acc, e) => ({
        calls: acc.calls + e.calls,
        inputTokens: acc.inputTokens + e.inputTokens,
        outputTokens: acc.outputTokens + e.outputTokens,
        cacheReadTokens: acc.cacheReadTokens + e.cacheReadTokens,
        cacheWriteTokens: acc.cacheWriteTokens + e.cacheWriteTokens,
      }),
      { calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
    );

    const estimatedCostUSD = entries.every((e) => e.estimatedCostUSD !== null)
      ? entries.reduce((sum, e) => sum + (e.estimatedCostUSD ?? 0), 0)
      : null;

    // Counterfactual: same token volume, every call priced at the advisor
    // model's rates. Rough by design — it exists to show the order of
    // magnitude the routing rule saves.
    const allOnAdvisorCostUSD = costOf(totals, pricing[advisorModel]);

    const savingsPercent =
      estimatedCostUSD !== null && allOnAdvisorCostUSD !== null && allOnAdvisorCostUSD > 0
        ? ((allOnAdvisorCostUSD - estimatedCostUSD) / allOnAdvisorCostUSD) * 100
        : null;

    return { entries, totals, estimatedCostUSD, allOnAdvisorCostUSD, savingsPercent };
  }
}
