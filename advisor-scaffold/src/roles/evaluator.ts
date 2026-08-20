import type { Runtime } from "../types.js";
import { loadPrompt } from "../config.js";
import { assertNotRefusal, textOf } from "./response.js";

export async function evaluate(
  rt: Runtime,
  task: string,
  output: string,
  passCriteria: string
): Promise<string[]> {
  const prompt = loadPrompt(rt, "evaluator")
    .replace("{{pass_criteria}}", passCriteria)
    .replace("{{input}}", task)
    .replace("{{output}}", output);

  const response = await rt.client.messages.create({
    model: rt.config.models.evaluator,
    max_tokens: rt.config.maxTokens.evaluator,
    messages: [{ role: "user", content: prompt }],
  });
  assertNotRefusal(response, "Evaluator");

  const text = textOf(response.content);
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return ["Could not parse evaluator response — no JSON object found."];
    const parsed = JSON.parse(match[0]) as { violations?: string[] };
    return parsed.violations ?? [];
  } catch {
    return [`Could not parse evaluator response: ${text.slice(0, 120)}`];
  }
}
