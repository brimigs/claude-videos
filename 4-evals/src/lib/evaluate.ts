import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import type { Usage } from "./agent.js";

const client = new Anthropic();

export interface EvaluateResult {
  violations: string[];
  usage: Usage;
}

export async function evaluate(
  input: string,
  output: string,
  passCriteria: string,
  model: string = "claude-sonnet-5"
): Promise<EvaluateResult> {
  const template = fs.readFileSync("prompts/evaluator.txt", "utf-8");
  const prompt = template
    .replace("{{pass_criteria}}", passCriteria)
    .replace("{{input}}", input)
    .replace("{{output}}", output);

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    // Sonnet 5 runs adaptive thinking by default; the judge doesn't need it.
    ...(model.includes("sonnet-5") ? { thinking: { type: "disabled" as const } } : {}),
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  const text = textBlock?.text ?? "";
  const usage = {
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  };

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { violations: [`Could not parse evaluator response`], usage };
    const parsed = JSON.parse(match[0]) as { violations: string[] };
    return { violations: parsed.violations ?? [], usage };
  } catch {
    return {
      violations: [`Could not parse evaluator response: ${text.slice(0, 100)}`],
      usage,
    };
  }
}
